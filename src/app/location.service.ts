/* eslint-disable quote-props */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import BackgroundGeolocation, {
  Location,
} from '@transistorsoft/capacitor-background-geolocation';
import * as turf from '@turf/helpers';
import { booleanPointInPolygon, Point, Polygon } from '@turf/turf';
import { Storage } from '@ionic/storage-angular';
import { Timecard } from './models/timecard.model';
import { DataService } from './data.service';
import { Shift } from './models/shift.model';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private activeTimecard = new Timecard('0', '0', new Date(0), false);
  private state: any;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private dataSvc: DataService
  ) {
    this.state = {
      enabled: false,
      isMoving: false,
      geofenceProximityRadius: 1000,
      trackingMode: 1,
      isChangingPace: false,
      activityIcon: null,
      odometer: 0,
      provider: {
        gps: true,
        network: true,
        enabled: true,
        status: -1,
      },
      containerBorder: 'none',
    };
  }

  setupPlugin() {
    console.log('setting up plugin');
    // this.onHeartbeat = this.onHeartbeat.bind(this);

    BackgroundGeolocation.onLocation((event) => {
      const logger = BackgroundGeolocation.logger;
      BackgroundGeolocation.getState().then((state) => {
        logger.debug('onLocation fired ' + event);
        logger.debug('URL of plugin onLocation: ' + state.url);
        logger.debug('State of plugin onLocation: ' + state.enabled);
      });
    });
    BackgroundGeolocation.onMotionChange((event) => {
      if (event.isMoving) {
        console.log(
          '[onMotionChange] Device has just started MOVING ',
          event.location
        );
      } else {
        this.dataSvc.sendLocationUpdateDebug('device is stopped');

        console.log(
          '[onMotionChange] Device has just STOPPED:  ',
          event.location
        );
      }
    });
    BackgroundGeolocation.onHttp((httpEvent) => {
      BackgroundGeolocation.logger.debug(
        '[http] ' + httpEvent.success + httpEvent.status + httpEvent.responseText
      );
      const response = JSON.parse(httpEvent.responseText);
      BackgroundGeolocation.logger.debug('RESPONSE: ' + response);
      console.log('RESPONSE: ', JSON.stringify(httpEvent));
    });


    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      reset: true,
      showsBackgroundLocationIndicator: true,
      debug: false,
      maxRecordsToPersist: 1,
      heartbeatInterval: 60,
      preventSuspend: true,
      foregroundService: true,
      enableHeadless: false,
      autoSync: true,
      stationaryRadius: 25,
      locationAuthorizationRequest: 'Always',
      useSignificantChangesOnly: false,
      stopTimeout: 1,
      url: '',
      params: {},
      headers: {},
      locationAuthorizationAlert: {
        titleWhenNotEnabled: 'Location services unavailable',
        titleWhenOff: 'Location services disabled',
        instructions: 'You must enable \'Always\' in location-services',
        cancelButton: 'Cancel',
        settingsButton: 'Settings'
      },
      notification: {
        title: 'You are checked in!',
        text: 'Enjoy your day ☀️',
        sticky: true,
      },
    }).then(async (state) => {
      console.log('[ready] success', state);
      this.state.enabled = state.enabled;
    });
  }
  startTracking(shift: Shift, token: string) {
    const authToken: string = 'Bearer ' + token;
    BackgroundGeolocation.setConfig({
      url: 'https://app.jmcleanco.com/api/1.1/wf/process_location_data/',
      headers: {
        'Authorization': authToken,
      },
      extras: {
        'schedule': shift.shiftId,
        'token': authToken
      },
    }).then((state) => {
      BackgroundGeolocation.start().then((state2) => {
        BackgroundGeolocation.logger.debug(
          'Current Config: ' + JSON.stringify(state2)
        );
        BackgroundGeolocation.logger.debug('location tracking enabled');
      });
    });
  }
  stopTracking() {
    BackgroundGeolocation.setConfig({
      url: '',
      headers: {},
      params: {},
      extras: {}
    }).then((state) => {
      BackgroundGeolocation.stop().then((state2) => {
        BackgroundGeolocation.logger.debug('location tracking disabled');
        BackgroundGeolocation.logger.debug(
          'Current Config: ' + JSON.stringify(state2)
        );
      });
    });
  }

  async getLocation() {
    const location = await BackgroundGeolocation.getCurrentPosition({
      timeout: 30,
      persist: false,
      maximumAge: 5000,
      desiredAccuracy: 10,
      samples: 3,
      // eslint-disable-next-line arrow-body-style
    });
    const requestedInfo = {
      lat: location.coords.latitude,
      long: location.coords.longitude,
    };
    return requestedInfo;
  }
  checkPoly2(poly: string, lat: number, long: number) {
    const polyJSON = JSON.parse(poly);
    const latlong = turf.point([long, lat]);
    const turfPoly = turf.polygon(polyJSON);
    const isInPoly = booleanPointInPolygon(latlong, turfPoly);
    return isInPoly;
  }

  // onHeartbeat(event: Location) {
  //   const logger = BackgroundGeolocation.logger;
  //   logger.debug('Location event fired fired');
  //   // let log = await logger.getLog();
  //   console.log('loc event: ', event);
  //   if (this.activeTimecard.activeShiftId !== '0') {
  //     this.storage.get('poly').then((p) => {
  //       console.log('grabbed poly');
  //       const bool = this.checkPoly2(
  //         p,
  //         event.coords.latitude,
  //         event.coords.longitude
  //       );
  //       if (bool) {
  //         console.log('Cleaner still in poly');
  //         logger.debug('Cleaner still in poly');
  //         this.dataSvc.sendLocationUpdateDebug('device is in poly');

  //         // logger.emailLog('chrismcd0413@gmail.com').then(() => {
  //         //   console.log('emailed logs');
  //         // });
  //       } else {
  //         console.log('Cleaner has left poly');
  //         logger.debug('Cleaner has left poly');
  //         this.dataSvc.sendLocationUpdateDebug('device is NOT in poly');

  //         // logger.emailLog('chrismcd0413@gmail.com').then(() => {
  //         //   console.log('emailed logs');
  //         // });
  //       }
  //     });
  //   }
  // }
  setTimecard(card: Timecard) {
    console.log('loc svc updated timecard');
    this.activeTimecard = card;
  }
}

/* eslint-disable no-underscore-dangle */
import { HttpErrorResponse } from '@angular/common/http';
import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonRefresher,
  LoadingController,
} from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import BackgroundGeolocation, {
  Location,
} from '@transistorsoft/capacitor-background-geolocation';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../data.service';
import { LocationService } from '../location.service';
import { MessageService } from '../message.service';
import { Shift } from '../models/shift.model';
import { Timecard } from '../models/timecard.model';
import { User } from '../models/user.model';
import { TimeService } from '../time.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy, AfterContentInit {
  isClockedIn = false;
  isLoading = false;
  isLoadingData = false;
  noShifts = true;
  loadedShifts: Shift[];
  activeTimecard = new Timecard('0', '0', new Date(0), false);
  private shiftSub: Subscription;
  private timecardSub: Subscription;

  constructor(
    private router: Router,
    private storage: Storage,
    private authService: AuthService,
    private dataService: DataService,
    private timeService: TimeService,
    private alertCtrl: AlertController,
    private locSvc: LocationService,
    private messageSvc: MessageService
  ) {}

  ngAfterContentInit() {}

  ngOnInit() {
    this.storage.create();
    this.locSvc.setupPlugin();
    // console.log('setting up plugin');
    // // this.onHeartbeat = this.onHeartbeat.bind(this);

    // BackgroundGeolocation.onHeartbeat((event) => {
    //   console.log('heartbeat started');
    //   this.locSvc.onHeartbeat(event);
    // });
    // BackgroundGeolocation.onLocation((location) => {
    //   console.log('onLocation lat: ', location.coords.latitude);
    //   console.log('onLocation long: ', location.coords.longitude);
    // });

    // BackgroundGeolocation.ready({
    //   desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    //   distanceFilter: 10,
    //   stopOnTerminate: false,
    //   startOnBoot: true,
    //   showsBackgroundLocationIndicator: true,
    //   maxRecordsToPersist: 0,
    //   heartbeatInterval: 60,
    //   preventSuspend: true,
    //   foregroundService: true,
    //   enableHeadless: true,
    //   notification: {
    //     title: 'Background Tracking Enabled',
    //     text: 'You are currently checked in!',
    //   },
    // }).then(async (state) => {
    //   console.log('[ready] success', state);
    //   this.state.enabled = state.enabled;
    // });
    this.shiftSub = this.dataService.shifts.subscribe((shifts) => {
      this.loadedShifts = shifts;
      if (this.loadedShifts && this.loadedShifts.length === 0) {
        this.noShifts = true;
      } else if (this.loadedShifts) {
        this.noShifts = false;
        const polyarray = JSON.parse(shifts[0].polygon);
      }
    }, (error: HttpErrorResponse) => {
      if (error.status === 401){
        this.authService.logout();
      } else {
        this.showAlert(error.message);

      }

    });
    this.timecardSub = this.timeService.timecard.subscribe((card) => {
      console.log('changing active timecards');
      console.log('Current Timecard', JSON.stringify(card));

      if (card) {
        this.activeTimecard = card;
        this.locSvc.setTimecard(card);
        BackgroundGeolocation.getState().then((state) => {
          console.log('State of BGGeo PI: ', state.enabled);
          if (!state.enabled) {
            // this.locSvc.startTracking();
          }
        });
      } else {
        this.activeTimecard = new Timecard('0', '0', new Date(0), false);
        this.locSvc.setTimecard(new Timecard('0', '0', new Date(0), false));
        this.locSvc.stopTracking();
      }
      this.isLoading = false;
    }, (error: HttpErrorResponse) => {
      this.isLoading = false;

      if (error.status === 401){
        this.authService.logout();
      } else {
        this.showAlert(error.message);

      }
    });
  }
  ngOnDestroy() {
    if (this.shiftSub) {
      this.shiftSub.unsubscribe();
    }
    if (this.timecardSub) {
      this.timecardSub.unsubscribe();
    }
  }
  toggleClockIn(shift: Shift) {
    this.isLoading = true;
    const logger = BackgroundGeolocation.logger;
    let lat: number;
    let long: number;
    let token: string;
    logger.debug('Clocking In');
    this.activeTimecard = new Timecard(shift.shiftId, '0', new Date(), false);
    this.storage.get('user').then((u) => {
      logger.debug('Got user info: ' + u._token);
      token = u._token;
    });
    this.locSvc.getLocation().then((loc) => {
      lat = loc.lat;
      long = loc.long;
      logger.debug('Got location');
      logger.debug('sending request');
      this.dataService.checkIfInPoly(lat, long, shift, token).subscribe(
        (resp) => {
          const bool: boolean = resp.response.inPoly;
          logger.debug('Response Received ' + bool);
          if (bool) {
            logger.debug('In Poly, clocking in!');
            this.timeService.clockin(shift, token);
            this.locSvc.startTracking(shift, token);
            this.isLoading = false;
          } else {
            this.isLoading = false;
            this.activeTimecard = new Timecard('0', '0', new Date(0), false);
            this.alertCtrl
              .create({
                header: 'Not located at facility',
                message:
                  'Please clock in inside the facility. Contact admin if you believe this is an error',
                buttons: ['Okay'],
              })
              .then((alertEl) => alertEl.present());
          }
        },
        (err: HttpErrorResponse) => {
          logger.debug('error with request: ' + JSON.stringify(err));
          this.isLoading = false;
          this.activeTimecard = new Timecard('0', '0', new Date(0), false);
          if (err.status === 401){
            this.authService.logout();
          } else {
          this.alertCtrl
            .create({
              header: 'Error Clocking In',
              message:
                JSON.stringify(err),
              buttons: ['Okay'],
            })
            .then((alertEl) => alertEl.present());
        }}
      );
    });
  }
  clockout(timecard: Timecard) {
    this.isLoading = true;
    this.storage.get('user').then((data) => {
      this.timeService.clockout(timecard, data._token);
      this.locSvc.stopTracking();
    });
  }
  advanceToTasks() {
    this.router.navigate(['tasks']);
  }

  ionViewWillEnter() {
    this.isLoadingData = true;
    this.findSchedule();
    this.storage.get('user').then((data) => {
      const nowDate = new Date();
      const start = nowDate.setHours(0, 0, 0);
      const end = nowDate.setHours(23, 59, 59);
      this.dataService
        .getSchedules(start, end, data._token)
        .subscribe((resData) => {
          this.dataService.processShifts(resData);
          this.isLoadingData = false;
          console.log('ionViewWillEnter Count: ', resData.response.unreadMessageCount);
        }, (error: HttpErrorResponse) => {
          if (error.status === 401){
            this.authService.logout();
          } else {
          this.showAlert(error.message);
          }
          this.isLoading = false;
        });
      this.timeService.checkForActiveTimecard(data._token);
    });
  }
  refreshShifts(r: IonRefresher) {
    this.isLoadingData = true;
    this.storage.get('user').then((data) => {
      const nowDate = new Date();
      const start = nowDate.setHours(0, 0, 0);
      const end = nowDate.setHours(23, 59, 59);
      this.dataService.getSchedules(start, end, data._token).subscribe(
        (resData) => {
          this.dataService.processShifts(resData);
          this.isLoadingData = false;
          console.log('refreshShifts Count: ', resData.response.unreadMessageCount);

          r.complete();
        },
        (error: HttpErrorResponse) => {
          r.cancel();
          this.isLoadingData = false;
          if (error.status === 401){
            this.authService.logout();
          }
        }
      );
      this.timeService.checkForActiveTimecard(data._token);
    });
  }
  logout() {
    this.authService.logout();
  }
  findSchedule(){
    this.storage.get('user').then((data) => {
      const nowDate = new Date();
      const start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0,0,0);
      const start1 = start.setHours(0,0,0,0);
      const end = nowDate.setDate(nowDate.getDate() + 90);
      const end1 = new Date(end).setHours(23, 59, 59);
      this.dataService
        .getUpcomingSchedules(start1, end1, data._token)
        .subscribe((resData) => {
          console.log('get schedules response: ', JSON.stringify(resData));
          this.dataService.processUpcomingSchedules(resData);

        }, (error: HttpErrorResponse) => {
          if (error.status === 401){
            this.authService.logout();
          } else {
          this.showAlert(error.message);
        }});
    });
  }
  toggleBreak(aTimecard: Timecard) {
    let token;
    this.isLoading = true;
    this.storage.get('user').then((u) => {
      token = u._token;
      if(aTimecard.onBreak === true){
        this.timeService.toggleBreak(true, token).subscribe((resData) => {
          console.log('toggleBreakOff Count: ', resData.response.unreadMessageCount);

          this.activeTimecard.onBreak = false;
          this.isLoading = false;
        }, (err: HttpErrorResponse) => {
          this.isLoading = false;
          if (err.status === 401){
            this.authService.logout();
          } else{
          this.showAlert(err.message);
        }});
      } else {
        this.timeService.toggleBreak(false, token).subscribe((resData) => {
          console.log('toggleBreakOn Count: ', resData.response.unreadMessageCount);

          this.activeTimecard.onBreak = true;
          this.isLoading = false;
        }, (err: HttpErrorResponse) => {
          this.isLoading = false;
          if (err.status === 401){
            this.authService.logout();
          } else{
          this.showAlert(err.message);
        }});
      }
    });
  }
  showAlert(msg: string){
    this.alertCtrl
              .create({
                header: 'Error',
                message: msg,
                buttons: ['Okay'],
              })
              .then((alertEl) => alertEl.present());
  }
}

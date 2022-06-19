/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Timecard } from '../app/models/timecard.model';
import { AuthService } from './auth/auth.service';
import { DataService } from './data.service';
import { LocationService } from './location.service';
import { MessageService } from './message.service';
import { Shift } from './models/shift.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class TimeService implements OnDestroy {
  private _timecard = new BehaviorSubject<Timecard>(null);
  private activeTimecard: Timecard;
  private firstRun: boolean;
  private logOutResetObsv: Subscription;

  get timecard() {
    return this._timecard.asObservable();
  }
  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private locSvc: LocationService,
    private dataService: DataService,
    private messageSvc: MessageService,
    private authService: AuthService
  ) {
    this.logOutResetObsv = this.authService.logOutReset.subscribe((b: boolean) => {
      this.firstRun = b;
    });
  }
  ngOnDestroy(){
    this.logOutResetObsv.unsubscribe();
  }
  clockin(shift: Shift, token: string) {
    if (this.activeTimecard.activeShiftId !== '0') {
      return;
    }
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    this.http
      .post<any>(
        'https://app.jmcleanco.com/api/1.1/wf/clock_in',
        {
          schedule_id: shift.shiftId,
          time: new Date(),
        },
        requestOptions
      )
      .subscribe((resData) => {

        this.activeTimecard = new Timecard(
          resData.response.schedule_id,
          resData.response.timecard_id,
          new Date(resData.response.clock_in_time),
          false
        );
        this.storage
          .set('poly', shift.polygon)
          .then(() => console.log('poly saved'));

        this._timecard.next(this.activeTimecard);
      }, (error: HttpErrorResponse) => {
        if (error.status === 401){
          this.authService.logout();
        }
      });
  }
  clockout(card: Timecard, token: string) {
    if (!this.activeTimecard) {
      return;
    }
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    this.http
      .post<any>(
        'https://app.jmcleanco.com/api/1.1/wf/clock_out',
        {
          timecard_id: card.cardId,
          time: new Date(),
        },
        requestOptions
      )
      .subscribe((resData) => {

        this.activeTimecard = new Timecard('0', '0', new Date(), false);
        this._timecard.next(this.activeTimecard);
        // BackgroundGeolocation.logger.emailLog('chris@jmcleanco.com').then((success) => {
        //   console.log('[emailLog] SUCCESS');
        // }).catch((error) => {
        //   console.log('[emailLog] ERROR: ', error);
        // });
        const nowDate = new Date();
        const start = nowDate.setHours(0, 0, 0);
        const end = nowDate.setHours(23, 59, 59);
        this.dataService.getSchedules(start, end, token).subscribe((rez) => {
          this.dataService.processShifts(rez);
        }, (error: HttpErrorResponse) => {
          if (error.status === 401){
            this.authService.logout();
          }
        });
        this.checkForActiveTimecard(token);
        this.storage
          .remove('poly')
          .then((val) => console.log('poly destroyed'));
      }, (error: HttpErrorResponse) => {
        if (error.status === 401){
          this.authService.logout();
        }
      });
  }
  checkForActiveTimecard(token: string) {
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    console.log('checking for active timecard');
    const requestOptions = { headers: new HttpHeaders(headers) };
    this.http
      .post<any>(
        'https://app.jmcleanco.com/api/1.1/wf/check_active_timecard',
        {},
        requestOptions
      )
      .subscribe((resData) => {
        console.log('check active timecard: ', JSON.stringify(resData));
        if (resData.response.is_active === true) {
          this.activeTimecard = new Timecard(
            resData.response.schedule_id,
            resData.response.card_id,
            new Date(resData.response.inTime),
            resData.response.onBreak
          );
          BackgroundGeolocation.getState().then((state) => {
            console.log('State of BGGeo PI: ', state.enabled);
            if (!state.enabled) {
              BackgroundGeolocation.start();
            }
          });
        } else {
          this.activeTimecard = new Timecard('0', '0', new Date(), false);
        }
        this.authService.setLogOutReset(false);
        this._timecard.next(this.activeTimecard);
      }, (error: HttpErrorResponse) => {
        if (error.status === 401){
          this.authService.logout();
        }
      });
  }
  toggleBreak(onBreak: boolean, token: string) {
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    if (onBreak === true) {
      return this.http.post<any>(
        'https://app.jmcleanco.com/api/1.1/wf/clock_break_out',
        {
          timestamp: new Date(),
        },
        requestOptions
      );
    } else if (onBreak === false) {
      return this.http.post<any>(
        'https://app.jmcleanco.com/api/1.1/wf/clock_break_in',
        {
          timestamp: new Date(),
        },
        requestOptions
      );
    }
  }
}

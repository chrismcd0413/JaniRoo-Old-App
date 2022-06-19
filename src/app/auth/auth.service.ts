/* eslint-disable no-underscore-dangle */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, from } from 'rxjs';
import { User } from '../models/user.model';
import { map, tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { TimeService } from '../time.service';
import OneSignal from 'onesignal-cordova-plugin';
import { LoadingController } from '@ionic/angular';
import { MessageService } from '../message.service';

export interface LogInResponse {
  status: string;
  response: {
    user_id: string;
    token: string;
    expires: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = new BehaviorSubject<User>(null);
  private _logOutReset = new BehaviorSubject<boolean>(true);
  private uuid;

  get isUserAuthenticated() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return !!user.token;
        } else {
          return false;
        }
      })
    );
  }
  get user() {
    return this._user.asObservable();
  }
  get logOutReset() {
    return this._logOutReset.asObservable();
  }

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router) {
    this.storage.create();
    // OneSignal.addSubscriptionObserver((state) => {
    //   this.storage.get('user').then((u) => {
    //     this.uuid = state.to.userId;
    //     if (state.to.isSubscribed && state.to.userId) {
    //       const token = u._token;
    //       this.setUUID(token, this.uuid).subscribe();
    //     }
    //   });
    // });
  }
  // setUUID(token: string, id: string) {
  //   const authToken: string = 'Bearer ' + token;
  //   const headers = {
  //     Authorization: authToken,
  //   };
  //   const requestOptions = { headers: new HttpHeaders(headers) };
  //   return this.http.post<any>(
  //     'https://app.jmcleanco.com/api/1.1/wf/update_uuid',
  //     {
  //       uuid: id,
  //     }
  //   );
  // }
  login(email: string, pass: string, id: string) {
    return this.http
      .post<LogInResponse>('https://app.jmcleanco.com/api/1.1/wf/auth', {
        // eslint-disable-next-line object-shorthand
        email: email,
        password: pass,
        uuid: id,
      })
      .pipe(tap(this.setUserData.bind(this)));
  }
  autoLogin() {
    return from(this.storage.get('user')).pipe(
      map((user: User) => {
        if (!user || !user.id) {
          return null;
        }
        if (new Date(user.tokenDuration) <= new Date()) {
          return null;
        }
        return user;
      }),
      tap((user: User) => {
        if (user) {
          this._user.next(user);
        }
      }),
      map((user) => !!user)
    );
  }
  logout() {
    this.storage.remove('user').then((data) => {
      this.router.navigate(['/auth']);
      this._user.next(null);
    });
    this._logOutReset.next(true);
  }
  setLogOutReset(b: boolean){
    this._logOutReset.next(b);
  }
  checkInventoryEnabled(token: string){
    const authToken: string = 'Bearer ' + token;
      const headers = {
        Authorization: authToken,
      };
      const requestOptions = { headers: new HttpHeaders(headers) };
      return this.http
        .post<any>(
          'https://app.jmcleanco.com/api/1.1/wf/app_check_inventory_creds',
          {},
          requestOptions
        );
  }
  private setUserData(data: LogInResponse) {
    const expTime = new Date(
      new Date().getTime() + +data.response.expires * 1000
    );
    let isInventoryEnabled: boolean;
    this.checkInventoryEnabled(data.response.token).subscribe(inventoryCheckResponse => {
      console.log('Inventory Check Response: ', JSON.stringify(inventoryCheckResponse));
      isInventoryEnabled = inventoryCheckResponse.response.enabled;
      const user = new User(data.response.user_id, isInventoryEnabled, data.response.token, expTime);
    this._user.next(user);
    console.log('User: ', JSON.stringify(user));
    this.storeAuthData(user);
    this.router.navigate(['/dashboard']);

    }, (error: HttpErrorResponse) => {
    });
  }
  private storeAuthData(user: User) {
    this.storage.set('user', user).then((res: User) => {});
  }
}

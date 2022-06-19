/* eslint-disable object-shorthand */
/* eslint-disable prefer-const */
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService, LogInResponse } from './auth.service';
import OneSignal from 'onesignal-cordova-plugin';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  constructor(
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}
   async runAuth(email: string, pass: string, form: NgForm) {
    let id: string;
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    await (window as any).plugins.OneSignal.getDeviceState(function(stateChanges: any) {
      id = stateChanges.userId;
    });
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Logging you in...' })
      .then((el) => {
        el.present();
          let authObsv: Observable<LogInResponse>;
          authObsv = this.authService.login(email, pass, id);

          authObsv.subscribe(
            (resData) => {
              el.dismiss();
              console.log('Log in complete');
              form.reset();
            },
            (errRes: HttpErrorResponse) => {
              el.dismiss();
              this.showAlert(errRes.message);
            }
          );
        });
  }
  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const pass = form.value.pass;
    this.runAuth(email, pass, form);
  }
  showAlert(message: string) {
    this.alertCtrl
      .create({
        header: 'Authentication Failed',
        message: message,
        buttons: ['Okay'],
      })
      .then((alertEl) => alertEl.present());
  }
}

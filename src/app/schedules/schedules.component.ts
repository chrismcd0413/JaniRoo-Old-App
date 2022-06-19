/* eslint-disable max-len */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable no-underscore-dangle */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';

import { MessageService } from '../message.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { User } from '../models/user.model';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.scss'],
})
export class SchedulesComponent implements OnInit, OnDestroy {
  @ViewChild('iframe') iframe: any;
  url: SafeUrl;
  isLoading = false;
  private userSub: Subscription;
  private user: User;
  constructor(private authSvc: AuthService,
    private sanitizer: DomSanitizer,
    private messageSvc: MessageService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.userSub = this.authSvc.user.subscribe(user => {
      this.user = user;
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://app.jmcleanco.com/app_schedules?id=' + this.user.id);
    });
  }
  ngOnDestroy(){
    this.userSub.unsubscribe();

  }
  ionViewWillEnter(){
    this.isLoading = true;
  }
  loadingFinished(){
    this.isLoading = false;
  }
}

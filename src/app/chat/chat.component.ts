/* eslint-disable max-len */
//import { isFormattedError } from '@angular/compiler';
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MessageService } from '../message.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('iframe') iframe: any;
  url: SafeUrl;
  isLoading = false;
  private routeSub: Subscription;
  private userSub: Subscription;
  private user: User;

  constructor(private authSvc: AuthService,
    private sanitizer: DomSanitizer,
    private messageSvc: MessageService,
    private activatedRoute: ActivatedRoute) { }

  // @HostListener('window:message', ['$event'])
  // updateUnreadCount(event: MessageEvent) {
  //   this.messageSvc.setUnreadCount(parseInt(event.data, 10));
  //   console.log('iFrame Listener Count: ', event.data);
  // }
  ngOnInit() {
    this.userSub = this.authSvc.user.subscribe(user => {
      this.user = user;
    });
    this.routeSub = this.activatedRoute.paramMap.subscribe((param) => {
      if (param.get('group')){
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://app.jmcleanco.com/app_chat?id=' + this.user.id + '&group=' + param.get('group'));

      } else {
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://app.jmcleanco.com/app_chat?id=' + this.user.id);
      }
      console.log('URL: ', this.url);

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

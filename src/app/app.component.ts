/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { NavController, Platform, ToastController } from '@ionic/angular';
import Backendless from 'backendless';
import OneSignal from 'onesignal-cordova-plugin';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import BELS from './Custom Plugins/backendlesssetup';
import { MessageService } from './message.service';
import { Deeplinks } from '@ionic-native/deeplinks/ngx';
import { ChatComponent } from './chat/chat.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { App, URLOpenListener, URLOpenListenerEvent } from '@capacitor/app';

// import { FCM } from '@ionic-native/fcm/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy, OnInit {
  isInventoryEnabled = false;
  unreadMessageCount = 0;
  url: SafeUrl;
  private userSub: Subscription;
  private routeSub: Subscription;
  private messageSub: Subscription;
  constructor(private authSvc: AuthService,
    private messageSvc: MessageService,
    private zone: NgZone,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private router: Router,
    private navController: NavController,
    protected platform: Platform) {
    this.platform.ready().then(() => {
      this.initializeOS();
      App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        this.zone.run(() => {
          const slug = event.url.split('.com/applinks').pop();
          console.log('appURLOpen slug: ', slug);
          if (slug){
            this.router.navigateByUrl(slug);
          }
        });
      });
    });
  }
  @HostListener('window:message', ['$event'])
  updateUnreadCount(event: MessageEvent) {
    this.messageSvc.setUnreadCount(parseInt(event.data, 10));
    console.log('iFrame Listener Count: ', event.data);
  }
  initializeOS() {
    // Backendless.initApp(
    //   '5CC93276-0E1B-945B-FFD9-B52BAC8A9D00',
    //   'B4C1C427-FA4A-4B70-BFA5-8B6E84DC3479'
    // );
    // BELS.initialize().then((complete) => {
    //   BELS.setup().then((value) => {
    //     if (value === 1) {
    //       alert('Push registration success');
    //     }
    //     if (value === 0) {
    //       alert('Push registration success');
    //     }
    //   });
    // });

    OneSignalInit();
    // Call this function when your app starts
    function OneSignalInit(): void {
      // Uncomment to set OneSignal device logging to VERBOSE
      // OneSignal.setLogLevel(6, 0);
      // NOTE: Update the setAppId value below with your OneSignal AppId.
      OneSignal.setAppId('ae8158ff-458b-423d-b8a7-51cbaec9439e');
      OneSignal.setNotificationOpenedHandler(function(jsonData) {
        // console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
      });
      // iOS - Prompts the user for notification permissions.
      //    * Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 6) to better communicate to your users what notifications they will get.
      OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
        // console.log('User accepted notifications: ' + accepted);
      });
      // Backendless.Messaging.registerDevice()
    }
  }
  logout() {
    this.authSvc.logout();
  }
  ngOnInit(){
    this.userSub = this.authSvc.user.subscribe(user => {
      console.log('Menu User: ', JSON.stringify(user));
      if (user === null){
        this.isInventoryEnabled = false;
      } else {
        if (user.inventoryEnabled === null){
          this.isInventoryEnabled = false;
        } else {
          this.isInventoryEnabled = user.inventoryEnabled;
        }
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl('https://app.jmcleanco.com/app_unread_updater?id=' + user.id);
      console.log('App Unread Updater URL: ', this.url);
      }
    });
    this.messageSub = this.messageSvc.unreadMessageCount.subscribe(count => {
      this.zone.run(() => {
        this.unreadMessageCount = count;

      });
      console.log('Unread Count: ', count);
    });
    OneSignal.setNotificationWillShowInForegroundHandler(notification => {
      const tMessage = notification.getNotification().body;
      const tHeader = notification.getNotification().title;
      notification.complete(null);
      const toast = this.toastController.create({
        header: tHeader,
        message: tMessage,
        position: 'top',
        duration: 3000,
        color: 'dark',
        buttons: [
          {
            side: 'end',
            icon: 'arrow-forward',
            handler: () => {
              const slug = notification.getNotification().launchURL.split('.com/applinks').pop();
              this.router.navigateByUrl(slug);
            }
          }
        ]
      }).then((el) =>{
        el.present();
      });
    });
  }
  ngOnDestroy(){
    this.userSub.unsubscribe();
    this.messageSub.unsubscribe();
  }
  loadingFinished(){}

}

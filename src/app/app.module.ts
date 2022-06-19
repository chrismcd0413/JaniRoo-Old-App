import { NgModule, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TasksComponent } from './tasks/tasks.component';
import { TimekeeperComponent } from './timekeeper/timekeeper.component';
import { HeaderComponent } from './header/header.component';
import { TaskListComponent } from './tasks/task-list/task-list.component';
import { MonthlyTasksComponent } from './tasks/monthly-tasks/monthly-tasks.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Camera } from '@ionic-native/camera/ngx';
import { SchedulesComponent } from './schedules/schedules.component';
import { NgCalendarModule  } from 'ionic2-calendar';
import { InventoryComponent } from './inventory/inventory.component';
import { SnapshotItemComponent } from './inventory/snapshot-item/snapshot-item.component';
import { ChatComponent } from './chat/chat.component';
import { LocListInvComponent } from './inventory/loc-list-inv/loc-list-inv.component';
import { PaymentsComponent } from './payments/payments.component';
import { PaymentsListComponent } from './payments/payments-list/payments-list.component';
import { PaymentDetailComponent } from './payments/payment-detail/payment-detail.component';

@NgModule({
    declarations: [
        AppComponent,
        AuthComponent,
        DashboardComponent,
        TasksComponent,
        TimekeeperComponent,
        HeaderComponent,
        TaskListComponent,
        MonthlyTasksComponent,
        SchedulesComponent,
        InventoryComponent,
        SnapshotItemComponent,
        ChatComponent,
        LocListInvComponent,
        PaymentsComponent,
        PaymentsListComponent,
        PaymentDetailComponent
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule,
        NgCalendarModule,
        IonicStorageModule.forRoot(),
    ],
    providers: [
        Camera, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}

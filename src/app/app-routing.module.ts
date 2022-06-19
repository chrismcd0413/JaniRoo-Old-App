import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { ChatComponent } from './chat/chat.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InventoryComponent } from './inventory/inventory.component';
import { LocListInvComponent } from './inventory/loc-list-inv/loc-list-inv.component';
import { PaymentDetailComponent } from './payments/payment-detail/payment-detail.component';
import { PaymentsListComponent } from './payments/payments-list/payments-list.component';
import { PaymentsComponent } from './payments/payments.component';
import { SchedulesComponent } from './schedules/schedules.component';
import { MonthlyTasksComponent } from './tasks/monthly-tasks/monthly-tasks.component';
import { TasksComponent } from './tasks/tasks.component';
import { TimekeeperComponent } from './timekeeper/timekeeper.component';

const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'timekeeper',
    component: TimekeeperComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'payment',
    children: [
      {
        path: '',
        component: PaymentsListComponent,
        pathMatch: 'full'
      },
      {
        path: 'searchTimesheets',
        component: PaymentsComponent,
        pathMatch: 'full'
      },
      {
        path: 'detail',
        component: PaymentDetailComponent,
        pathMatch: 'full'
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:group',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'schedule',
    component: SchedulesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'inventory',
    children: [
      {
        path: 'loc',
        component: LocListInvComponent,
        pathMatch: 'full'
      },
      {
        path: 'snapshot/:id',
        component: InventoryComponent,
        pathMatch: 'full'
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks',
    children: [
      {
        path: ':shift',
        component: TasksComponent,
        pathMatch: 'full'
      },
      {
        path: ':shift/monthly',
        component: MonthlyTasksComponent
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

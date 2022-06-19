import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from 'src/app/auth/auth.service';
import { DataService } from 'src/app/data.service';
import { PaymentsService } from 'src/app/payments.service';

@Component({
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  styleUrls: ['./payments-list.component.scss'],
})
export class PaymentsListComponent implements OnInit {
  isLoading = false;
  paymentsList = [];
  constructor(private dataService: DataService,
    private storage: Storage,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private router: Router,
    private paymentsService: PaymentsService,
    private route: ActivatedRoute) { }

  ngOnInit() {}
  ionViewWillEnter(){
    this.isLoading = true;
    this.storage.get('user').then((u) => {
      // eslint-disable-next-line no-underscore-dangle
      const token = u._token;
      this.dataService.getPayrolls(token).subscribe(payrolls => {
        // const payrollJSON = JSON.parse(payrolls);
        console.log('Payroll Data: ', JSON.stringify(payrolls));
        this.paymentsList = payrolls.payrolls;
        this.isLoading = false;
      }, (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 401){
          this.authService.logout();
        } else{
          this.alertCtrl
          .create({
            header: 'Error',
            message: err.message,
            buttons: ['Okay'],
          })
          .then((alertEl) => alertEl.present());
        }
      });
    });
  }
  goToSearch(){
    console.log('Go to Timesheet Search Button Pressed');
    // this.router.navigate(['searchTimesheets'], {relativeTo: this.route});
    this.router.navigate(['payment', 'searchTimesheets']);
  }
  goToDetails(details, range1: string, range2: string){
    const rangef = range1 + ' - ' + range2;
    this.paymentsService.setPaymentDetails(details);
    this.paymentsService.setPayrollDate(rangef);
    // this.router.navigate(['/payment/detail'], {relativeTo: this.route});
    this.router.navigateByUrl('/payment/detail');


  }
}

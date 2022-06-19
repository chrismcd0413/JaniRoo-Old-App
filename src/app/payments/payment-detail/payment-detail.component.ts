import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/payments.service';

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss'],
})
export class PaymentDetailComponent implements OnInit, OnDestroy {
  isLoading = false;
  payment;
  title: string;
  private paymentDetailSub: Subscription;
  private rangeSub: Subscription;
  constructor(private paymentsService: PaymentsService) { }

  ngOnInit() {
    this.paymentDetailSub = this.paymentsService.payment.subscribe(details => {
      this.payment = details;
      console.log('Payment Details: ', details);
    });
    this.rangeSub = this.paymentsService.title.subscribe(details => {
      this.title = details;
    });
  }
  ngOnDestroy() {
    this.paymentDetailSub.unsubscribe();
  }
  sumNumbers(detail: any[]){
    let sum = 0.00;
    detail.forEach(det => {
      sum += parseFloat(det.amount);
    });
    return sum.toFixed(2);
  }
}

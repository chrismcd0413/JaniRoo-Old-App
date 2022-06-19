import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private paymentDetails = new BehaviorSubject<any>(null);
  private payrollRange = new BehaviorSubject<string>(null);
  get payment() {
    return this.paymentDetails.asObservable();
  }
  get title() {
    return this.payrollRange.asObservable();
  }
  constructor() { }
  setPaymentDetails(details){
    this.paymentDetails.next(details);
  }
  setPayrollDate(date: string){
    this.payrollRange.next(date);
  }
}

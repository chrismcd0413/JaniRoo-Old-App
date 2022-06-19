import { Component, OnInit, ViewChild } from '@angular/core';
import { IonDatetime, IonInput, PopoverController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { DataService } from '../data.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
})
export class PaymentsComponent implements OnInit {
  @ViewChild('startDate') startTime: IonInput;
  @ViewChild('endDate') endTime: IonInput;
  startDate: Date = null;
  endDate: Date = null;
  isLoading = false;
  dateValue: Date;
  disabled = true;
  timesheetList = [];
  constructor(private dataService: DataService,
    private storage: Storage) { }

  ngOnInit() {}
  searchTimesheets(){
    this.storage.get('user').then((u) => {
      // eslint-disable-next-line no-underscore-dangle
      const token = u._token;
      this.dataService.getTimesheets(this.startDate, this.endDate, token)
      .subscribe(timesheets => {
        console.log('Timesheets: ', JSON.stringify(timesheets));
        const formattedJSON = JSON.parse(JSON.stringify(timesheets));
        this.processTimesheets(formattedJSON);
        console.log('Timesheets 2: ', JSON.stringify(formattedJSON));

      });
    });
}
  processTimesheets(tSheets: any){
    this.timesheetList = tSheets.timesheets;
  }
  setStartDate(){
    if (this.startTime.value === '') {
      this.startDate = null;
    } else {
      this.startDate = new Date(this.startTime.value);
    }
    this.checkDates();
  }
  setEndDate(){
    if (this.endTime.value === '') {
      this.endDate = null;
    } else {
      this.endDate = new Date(this.endTime.value);
    }
    this.checkDates();

  }
  checkDates(){
    if (this.startDate !== null && this.endDate !== null) {
      if (this.endDate < this.startDate){
        this.disabled = true;
      } else {
        this.disabled = false;
      }
    } else {
      this.disabled = true;
    }
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/data.service';

@Component({
  selector: 'app-monthly-tasks',
  templateUrl: './monthly-tasks.component.html',
  styleUrls: ['./monthly-tasks.component.scss'],
})
export class MonthlyTasksComponent implements OnInit, OnDestroy {
  isLoading = false;

  private loadingSubscription: Subscription;
  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.loadingSubscription = this.dataService.loadingStatus.subscribe(
      b => {
        this.isLoading = b;
      }
    );
  }
  ngOnDestroy() {
    this.loadingSubscription.unsubscribe();
  }
}

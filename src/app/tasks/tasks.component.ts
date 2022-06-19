import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Data } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})
export class TasksComponent implements OnInit, OnDestroy {
  isLoading = false;
  totalTasks = 0;
  completeTasks = 0;
  private loadingSubscription: Subscription;
  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.loadingSubscription = this.dataService.loadingStatus.subscribe(
      b => {
        this.isLoading = b;
        console.log('loading: ', b);
      }
    );
  }
  ngOnDestroy() {
    this.loadingSubscription.unsubscribe();
  }
  updateTotalTasks(total){
    this.totalTasks = total;
  }
  updateCompTasks(comp){
    this.completeTasks = comp;
  }
}

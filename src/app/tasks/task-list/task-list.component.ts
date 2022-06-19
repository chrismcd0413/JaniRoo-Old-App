/* eslint-disable max-len */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable arrow-body-style */
/* eslint-disable prefer-const */
/* eslint-disable no-underscore-dangle */
import {
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import {
  AlertController,
  IonItem,
  IonItemSliding,
  NavController,
} from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { DataService } from 'src/app/data.service';
import { Task } from 'src/app/models/task.model';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { PhotoModel } from 'src/app/models/photo.model';
import { mTask } from 'src/app/models/mTask.model';
import { Platform } from '@ionic/angular';
import { TimeService } from 'src/app/time.service';
import { Checklist } from 'src/app/models/checklist.model';
import { withLatestFrom } from 'rxjs/operators';
import * as moment from 'moment';
import { MessageService } from 'src/app/message.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/auth/auth.service';

export interface GroupedList {
  zone: string;
  tasks: Task[];
}
export interface mGroupedList {
  zone: string;
  tasks: mTask[];
}
interface ActiveTimers {
  checklist: Checklist;
  difference: number;
  HH: number;
  MM: number;
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit, OnDestroy {
  @Output() compTasks = new EventEmitter<number>();
  @Output() totalTasks = new EventEmitter<number>();

  taskList: Task[] = null;
  groupedTasks: Checklist[] = [];
  mGroupedTasks: mGroupedList[] = [];
  isMonthlyList = false;
  private timerSub: Subscription;
  private _zList = [];
  private taskSub: Subscription;
  private mTaskSub: Subscription;
  private resumeSub: Subscription;
  private _monthlyStatus = new BehaviorSubject<number[]>(null);

  get zlist() {
    if (this.isMonthlyList) {
      this._zList = this.mGroupedTasks;
    } else {
      this._zList = this.groupedTasks;
    }
    console.log('list: ', JSON.stringify(this._zList));
    return this._zList;
  }
  get todaysDate() {
    let date = new Date();
    console.log('Todays date', date);
    return date;
  }
  get monthlyStatus() {
    return this._monthlyStatus.asObservable();
  }

  constructor(
    private storage: Storage,
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private platform: Platform,
    private timeService: TimeService,
    private zone: NgZone,
    private messageSvc: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.resumeSub = this.platform.resume.subscribe(() => {
      this.zone.run(() => {
        this.storage.get('user').then((data) => {
          let firstRun;
          if (this._zList.length === 0) {
            firstRun = true;
          } else {
            firstRun = false;
          }
          this.dataService
            .getTasks(
              this.route.snapshot.paramMap.get('shift'),
              data._token,
              firstRun
            )
            .subscribe(
              (resData) => {
                const parsedRes = JSON.parse(resData);
                if (parsedRes.updates) {
                  this.dataService.processTasks(resData);
                }
                this.dataService.setLoadingStatus(false);
              },
              (error: HttpErrorResponse) => {
                this.dataService.setLoadingStatus(false);
                if (error.status === 401) {
                  this.authService.logout();
                } else {
                  this.showAlert(error.message);
                }
              }
            );
          const nowDate = new Date();
          const start = nowDate.setHours(0, 0, 0);
          const end = nowDate.setHours(23, 59, 59);
          this.dataService.getSchedules(start, end, data._token).subscribe(
            (resData) => {
              this.dataService.processShifts(resData);
            },
            (error: HttpErrorResponse) => {
              if (error.status === 401) {
                this.authService.logout();
              } else {
                this.showAlert(error.message);
              }
            }
          );
          this.timeService.checkForActiveTimecard(data._token);
        });
      });
    });

    this.taskSub = this.dataService.tasks.subscribe(
      (taskList) => {
        // this.taskList = taskList;
        console.log('task update received. Now processing');
        this.dataService.setLoadingStatus(false);
        if (!taskList) {
          console.log('failed to find task list');
          return;
        } else {
          this.groupTasks(taskList);
        }
      },
      (error: HttpErrorResponse) => {
        this.dataService.setLoadingStatus(false);
        if (error.status === 401) {
          this.authService.logout();
        } else {
          this.showAlert(error.message);
        }
      }
    );
    this.mTaskSub = this.dataService.monthlyTasks.subscribe(
      (taskList) => {
        this.dataService.setLoadingStatus(false);
        if (!taskList) {
          return;
        } else {
          this.groupMonthly(taskList);
        }
      },
      (error: HttpErrorResponse) => {
        this.dataService.setLoadingStatus(false);
        if (error.status === 401){
          this.authService.logout();
        } else {
          this.showAlert(error.message);
        }
      }
    );
    this.route.paramMap.subscribe((map) => {
      if (!map.has('shift')) {
        this.navCtrl.navigateBack('/dashboard');
        return;
      }
      if (this.router.url.includes('monthly')) {
        this.isMonthlyList = true;
      } else {
        this.isMonthlyList = false;
        this.storage.get('user').then((data) => {
          let firstRun;
          if (this._zList.length === 0) {
            firstRun = true;
          } else {
            firstRun = false;
          }
          this.dataService
            .getTasks(map.get('shift'), data._token, firstRun)
            .subscribe(
              (resData) => {
                const parsedRes = JSON.parse(resData);
                if (parsedRes.updates) {
                  this.dataService.processTasks(resData);
                }

                this.dataService.setLoadingStatus(false);
              },
              (error: HttpErrorResponse) => {
                this.dataService.setLoadingStatus(false);
                if (error.status === 401){
                  this.authService.logout();
                } else {
                  this.showAlert(error.message);
                }
              }
            );
        });
      }
      this._zList = this.zlist;
    });
  }
  ngOnDestroy() {
    // this.taskSub.unsubscribe();
    // this.mTaskSub.unsubscribe();
    this.timerSub.unsubscribe();
  }
  ionViewDidLeave() {
    // this.groupedTasks = [];
  }
  groupTasks(checklists: Checklist[]) {
    // const groups = tasks.reduce((obj, item) => {
    //   obj[item.zone] = obj[item.zone] || [];
    //   obj[item.zone].push(item);
    //   return obj;
    // }, {});
    // const myArray = Object.keys(groups).map((key) => {
    //   return { zone: key, tasks: groups[key] };
    // });
    // this.groupedTasks = myArray;
    this.groupedTasks = checklists;
    // eslint-disable-next-line guard-for-in
    for (let i in checklists) {
      this.createTimersForChecklist(checklists[i]);
    }
    this.timerSub = timer(60000, 60000).subscribe(
      () => {
        for (let i in checklists) {
          this.createTimersForChecklist(checklists[i]);
        }
      },
      (error: Error) => {
        this.showAlert(error.message);
      }
    );
  }
  groupMonthly(tasks: mTask[]) {
    const groups = tasks.reduce((obj, item) => {
      obj[item.zone] = obj[item.zone] || [];
      obj[item.zone].push(item);
      return obj;
    }, {});
    const myArray = Object.keys(groups).map((key) => {
      return { zone: key, tasks: groups[key] };
    });
    this.mGroupedTasks = myArray;
    const totalTasks = tasks.length;
    let comTasks = 0;
    for (let i in tasks) {
      if (tasks[i].status === 'Completed' || tasks[i].status === 'Exception') {
        comTasks = comTasks + 1;
      }
    }
    this.compTasks.emit(comTasks);
    this.totalTasks.emit(totalTasks);
  }

  completeTask(id: string, i: number, item: IonItemSliding) {
    this.storage.get('user').then((data) => {
      this.dataService
        .completeTask(id, data._token, this.isMonthlyList)
        .subscribe(
          (resData) => {
            this.dataService.setLoadingStatus(false);
          },
          (error: HttpErrorResponse) => {
            this.dataService.setLoadingStatus(false);
            if (error.status === 401){
              this.authService.logout();
            } else {
              this.showAlert(error.message);
            }
          }
        );
    });
    let task;
    if (this.isMonthlyList) {
      task = this.mGroupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    } else {
      task = this.groupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    }
    task.tasks[i].status = 'Completed';
    for (let z in this.groupedTasks) {
      this.createTimersForChecklist(this.groupedTasks[z]);
    }
    item.closeOpened();
  }
  takePhoto = async (id: string, i: number, item: IonItemSliding) => {
    item.close();
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 50,
    });

    let task;
    if (this.isMonthlyList) {
      task = this.mGroupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    } else {
      task = this.groupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    }
    task.tasks[i].status = 'Completed';
    const newPhoto = new PhotoModel(id + '.jpg', photo.base64String);
    task.tasks[i].photo = newPhoto;
    for (let z in this.groupedTasks) {
      this.createTimersForChecklist(this.groupedTasks[z]);
    }
    this.storage.get('user').then((data) => {
      this.dataService
        .completeTaskWithPhoto(task.tasks[i], data._token, this.isMonthlyList)
        .subscribe(
          (resData) => {
            this.dataService.setLoadingStatus(false);
          },
          (error: HttpErrorResponse) => {
            this.dataService.setLoadingStatus(false);
            if (error.status === 401){
              this.authService.logout();
            } else {
              this.showAlert(error.message);
            }
          }
        );
    });
  };
  reportException(id: string, i: number, item: IonItemSliding) {
    this.alertCtrl
      .create({
        header: 'Report Exception',
        inputs: [
          {
            name: 'reason',
            type: 'text',
            placeholder: 'Reason',
          },
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Submit',
            handler: (value) => {
              this.storage.get('user').then((data) => {
                this.dataService
                  .reportException(
                    id,
                    value.reason,
                    data._token,
                    this.isMonthlyList
                  )
                  .subscribe(
                    (resData) => {
                      this.dataService.setLoadingStatus(false);
                    },
                    (error: HttpErrorResponse) => {
                      this.dataService.setLoadingStatus(false);
                      if (error.status === 401){
                        this.authService.logout();
                      } else {
                        this.showAlert(error.message);
                      }
                    }
                  );
              });
              let task;
              if (this.isMonthlyList) {
                task = this.mGroupedTasks.find((list) =>
                  list.tasks.find((list2) => list2.id === id)
                );
              } else {
                task = this.groupedTasks.find((list) =>
                  list.tasks.find((list2) => list2.id === id)
                );
              }
              task.tasks[i].status = 'Exception';
              item.closeOpened();
            },
          },
        ],
      })
      .then((alert) => alert.present());
  }
  uncompleteTask(id: string, i: number, item: IonItemSliding) {
    this.storage.get('user').then((data) => {
      this.dataService
        .uncompleteTask(id, data._token, this.isMonthlyList)
        .subscribe(
          (resData) => {
            this.dataService.setLoadingStatus(false);
          },
          (error: HttpErrorResponse) => {
            this.dataService.setLoadingStatus(false);
            if (error.status === 401){
              this.authService.logout();
            } else {
              this.showAlert(error.message);
            }
          }
        );
    });
    let task;
    if (this.isMonthlyList) {
      task = this.mGroupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    } else {
      task = this.groupedTasks.find((list) =>
        list.tasks.find((list2) => list2.id === id)
      );
    }
    task.tasks[i].status = 'Incomplete';
    item.closeOpened();
  }
  setDividerClass(date: Date, checklist: Checklist) {
    const now = new Date();
    if (date > now) {
      if (checklist.tasks.length > checklist.completedTasks) {
        return 'ontime';
      } else if (checklist.tasks.length === checklist.completedTasks) {
        return 'checklistFinished';
      } else {
        return 'ontime';
      }
    } else if (date < now) {
      if (checklist.tasks.length > checklist.completedTasks) {
        return 'late';
      } else if (checklist.tasks.length === checklist.completedTasks) {
        return 'checklistFinished';
      } else {
        return 'late';
      }
    } else {
      return 'ontime';
    }
  }
  createTimersForChecklist(CL: Checklist) {
    const tStart = moment(new Date());
    const tEnd = moment(CL.dueDate);
    const difference = moment.duration(tEnd.diff(tStart)).asHours();
    const absDiff = Math.abs(difference);
    const hours = Math.floor(absDiff);
    const minutes = Math.floor((absDiff - hours) * 60);
    for (let i in this.groupedTasks) {
      if (this.groupedTasks[i].id === CL.id) {
        this.groupedTasks[i].HH = hours;
        this.groupedTasks[i].MM = minutes;
        this.groupedTasks[i].difference = difference;
        this.groupedTasks[i].completedTasks = this.groupedTasks[i].tasks.filter(
          (task) => task.status === 'Completed' || task.status === 'Exception'
        ).length;
        this.groupedTasks[i].totalTasks = this.groupedTasks[i].tasks.length;
      }
    }

    //   let newTime: ActiveTimers = {
    //     checklist: CL,
    //   };
  }
  showAlert(msg: string) {
    this.alertCtrl
      .create({
        header: 'Error',
        message: msg,
        buttons: ['Okay'],
      })
      .then((alertEl) => alertEl.present());
  }
}

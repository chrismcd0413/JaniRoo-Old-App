/* eslint-disable object-shorthand */
/* eslint-disable guard-for-in */
/* eslint-disable prefer-const */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable quote-props */
/* eslint-disable eol-last */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import { BehaviorSubject } from 'rxjs';
import { Checklist } from './models/checklist.model';
import { mTask } from './models/mTask.model';
import { Schedule } from './models/schedule.model';
import { Shift } from './models/shift.model';
import { Task } from './models/task.model';

interface TaskResponse {
  response: {
    tasks: Task[];
    mtasks: mTask[];
  };
}

@Injectable({
  providedIn: 'root',
})


export class DataService {
  private _shifts = new BehaviorSubject<Shift[]>(null);
  private _tasks = new BehaviorSubject<Checklist[]>(null);
  private _monthlyTasks = new BehaviorSubject<mTask[]>(null);
  private _zoneGroups = new BehaviorSubject<string[]>(null);
  private _mZoneGroups = new BehaviorSubject<string[]>(null);
  private _isLoading = new BehaviorSubject<boolean>(false);
  private _schedules = new BehaviorSubject<Schedule[]>(null);

  get shifts() {
    return this._shifts.asObservable();
  }
  get tasks() {
    return this._tasks.asObservable();
  }
  get zones() {
    return this._zoneGroups.asObservable();
  }
  get loadingStatus() {
    return this._isLoading.asObservable();
  }
  get monthlyTasks() {
    return this._monthlyTasks.asObservable();
  }
  get monthlyZones() {
    return this._mZoneGroups.asObservable();
  }
  get schedules() {
    return this._schedules.asObservable();
  }

  constructor(private http: HttpClient) {}

  getSchedules(startDate: number, endDate: number, token: string) {
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    this.setLoadingStatus(true);

    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/getShifts',
      {
        startD: startDate,
        endD: endDate,
      },
      requestOptions
    );
  }
  getTimesheets(start: Date, end: Date, token: string){
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    this.setLoadingStatus(true);

    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/app_get_timesheets',
      {
        start: start,
        end: end,
      },
      requestOptions
    );
  }
  getUpcomingSchedules(startDate: number, endDate: number, token: string) {
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers),
      responseType: 'text' as 'json' };
    this.setLoadingStatus(true);

    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/get_cleaner_schedule',
      {
        start: startDate,
        end: endDate,
      },
      requestOptions
    );
  }
  processUpcomingSchedules(sched) {
    console.log('processing schedules response: ', sched);
    let processedArray: Schedule[] = [];
    const formattedSchedules = JSON.parse(sched);
    const schedules = formattedSchedules.schedules;

    for(let i in schedules) {
      let newSched = new Schedule(
        schedules[i].title,
        schedules[i].type,
        new Date(+schedules[i].startTime),
        new Date(+schedules[i].endTime),
        false
      );
      processedArray.push(newSched);
    }
    this._schedules.next(processedArray);
  }
  processShifts(response: any) {
    const locNames = response.response.locationNames;
    const polys = response.response.polygon;
    const shifts = response.response.shifts;
    let finishedArray: Shift[] = [];
    for (let i in shifts) {
      let newShift = new Shift(
        locNames[i],
        shifts[i].Type,
        new Date(shifts[i]['Scheduled Start Time']),
        new Date(shifts[i]['Scheduled End Time']),
        polys[i],
        shifts[i]._id
      );
      finishedArray.push(newShift);
    }
    this._shifts.next(finishedArray);
  }
  getTasks(id: string, token: string, firstRun: boolean) {
    this.setLoadingStatus(true);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken
    };
    const requestOptions = { headers: new HttpHeaders(headers),
      responseType: 'text' as 'json' };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/get_tasks_test',
      {
        shift_id: id,
        start: startDate,
        end: endDate,
        firstRun: firstRun
      },
      requestOptions
    );
  }

  processTasks(tasks) {
    const formattedTasks = JSON.parse(tasks);
    console.log('tasks to process: ', JSON.stringify(formattedTasks));

    const tasksList: Checklist[] = formattedTasks.checklists;
    const monthlyList = formattedTasks.mtasks;
    let finishedArray: Checklist[] = [];
    for (let i in tasksList){
      let newList = new Checklist(
        tasksList[i].checklistName,
        new Date(+tasksList[i].dueDate),
        tasksList[i].scheduleID,
        tasksList[i].tasks,
        tasksList[i].id
      );
      finishedArray.push(newList);
    }
    this._tasks.next(finishedArray);
    this._monthlyTasks.next(monthlyList);
    // let finishedArray: Task[] = [];
    // const monthlyList = tasks.response.mtasks;
    // const mZoneList = tasks.response.mzones;
    // const mCleaners = tasks.response.mcleaners;
    // console.log('cleaners loaded: ', JSON.stringify(mCleaners));
    // let mFinishedArray: mTask[] = [];
    // for (let i in tasksList) {
    //   let newTask = new Task(
    //     tasksList[i].Schedule,
    //     tasksList[i].PhotoReq,
    //     tasksList[i].Status,
    //     tasksList[i]['Task Description'],
    //     tasksList[i]['Task Name'],
    //     zoneList[i],
    //     tasksList[i]._id
    //   );
    //   finishedArray.push(newTask);
    // }
    // for (let i in monthlyList) {

    //   let newTask: mTask;
    //   if(mCleaners[i] === undefined){
    //     newTask = new mTask(
    //       monthlyList[i].Location,
    //       monthlyList[i].PhotoReq,
    //       monthlyList[i].Status,
    //       monthlyList[i]['Task Desc.'],
    //       monthlyList[i]['Task Name'],
    //       mZoneList[i],
    //       monthlyList[i]._id
    //     );
    //   } else {
    //     newTask = new mTask(
    //       monthlyList[i].Location,
    //       monthlyList[i].PhotoReq,
    //       monthlyList[i].Status,
    //       monthlyList[i]['Task Desc.'],
    //       monthlyList[i]['Task Name'],
    //       mZoneList[i],
    //       monthlyList[i]._id,
    //       mCleaners[i]
    //     );
    //   }
    //   mFinishedArray.push(newTask);
    // }
    // let zoneArray = [...zoneList];
    // this._zoneGroups.next(zoneArray);
    // this._tasks.next(finishedArray);
    // let mZoneArray = [...mZoneList];
    // this._mZoneGroups.next(mZoneArray);
    // this._monthlyTasks.next(mFinishedArray);
  }
  completeTask(id: string, token: string, monthly: boolean) {
    this.setLoadingStatus(true);

    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/complete_task1',
      {
        task_id: id,
        monthly: monthly
      },
      requestOptions
    );
  }
  completeTaskWithPhoto(task: Task, token: string, monthly: boolean) {
    this.setLoadingStatus(true);
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/complete_task1',
      {
        task_id: task.id,
        photo: task.photo,
        monthly: monthly
      },
      requestOptions
    );
  }
  reportException(id: string, reason: string, token: string, monthly: boolean) {
    this.setLoadingStatus(true);

    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/report_exception1',
      {
        task_id: id,
        reason: reason,
        monthly: monthly
      },
      requestOptions
    );
  }
  setLoadingStatus(bool: boolean) {
    this._isLoading.next(bool);
  }
  uncompleteTask(id: string, token: string, monthly: boolean) {
    this.setLoadingStatus(true);

    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/uncomplete_task1',
      {
        task_id: id,
        monthly: monthly
      },
      requestOptions
    );
  }
  checkIfInPoly(lat: number, long: number, shift: Shift, token: string) {
    //  BackgroundGeolocation.start();

    const logger = BackgroundGeolocation.logger;
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    logger.debug('request token: ' + token);
    logger.debug('request lat: ' + lat);
    logger.debug('request long: ' + long);
    logger.debug('request shift: ' + shift.shiftId);
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/is_in_poly',
      {
        lat: lat,
        long: long,
        schedule: shift.shiftId,
      },
      requestOptions
    );
  }
  sendLocationUpdateDebug(message: string) {
    // const authToken: string = 'Bearer ' + token;
    // const headers = {
    //   Authorization: authToken,
    // };
    // const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/send_location_email',
      {
        message: message,
      }
    );
  }
  getPayrolls(token: string){
    const authToken: string = 'Bearer ' + token;
    const headers = {
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/app_get_payrolls',
      {},
      requestOptions
    );
  }
}

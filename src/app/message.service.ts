/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private _unreadMessage = new BehaviorSubject<number>(0);

  get unreadMessageCount() {
    return this._unreadMessage.asObservable();
  }
  constructor() { }
  setUnreadCount(count: number){
    this._unreadMessage.next(count);
  }

}

/* eslint-disable no-underscore-dangle */
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { inventorySnapshotData } from './inventory/loc-list-inv/loc-list-inv.component';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})

export class InventoryService {
  private _inventoryListData = new BehaviorSubject<inventorySnapshotData>(null);

  get inventoryData() {
    return this._inventoryListData.asObservable();
  }
  constructor(private http: HttpClient,
    private messageSvc: MessageService,
    private authService: AuthService) { }
  getInventoryData(token: string) {
    const authToken: string = 'Bearer ' + token;
    const headers = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };

    this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/app_inventory_data',{},
      requestOptions
    ).subscribe(data =>{

      this._inventoryListData.next(data);
    }, (error: HttpErrorResponse) => {
      if (error.status === 401){
        this.authService.logout();
      }
    });
  }
  submitSnapshot(req: any, token: string){
    const authToken: string = 'Bearer ' + token;
    const headers = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: authToken,
    };
    const requestOptions = { headers: new HttpHeaders(headers) };
    return this.http.post<any>(
      'https://app.jmcleanco.com/api/1.1/wf/app_submit_snapshot',req,
      requestOptions
    );
  }
}

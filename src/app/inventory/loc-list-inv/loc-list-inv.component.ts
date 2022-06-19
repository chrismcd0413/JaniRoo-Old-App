/* eslint-disable no-underscore-dangle */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InventoryService } from 'src/app/inventory.service';
import { SnapshotBase } from 'src/app/models/snapshot-base';
import { Storage } from '@ionic/storage-angular';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface inventorySnapshotData {
  locations: [
    {
      locName: string;
      locId: string;
      inventoryItems: SnapshotBase[];
    }
  ];
  unreadMsgCount: number;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
interface inventoryLocationData {
  locName: string;
  locId: string;
  inventoryItems: SnapshotBase[];
}

@Component({
  selector: 'app-loc-list-inv',
  templateUrl: './loc-list-inv.component.html',
  styleUrls: ['./loc-list-inv.component.scss'],
})
export class LocListInvComponent implements OnInit, OnDestroy {
  isLoadingData = false;
  inventoryList: inventoryLocationData[] = [];
  private inventorySub: Subscription;

  constructor(
    private router: Router,
    private inventorySvc: InventoryService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.inventorySub = this.inventorySvc.inventoryData.subscribe((data) => {
      if (data === null) {
        this.inventoryList = [];
      } else {
        this.inventoryList = data.locations;
      }
      console.log('InventoryData Loaded: ', JSON.stringify(this.inventoryList));
    });
  }
  ngOnDestroy() {
    this.inventorySub.unsubscribe();
  }
  ionViewWillEnter() {
    let token;
    this.storage.get('user').then((u) => {
      token = u._token;
      this.inventorySvc.getInventoryData(token);
    });
  }
  enterLocationInventory(id: string) {
    this.router.navigate(['inventory', 'snapshot', id]);
  }
}

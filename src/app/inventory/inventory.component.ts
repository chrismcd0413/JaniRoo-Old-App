/* eslint-disable no-underscore-dangle */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { InventoryService } from '../inventory.service';
import { MessageService } from '../message.service';
import { SnapshotBase } from '../models/snapshot-base';
import { inventorySnapshotData } from './loc-list-inv/loc-list-inv.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit, OnDestroy {
  items: SnapshotBase[] = [];
  form!: FormGroup;
  formLoaded = false;
  locationName = '';
  private paramSub: Subscription;
  private inventoryData: inventorySnapshotData;
  private inventorySub: Subscription;
  constructor(private activatedRoute: ActivatedRoute,
    private navControl: NavController,
    private inventorySvc: InventoryService,
    private storage: Storage,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private messageCtrl: MessageService,
    private authService: AuthService) { }

  ngOnInit() {
    this.inventorySub = this.inventorySvc.inventoryData.subscribe(data => {
      this.inventoryData = data;
      console.log('Loaded Inventory Data Inv Comp: ', JSON.stringify(this.inventoryData));
    });
    this.paramSub = this.activatedRoute.paramMap.subscribe(map => {
      if (!map.has('id')){
        this.navControl.navigateBack('/dashboard');
        return;
      }
      console.log('ID', map.get('id'));
      this.getItems(map.get('id'));
    });
  }
  ngOnDestroy() {
    this.paramSub.unsubscribe();
    this.inventorySub.unsubscribe();
  }
  getItems(id: string) {
    const tempInvData = this.inventoryData.locations.find(({locId}) => locId === id);
    this.items = tempInvData.inventoryItems;
    this.locationName = tempInvData.locName;
    console.log('Items: ', JSON.stringify(this.items));
    this.form = this.createFormGroup(this.items as SnapshotBase[]);
  }
  createFormGroup(items: SnapshotBase[]){
    const group: any = {};

    items.forEach(item => {
      group[item.id] = new FormControl('', Validators.required);
    });
    this.formLoaded = true;
    return new FormGroup(group);
  }
  submitSnapshot(){
    this.loadingCtrl
      .create({ keyboardClose: true, message: 'Submitting Inventory...' })
      .then((el) => {
        el.present();
        let token;
    const formattedRequest: any[] = [];
    const formattedItems = Object.keys(this.form.value);
    for(const snap of formattedItems) {
      const count = this.form.controls[snap].value;
      const newEntry = { itemId: snap ,  quantity: count };
      formattedRequest.push(newEntry);
    }

    this.storage.get('user').then((u) => {
      token = u._token;
      this.inventorySvc.submitSnapshot(formattedRequest ,token)
      .subscribe(resp => {
        el.dismiss();
        this.form.reset();
        this.navControl.back();
      }, (error: HttpErrorResponse) => {
        el.dismiss();
        if (error.status === 401){
          this.authService.logout();
        } else {
        this.alertCtrl
              .create({
                header: 'Error',
                message:
                  'We ran into an issue submitting your inventory. Please try again.',
                buttons: ['Okay'],
              })
              .then((alertEl) => alertEl.present());
      }});
    });
      });
    }
}

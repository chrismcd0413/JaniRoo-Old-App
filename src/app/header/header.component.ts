import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, MenuController } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() title: string;
  constructor(private menuController: MenuController,
    private loadingCtrl: LoadingController) {}

  ngOnInit() {
    this.menuController.enable(true);
  }

}

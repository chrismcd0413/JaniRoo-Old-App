import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SnapshotBase } from 'src/app/models/snapshot-base';

@Component({
  selector: 'app-snapshot-item',
  templateUrl: './snapshot-item.component.html',
  styleUrls: ['./snapshot-item.component.scss'],
})
export class SnapshotItemComponent implements OnInit {
  @Input() item!: SnapshotBase;
  @Input() form!: FormGroup;
  get isValid() {
    return this.form.controls[this.item.id].valid;
  }
  constructor() { }

  ngOnInit() {}

}

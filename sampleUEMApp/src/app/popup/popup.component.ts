/**********************************

Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

**********************************/
import { Inject, Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { OrgData } from '../dataObj/OrgData';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.css'],
    standalone: true,
    imports: [MatDialogModule, MatFormFieldModule, MatSelectModule, NgFor, MatOptionModule, MatButtonModule]
})
export class PopupComponent implements OnInit{
  ouList: Array<OrgData> = [];
  catList: Array<string> = [];
  selectedOU = "/";
  selectedPolicySchema = "Printers";
  constructor(public dialogRef: MatDialogRef<PopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {ouList: Array<OrgData>, schemaList: string[], selectedOU: string, selectedSchema: string},) {
    
  }

  ngOnInit() {
    //console.log(this.data);
    this.ouList = this.data.ouList;
    this.catList = this.data.schemaList;
    this.selectedOU = this.data.selectedOU;
    this.selectedPolicySchema = this.data.selectedSchema;
  }

}

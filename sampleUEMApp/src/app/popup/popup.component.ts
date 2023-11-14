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
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { OrgData } from '../dataObj/OrgData';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit{
  ouList: Array<OrgData> = [];
  catList: Array<String> = [];
  selectedOU: String = "/";
  selectedPolicySchema: String = "Printers";
  constructor(public dialogRef: MatDialogRef<PopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {ouList: Array<OrgData>, schemaList: String[], selectedOU: String, selectedSchema: String},) {
    
  }

  ngOnInit() {
    //console.log(this.data);
    this.ouList = this.data.ouList;
    this.catList = this.data.schemaList;
    this.selectedOU = this.data.selectedOU;
    this.selectedPolicySchema = this.data.selectedSchema;
  }

}

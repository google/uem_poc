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
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Policy } from '../dataObj/Policy';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
// import {MatBadgeModule} from '@angular/material/badge';
//import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import { PolicyControlService } from '../policy-control.service';
import { CallAPIService } from '../call-api.service';
import { OrgData } from '../dataObj/OrgData';
import { MatRadioModule } from '@angular/material/radio';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgFor, NgSwitch, NgSwitchCase, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-policy-schema',
    templateUrl: './policy-schema.component.html',
    styleUrls: ['./policy-schema.component.css'],
    standalone: true,
    imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, NgFor, NgSwitch, NgSwitchCase, MatFormFieldModule, NgIf, MatInputModule, MatSelectModule, MatOptionModule, MatRadioModule]
})
export class PolicySchemaComponent implements OnInit{

  @Input() policyObj!: Policy;
  @Input() selectedOUID: string;
  @Input() orgList: Array<OrgData>;
  @Output() policyFormEvent = new EventEmitter<FormGroup>();
  @Output() inheritPolicyEvent = new EventEmitter<Policy>();
  form: FormGroup;

  constructor(private service: CallAPIService, private pcs: PolicyControlService){
    console.log("Initialized Policy schema component")
  }

  ngOnInit() {
    this.form = this.pcs.toFormGroup(this.policyObj);
    this.policyFormEvent.emit(this.form as FormGroup);
    //console.log(this.form)
  }

  get isValid() { 
    return this.form.controls[this.policyObj.schemaName].valid; 
  }

  inheritFromOU($event: MouseEvent) {
    ($event.currentTarget as HTMLButtonElement).disabled = true;
    this.inheritPolicyEvent.emit(this.policyObj as Policy);
  }

  submitForm(){
    alert(JSON.stringify(this.form.value));
  }

  isInherited(policyOID: string){
    //console.log(this.policyObj.schemaName)
    //console.log(policyOID)
    //console.log(this.selectedOUID)
    if(policyOID === "default" || this.service.getOUName(this.orgList, this.selectedOUID.split(":").pop()) === '/'){
      return true;
    } else if (policyOID != this.selectedOUID.split(":").pop()){
      return true;
    } else {
      return false;
    }
  }

  getOUName(ouID: string){
    //console.log(ouID);
    const OUName = this.service.getOUName(this.orgList, ouID);
    
    if(ouID === "default"){
      return ouID;
    } else if(OUName === '/'){
      return "root";
    }

    //console.log(OUName)
    return OUName;
    
  }

  valuesAvailable(valueList: any){
    if (valueList && valueList.length > 0){
      return true;
    }
    return false;
  }
}

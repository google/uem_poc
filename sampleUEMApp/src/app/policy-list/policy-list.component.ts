/**********************************

Copyright 2024 Google LLC

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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges  } from '@angular/core';
import { CallAPIService } from '../services/call-api.service';
import { Policy } from '../dataObj/Policy';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ModifyPolicy } from '../dataObj/ModifyPolicy';
import { OrgData } from '../dataObj/OrgData';
import { InheritPolicy } from '../dataObj/InheritPolicy';
import { LoadingPopupComponent } from '../loading-popup/loading-popup.component';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import { PolicySchemaComponent } from '../policy-schema/policy-schema.component';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-policy-list',
    templateUrl: './policy-list.component.html',
    styleUrls: ['./policy-list.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, MatButtonModule, NgFor, NgIf, PolicySchemaComponent]
})
export class PolicyListComponent implements OnChanges{
  @Input() set policies (policyList: Policy[]){
    this._policies = policyList;
  }
  private _policies: any;
  @Input() set orgId(oId: string){
    this._orgId = oId;
  }
  private _orgId: string;
  @Input() set ouList(oList: Array<OrgData>){
    this._ouList = oList;
  }
  private _ouList: Array<OrgData>;
  @Input() set policySchemaNameSpace(pSchemaNS: string){
    this._pSchemaNameSpace = pSchemaNS;
  }
  private _pSchemaNameSpace: string;

  policiesToInherit: InheritPolicy[] = [];
  policySchemaForm = this.fb.group({});

  @Output() submitPolicyUpdateEvent = new EventEmitter();
  
  constructor(private service: CallAPIService, private fb: FormBuilder, private dialog: MatDialog, private cdref: ChangeDetectorRef) {
    console.log("Initiazed Policy List Component")
    
  }

  get policySchemaNameSpace() {
    return this._pSchemaNameSpace;
  }


  get orgId() {
    return this._orgId;
  }

  get policies() {
    return this._policies;
  }

  get ouList() {
    return this._ouList;
  }
  
  ngDoCheck(){
    console.log("Change detection - Policy List Component");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['orgId'] || changes['policySchemaNS']){
      this.policySchemaForm.controls = {};
    }
}

  updatePolicy(){
    let progressValue = 0;
    const mdConfig = new MatDialogConfig();
    mdConfig.disableClose = true;
    mdConfig.width = "200px";
    mdConfig.height = " 200px";
    mdConfig.data = {};
    const dialogRef = this.dialog.open(LoadingPopupComponent,mdConfig)
    const updatePolicyObjList: ModifyPolicy[] = [];
    if(this.policySchemaForm.dirty){
      Object.keys(this.policySchemaForm.controls).forEach(key => {
        if(this.policySchemaForm.controls[key].dirty){
          const updatePolicyObj: ModifyPolicy = new ModifyPolicy();
          const policySchemaUpdatedValues = this.getModifyPolicySchemaValue(key);

          updatePolicyObj.policyValue = {
            policySchema: key,
            value: policySchemaUpdatedValues

          }

          updatePolicyObj.updateMask = Object.keys(policySchemaUpdatedValues).toString();
          
          updatePolicyObj.policyTargetKey = {"targetResource": 'orgunits/'+this.orgId.split(":").pop()};
          updatePolicyObjList.push(updatePolicyObj);
        }
      });
    }
    if (this.policiesToInherit.length > 0){
      console.log("Policies to modify")
      console.log(updatePolicyObjList)
      console.log("Policies to inherit")
      console.log(this.policiesToInherit)
      if(updatePolicyObjList.length > 0){
        // Remove items in the modify list if they are in the inherit list
        this.policiesToInherit.forEach(item => {
          const index = updatePolicyObjList.findIndex(policyObj => policyObj.policyValue.policySchema === item.policySchema);
          if(index != -1){
            updatePolicyObjList.splice(index,1);
          }
        });
      }

      const inheritAPIResponse = this.service.makeBatchInheritCall(this.policiesToInherit);
      inheritAPIResponse.subscribe(item => {
        if (item.state === "success"){
          this.policiesToInherit = [];
          alert("Inherit Changes submitted");
          this.submitPolicyUpdateEvent.emit();
        } else {
          alert("Error when modifying: " + item.error.error.error.message);
        }
        progressValue += 50;
        this.closeDialog(dialogRef, progressValue);
      });
    } else {progressValue += 50;}

    if(updatePolicyObjList.length > 0){
      console.log("Policies to modify")
      console.log(updatePolicyObjList)
      const modifyAPIResponse = this.service.makeBatchModifyCall(updatePolicyObjList);

      modifyAPIResponse.subscribe(item => {
          if (item.state === "success"){
            console.log("Modify changes success");
            alert("Modify Changes submitted");
            this.submitPolicyUpdateEvent.emit();
          } else {
            alert("Error when modifying: " + item.error.error.error.message);
          }
          progressValue += 50;
          this.closeDialog(dialogRef, progressValue);
        }
      );
    } else {progressValue += 50;}

    this.closeDialog(dialogRef, progressValue);
  }

  addGroup(policyName:string, newItem: FormGroup) {
    this.policySchemaForm.setControl(policyName, newItem);
  }

  inheritPolicy(policy: Policy){
    const policyInheritObj = new InheritPolicy();
    policyInheritObj.policySchema = policy.schemaName;
    policyInheritObj.policyTargetKey = {"targetResource": 'orgunits/'+this.orgId.split(":").pop()};
    this.policiesToInherit.push(policyInheritObj);
    
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
  }

  private getModifyPolicySchemaValue(key: string){
    const modifiedVals = {};

    Object.keys(this.policySchemaForm.controls[key].value).forEach(updatedFieldVal => {
      if(this.policySchemaForm.controls[key].value[updatedFieldVal]){
        modifiedVals[updatedFieldVal.split(".").pop()] = this.convertToBooleanOrKeepValue(this.policySchemaForm.controls[key].value[updatedFieldVal])
      }
    });

    return modifiedVals;
  }

  private convertToBooleanOrKeepValue(input: string) {
    try {
        return JSON.parse(input.toLowerCase());
    }
    catch (e) {
        return input;
    }
  }

  private closeDialog(dialogRef: any, progress: number){
    if (progress > 50 ){
      dialogRef.close();
    }
  }

}

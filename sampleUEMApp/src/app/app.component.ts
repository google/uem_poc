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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallAPIService } from './call-api.service';
import { Policy } from './dataObj/Policy';
import {MatDialog} from '@angular/material/dialog';
import { PopupComponent } from './popup/popup.component';
import { OrgData } from './dataObj/OrgData';
import { RouterOutlet } from '@angular/router';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
//import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [CommonModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatButtonModule, PolicyListComponent, RouterOutlet]
})
export class AppComponent implements OnInit{
  title = 'sampleUEMApp';
  policiesObj: Policy[];
  //resolvedPoliciesObj: Policy[];
  selectedOU = "/";
  selectedPolicySchema = 'User Application settings';
  selectedPolicyNS = "chrome.users.appsconfig";
  orgList: Array<OrgData> = [];
  constructor(private dialog: MatDialog, private service: CallAPIService) {
    console.log("Initialized App component")    
  }

  ngOnInit(): void {
    this.policiesObj = this.service.getPolicies(this.selectedPolicyNS);
    const orgResponse$ = this.service.getOrgListAPI();

    orgResponse$.subscribe(orgs => {
        if (orgs.state === "success"){
          if(orgs.result.organizationUnits && orgs.result.organizationUnits.length > 0){
              orgs.result.organizationUnits.forEach((item) => {
                this.orgList.push({
                  ouid: item.orgUnitId,
                  path: item.orgUnitPath,
                  parent: item.parentOrgUnitId,
                });
              });
              //this.orgList.push(this.service.getRootOrg(this.orgList));
          }
        }
        const resolveInitCall$ = this.service.getResolvedPolicies(this.getOUID(this.selectedOU), this.service.getPolicyNameSpace(this.selectedPolicySchema.toString()));
        this.resolvePolicy(resolveInitCall$);
      }
    );
  }

  login(){
    this.service.login()
  }
  
  openDialog() {
    const categories = this.service.getPolicyCategories();
    console.log(this.orgList)
    const dialogRef = this.dialog.open(PopupComponent, {
      data: {ouList: this.orgList, schemaList: categories, selectedOU: this.getOUID(this.selectedOU), selectedSchema: this.selectedPolicySchema},
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result: ', result);

      if (result) {
        
        if(result.selectedOU != this.getOUID(this.selectedOU) || result.selectedPolicySchema != this.selectedPolicySchema){
          const resolveCall$ = this.service.getResolvedPolicies(result.selectedOU, this.service.getPolicyNameSpace(result.selectedPolicySchema.toString()))
          this.resolvePolicy(resolveCall$);
        }
        this.selectedOU =  this.service.getOUName(this.orgList, result.selectedOU.split(":").pop());
        this.selectedPolicySchema = result.selectedPolicySchema;
        this.selectedPolicyNS = this.service.getPolicyNameSpace(this.selectedPolicySchema.toString());
        this.policiesObj = this.service.getPolicies(this.selectedPolicyNS);
      }
    });
  }

  private resolvePolicy(resolveCall$: any){
      resolveCall$.subscribe(item => {
      //resPolicies = item.get("resolvedPolicies");
        console.log(item)
        if (item.state === "success" && item.result.resolvedPolicies){
          for (const policy of item.result.resolvedPolicies)
          {
            const index = this.policiesObj.findIndex(item => item.schemaName === policy.value.policySchema);
            
            //console.log(index);
            this.policiesObj[index].inheritedOU = policy.sourceKey['targetResource'].split('/').pop();
            //console.log(this.policiesObj[index])
            for (const field of Object.keys(policy.value.value)){
              for(let i=0; i<this.policiesObj[index].fieldDescriptions.length; i++){
                // if(this.policiesObj[index]){
                //   this.policiesObj
                // }
                if (this.policiesObj[index].fieldDescriptions[i].fName === field){
                  this.policiesObj[index].fieldDescriptions[i].fValue = policy.value.value[field]
                }
              }
            }
          }
        }
      });
  }

  getOUID(ouname: string){
    let ouid = "";
    for (const org of this.orgList){
      //console.log(org.ouid)
      if (org.path === ouname){
        ouid = org.ouid;
      }
    }
    return ouid;

  }

}

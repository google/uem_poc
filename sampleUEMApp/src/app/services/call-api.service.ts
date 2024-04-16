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
import { Injectable, OnDestroy, inject } from '@angular/core';
import { Policy, PolicyData, PolicyAPIResponse } from '../dataObj/Policy';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OrgData } from '../dataObj/OrgData';
import { map, of, catchError, expand, EMPTY } from 'rxjs';
import { ModifyPolicy } from '../dataObj/ModifyPolicy';
import { InheritPolicy } from '../dataObj/InheritPolicy';
import { GoogleAuthService } from './google-auth.service';


  const filterCategory = new Map([
    ["Users", "chrome.users"],
    ["User Application settings", "chrome.users.appsconfig"],
    ["Devices", "chrome.devices"],
    ["Managed Guest", "chrome.devices.managedguest"],
    ["Kiosk", "chrome.devices.kiosk"],
    ["Networks Global Settings", "chrome.networks.globalsettings"]
    ]);

@Injectable({
  providedIn: 'root'
})
export class CallAPIService implements OnDestroy{
  policyURL = 'https://chromepolicy.googleapis.com';
  adminsdkURL = 'https://admin.googleapis.com';
  private oAuthService = inject(GoogleAuthService);
  private schemaAPISubscription;

  constructor(private readonly httpClient: HttpClient) {
    console.log('Initialized call api service')
   }
  
  ngOnDestroy(): void {
    this.schemaAPISubscription.unsubscribe();
  }

  getPolicyNameSpace(category: string) {

    return filterCategory.get(category);

  }
  getPolicyCategories() {
    const  categories: string[] = [];
    
    for(const key of filterCategory.keys()){
      categories.push(key)
    }

    return categories;
  }
    

  private getPolicySchemaAPI(policyNS: string, token = "") {
    var tokenSuffix = token === "" ? "" : `&pageToken=${token}`;
    
    return this.httpClient.get(`${this.policyURL}/v1/customers/my_customer/policySchemas?pageSize=500&filter=namespace=${policyNS}${tokenSuffix}`, { headers: this.authHeader() }).pipe(
      map((result) => {
        return {
          state: 'success',
          result: result,
        } as PolicyAPIResponse
      }),
      catchError((err) =>
        of({
          state: 'error',
          error: err,
        } as PolicyAPIResponse),
      ),
    );
  }

  getOrgListAPI() {
      return this.httpClient.get(`${this.adminsdkURL}/admin/directory/v1/customer/my_customer/orgunits?type=ALL_INCLUDING_PARENT`, { headers: this.authHeader() }).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as PolicyAPIResponse
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          } as PolicyAPIResponse),
        ),
      );
  }

  private authHeader() : HttpHeaders {
    return new HttpHeaders ({
      'Authorization': `Bearer ${this.oAuthService.getToken()}`
    })
  }

  getPolicies$(schemaNS: string) {
    const schemaResponse$ = this.getPolicySchemaAPI(schemaNS).pipe(
      expand (response => response.result["nextPageToken"] ? this.getPolicySchemaAPI(schemaNS, response.result["nextPageToken"]) : EMPTY),
    );
    return schemaResponse$.pipe(
      map(list => {
        const policyList: Policy[] = [];
        if (list.state === "success"){
          for (const policy of list.result["policySchemas"])
          {
            const policySchema: PolicyData = {
              schemaName: policy.schemaName,
              categoryTitle: policy.categoryTitle,
              policyDescription: policy.policyDescription,
              policyAPILifeCycleStage: policy.policyApiLifecycle.policyApiLifecycleStage,
              targetKey: null,
              fieldDescriptions: [],
              inheritedOU: "default"
            }
            if (policy.additionalTargetKeyNames){
              const targetList = []
              for (const target of policy.additionalTargetKeyNames){
                targetList.push({ name: target.key, values: []})
              }
              policySchema.targetKey = targetList;
            }
            
            for (const field of policy.fieldDescriptions)
            {
              const f_obj = {
                fName: field.field,
                fValue: field.defaultValue,
                fDescription: field.description,
                fType: this.getFieldType(policy.definition.messageType[0].field, field.field),
                fIsReqd: this.isFieldRequired(policy.definition.messageType[0].field, field.field),
                fEnumList: field.knownValueDescriptions
              };
              policySchema.fieldDescriptions.push(f_obj);
            }
            policyList.push(policySchema);
          }
        }
        return policyList;
      })
    );
  }

  getPolicies(schemaNS: string) {
    const policyList: Policy[] = [];
    
    const schemaResponse$ = this.getPolicySchemaAPI(schemaNS).pipe(
      expand (response => response.result["nextPageToken"] ? this.getPolicySchemaAPI(schemaNS, response.result["nextPageToken"]) : EMPTY),
    );

    this.schemaAPISubscription = schemaResponse$.subscribe(list => {
      // Extract Policy fields from policy schema for display
      if (list.state === "success"){
        for (const policy of list.result["policySchemas"])
        {
          const policySchema: Policy = new Policy();
          policySchema.schemaName = policy.schemaName;
          policySchema.categoryTitle = policy.categoryTitle;
          policySchema.policyDescription = policy.policyDescription;
          policySchema.policyAPILifeCycleStage = policy.policyApiLifecycle.policyApiLifecycleStage;
          if (policy.additionalTargetKeyNames){
            const targetList = []
            for (const target of policy.additionalTargetKeyNames){
              targetList.push({ name: target.key, values: []})
            }
            policySchema.targetKey = targetList;
          }
          
          for (const field of policy.fieldDescriptions)
          {
            const f_obj = {
              fName: field.field,
              fValue: field.defaultValue,
              fDescription: field.description,
              fType: this.getFieldType(policy.definition.messageType[0].field, field.field),
              fIsReqd: this.isFieldRequired(policy.definition.messageType[0].field, field.field),
              fEnumList: field.knownValueDescriptions
            };
            policySchema.fieldDescriptions.push(f_obj);
          }
          policyList.push(policySchema);
        }
      }
    });

    return policyList;
  }

  private getFieldType(fList: any, name: any){
    const fieldObj = fList.find(i => i.name === name);
    return fieldObj.type;
  }

  private isFieldRequired(fList: any, name: any){
    const fieldObj = fList.find(i => i.name === name);
    if (fieldObj.label === "LABEL_OPTIONAL")
    {
      return false;
    } else {
      return true;
    }
  }

  getResolvedPolicies (ouid: string, filter: string){
    
    const resolveResponse$ = this.getResolveAPI(ouid, filter).pipe(
      expand ((response: any) => {
        if (response.state === "success" && response.result["nextPageToken"])
        {
          return this.getResolveAPI(ouid, filter, response.result["nextPageToken"])
        }
        return EMPTY
      })
    );
    
    return resolveResponse$;
  }

  private getResolveAPI(ouid:string, filter: string, token = "") {
    const orgid = ouid.split(":").pop();
    var tokenSuffix = token === "" ? "" : `&pageToken=${token}`;

    const body={
        "policyTargetKey": {"targetResource": 'orgunits/'+orgid},
        "policySchemaFilter": filter+'.*'
      }
    
    return this.httpClient.post(`${this.policyURL}/v1/customers/my_customer/policies:resolve?pageSize=500${tokenSuffix}`,body,{ headers: this.authHeader() }).pipe(
      map((result) => {
        return {
          state: 'success',
          result: result,
        } as PolicyAPIResponse
      }),
      catchError((err) =>
        of({
          state: 'error',
          error: err,
        } as PolicyAPIResponse),
      ),
    );
  }

  makeBatchModifyCall(modifyPolicyList: ModifyPolicy[]) {

      const body={
          "requests": modifyPolicyList
        }
      return this.httpClient.post(`${this.policyURL}/v1/customers/my_customer/policies/orgunits:batchModify`,body,{ headers: this.authHeader() }).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as PolicyAPIResponse
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          } as PolicyAPIResponse),
        ),
      );
  }

  makeBatchInheritCall(inheritPolicyList: InheritPolicy[]) {

    const body={
        "requests": inheritPolicyList
      }
    return this.httpClient.post(`${this.policyURL}/v1/customers/my_customer/policies/orgunits:batchInherit`,body,{ headers: this.authHeader() }).pipe(
      map((result) => {
        return {
          state: 'success',
          result: result,
        } as PolicyAPIResponse
      }),
      catchError((err) =>
        of({
          state: 'error',
          error: err,
        } as PolicyAPIResponse),
      ),
    );
  }

  getOUName(orgList: Array<OrgData>, ouid: string){
    let ouName = "/";
    for(let i=0; i<orgList.length; i++){
      if(orgList[i].ouid.split(":").pop() === ouid){
        ouName = orgList[i].path;
      }
    }
    return ouName;
  }

}

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
import { Injectable, OnDestroy, inject } from '@angular/core';
import { AuthConfig } from 'angular-oauth2-oidc';
import { Policy, PolicyData } from '../dataObj/Policy';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OrgData } from '../dataObj/OrgData';
import { map, of, catchError, expand, EMPTY } from 'rxjs';
import { ModifyPolicy } from '../dataObj/ModifyPolicy';
import { InheritPolicy } from '../dataObj/InheritPolicy';
import { GoogleAuthService } from './google-auth.service';

// const oAuthConfig: AuthConfig = {
//   issuer: 'https://accounts.google.com',
//   strictDiscoveryDocumentValidation: false,
//   redirectUri: window.location.origin,
//   clientId: '258558342955-ngb40ej1pj8b1vi4j24t35870s9bbi9a.apps.googleusercontent.com',
//   responseType: 'code',
//   scope: 'openid profile email https://www.googleapis.com/auth/chrome.management.policy https://www.googleapis.com/auth/admin.directory.orgunit.readonly'
// }

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
    if (token === ""){
      return this.httpClient.get(`${this.policyURL}/v1/customers/my_customer/policySchemas?pageSize=500&filter=namespace=${policyNS}`, { headers: this.authHeader() }).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as any
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          }),
        ),
      );
    } else {
      return this.httpClient.get(`${this.policyURL}/v1/customers/my_customer/policySchemas?pageSize=500&filter=namespace=${policyNS}&pageToken=${token}`, { headers: this.authHeader()}).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as any
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          }),
        ),
      );
    }
  }

  getOrgListAPI() {
      return this.httpClient.get(`${this.adminsdkURL}/admin/directory/v1/customer/my_customer/orgunits?type=ALL_INCLUDING_PARENT`, { headers: this.authHeader() }).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as any
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          }),
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
            //console.log(policy)
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
                fIsReqd: this.getIsReqd(policy.definition.messageType[0].field, field.field),
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
      console.log(list);
      if (list.state === "success"){
        for (const policy of list.result["policySchemas"])
        {
          //console.log(policy)
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
              fIsReqd: this.getIsReqd(policy.definition.messageType[0].field, field.field),
              fEnumList: field.knownValueDescriptions
            };
            policySchema.fieldDescriptions.push(f_obj);
          }
          policyList.push(policySchema);
        }
      }
    });

    
    //Object.freeze(policyList)
    return policyList;
  }

  private getFieldType(fList: any, name: any){
    const fieldObj = fList.find(i => i.name === name);
    return fieldObj.type;
  }

  private getIsReqd(fList: any, name: any){
    const fieldObj = fList.find(i => i.name === name);
    if (fieldObj.label === "LABEL_OPTIONAL")
    {
      return false;
    } else {
      return true;
    }
  }

  getResolvedPolicies (ouid: string, filter: string){
    //let resPolicies: Policy[] = [];
    
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

    if (token === ""){
      const body={
          "policyTargetKey": {"targetResource": 'orgunits/'+orgid},
          "policySchemaFilter": filter+'.*'
        }
      
      return this.httpClient.post(`${this.policyURL}/v1/customers/my_customer/policies:resolve`,body,{ headers: this.authHeader() }).pipe(
        map((result) => {
          return {
            state: 'success',
            result: result,
          } as any
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          }),
        ),
      );
    } else {
        return this.httpClient.get(`${this.policyURL}/v1/customers/my_customer/policySchemas?pageSize=500&pageToken=${token}`, { headers: this.authHeader()}).pipe(
          map((result) => {
            return {
              state: 'success',
              result: result,
            } as any
          }),
          catchError((err) =>
            of({
              state: 'error',
              error: err,
            }),
          ),
        );
      }
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
          } as any
        }),
        catchError((err) =>
          of({
            state: 'error',
            error: err,
          }),
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
        } as any
      }),
      catchError((err) =>
        of({
          state: 'error',
          error: err,
        }),
      ),
    );
}

  getOUName(orgList: Array<OrgData>, ouid: string){
    //console.log(orgList)
    //console.log(ouid)
    let ouName = "/";
    for(let i=0; i<orgList.length; i++){
      if(orgList[i].ouid.split(":").pop() === ouid){
        ouName = orgList[i].path;
      }
    }
    //console.log(ouName);
    return ouName;
  }

}

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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallAPIService } from './services/call-api.service';
import { GoogleAuthService } from './services/google-auth.service';
import { Policy, PolicyData } from './dataObj/Policy';
import {MatDialog} from '@angular/material/dialog';
import { SelectPolicyScopeComponent } from './select-policy-scope/select-policy-scope.component';
import { OrgData } from './dataObj/OrgData';
import { RouterOutlet } from '@angular/router';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, throwError } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatButtonModule, PolicyListComponent, RouterOutlet],
    providers:  [ CallAPIService ],

})
export class AppComponent implements OnInit, OnDestroy{
  title = 'sampleUEMApp';
  policiesObj$: Observable<PolicyData[]>;
  private authService = inject(GoogleAuthService);
  private orgCallSubscription: Subscription;
  private resolveCallSubscription: Subscription;
  selectedOU$ = new Subject<string>();
  selectedOU: string = "/";
  private selectedOUSubscription: Subscription;
  selectedPolicySchema = 'User Application settings';
  selectedPolicyNS$ = new BehaviorSubject("chrome.users.appsconfig");
  selectedOUandNS$ = combineLatest([this.selectedOU$, this.selectedPolicyNS$]);
  resolvedPolicies$: Observable<any>;
  orgList: Array<OrgData>=[];
  orgList$: Observable<any>;
  policies$: Observable<Policy[]>;
  private intervalID;

  constructor(private service: CallAPIService,  private dialog: MatDialog, private cdref: ChangeDetectorRef) {
    console.log("Initialized App component")    
  }

  ngOnInit(): void {
    console.log("App component init")
    
    
    if(this.authService.getProfile()){
      this.policiesObj$ = this.selectedPolicyNS$.pipe(
        switchMap(selectedNS => {
          return this.service.getPolicies$(selectedNS);
        })
      );

      this.resolvedPolicies$ = this.selectedOUandNS$.pipe(
        switchMap(([selectedOU, selectedNS]) => {
          return this.service.getResolvedPolicies(this.getOUID(selectedOU), selectedNS);
        })
      );

      this.policies$ = combineLatest([this.resolvedPolicies$, this.policiesObj$]).pipe(
        filter(([resolvedPolicyObj, allPolicyObj])=>{
          if (resolvedPolicyObj.state != "success" || !resolvedPolicyObj.result.resolvedPolicies){
            return false;
          }
          const policy = resolvedPolicyObj.result.resolvedPolicies[0];
          const index = allPolicyObj.findIndex(item => item.schemaName === policy.value.policySchema);
          return index > -1;
        }),
        map(([resolvedPolicyObj, allPolicyObj])=>{
          allPolicyObj = allPolicyObj.map(
            obj => {
              return {...obj};
            }
          );
          if (resolvedPolicyObj.state === "success" && resolvedPolicyObj.result.resolvedPolicies){
              
              for (const policy of resolvedPolicyObj.result.resolvedPolicies)
              {
                const index = allPolicyObj.findIndex(item => item.schemaName === policy.value.policySchema);
                
                allPolicyObj[index].inheritedOU = policy.sourceKey['targetResource'].split('/').pop();
                allPolicyObj[index].fieldDescriptions = allPolicyObj[index].fieldDescriptions.map(
                  fd => {
                    return {...fd}
                  }
                );

                for (const field of Object.keys(policy.value.value)){
                  for(let i=0; i<allPolicyObj[index].fieldDescriptions.length; i++){

                    if (allPolicyObj[index].fieldDescriptions[i].fName === field){
                      allPolicyObj[index].fieldDescriptions[i].fValue = policy.value.value[field]
                    }
                  }
                }
              }
          }
          return allPolicyObj;
        })
      );
      
      this.selectedOUSubscription = this.selectedOU$.subscribe(selectedOU => this.selectedOU = selectedOU);

      this.getOrgList(this.service.getOrgListAPI());
      this.orgCallSubscription = this.orgList$.subscribe(org => {
            this.orgList = org;
            this.selectedOU$.next("/");
          }
        );
    } else {
      // TODO Workaround below --  Find the correct way to fix the page empty after sign in issue. 
      this.intervalID = setInterval(()=> {
        if(this.authService.getProfile()){
          this.reloadPage();
        }
      },100)
    }
  }

  ngOnDestroy() {
    this.orgCallSubscription.unsubscribe();
    this.resolveCallSubscription.unsubscribe();
    this.selectedOUSubscription.unsubscribe();
    if(this.intervalID !== undefined){clearInterval(this.intervalID)};
  }

  signOut(){
    this.authService.logout();
    this.reloadPage();
  }

  getOrgList(orgs: any){
    this.orgList$ = orgs.pipe(
      filter((res: any) => res.state === "success"),
      map((r:any) => r.result.organizationUnits.map(v => ({
              ouid: v.orgUnitId,
              path: v.orgUnitPath,
              parent: v.parentOrgUnitId,
      }))),
      catchError(throwError)
    );
  }

  reloadPage(){
    window.location.reload()
  }
  openDialog() {
    const categories = this.service.getPolicyCategories();
    const dialogRef = this.dialog.open(SelectPolicyScopeComponent, {
      data: {ouList: this.orgList, schemaList: categories, selectedOU: this.getOUID(this.selectedOU), selectedSchema: this.selectedPolicySchema},
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result: ', result);
      if (result) {
        
        if(result.selectedOU != this.getOUID(this.selectedOU) || result.selectedPolicySchema != this.selectedPolicySchema){
          const resolveCall$ = this.service.getResolvedPolicies(result.selectedOU, this.service.getPolicyNameSpace(result.selectedPolicySchema.toString()))
          this.selectedOU$.next(this.service.getOUName(this.orgList, result.selectedOU.split(":").pop()));
          this.selectedPolicySchema = result.selectedPolicySchema;
          this.selectedPolicyNS$.next(this.service.getPolicyNameSpace(this.selectedPolicySchema.toString()));
        }
      }
    });
  }

  signInWithGoogle() {
    console.log("Sign In Clicked");
    this.authService.login();
  }
  

  getOUID(ouname: string){
    let ouid = "";
    for (const org of this.orgList){
      if (org.path === ouname){
        ouid = org.ouid;
      }
    }
    return ouid;

  }

  policyRefresh(){
    this.selectedOU$.next(this.selectedOU);
  }

}

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
import { Injectable } from '@angular/core';
import { Policy } from '../dataObj/Policy';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PolicyControlService {


  constructor(private fb: FormBuilder) {
    
  }

  toFormGroup(policy: Policy) {
    
    const group: FormGroup = this.fb.group({});

    policy.fieldDescriptions.forEach(field => {
        group.addControl(policy.schemaName+"."+field.fName, field.fIsReqd ? new FormControl(field.fValue, Validators.required)
        : new FormControl(field.fValue));
      });
    
    
    return group;
  }

}

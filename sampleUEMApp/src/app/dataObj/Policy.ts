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
export class Policy{
    categoryTitle: string;
    schemaName: string;
    inheritedOU: string;
    policyDescription: string;
    policyAPILifeCycleStage: string;
    targetKey: TargetKey[] | null;
    fieldDescriptions: Field[];

    constructor(policyObj: {
        categoryTitle?: string;
        schemaName?: string;
        inheritedOU?: string;
        targetKey?: TargetKey[] | null;
        policyDescription?: string;
        policyAPILifeCycleStage?: string;
        fieldDescriptions?: Field[];
    }={}){
        this.categoryTitle = policyObj.categoryTitle || '';
        this.schemaName = policyObj.schemaName || '';
        this.inheritedOU = policyObj.inheritedOU || 'default';
        this.targetKey = policyObj.targetKey || null;
        this.policyDescription = policyObj.policyDescription  || '';
        this.policyAPILifeCycleStage = policyObj.policyAPILifeCycleStage;
        this.fieldDescriptions = policyObj.fieldDescriptions || [];
    }

}

export interface PolicyData {
    categoryTitle: string;
    schemaName: string;
    inheritedOU: string;
    policyDescription: string;
    policyAPILifeCycleStage: string;
    targetKey: TargetKey[] | null;
    fieldDescriptions: Field[];
}

export interface PolicyAPIResponse{
    state:string;
    result:Object;
    error: any;
}

interface TargetKey {
    name: string;
    values: string[];
}

interface Field {
    fName: string;
    fDescription: string;
    fType: string;
    fValue: any;
    fIsReqd: boolean;
    fEnumList: FieldValueOptions[];
}

interface FieldValueOptions{
    value:string;
    description: string;
}


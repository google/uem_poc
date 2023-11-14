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
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatDialogModule} from '@angular/material/dialog';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CallAPIService } from './call-api.service';
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { Routes, RouterModule, Router } from "@angular/router";
import { PolicyListComponent } from './policy-list/policy-list.component';
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule } from 'angular-oauth2-oidc';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {ReactiveFormsModule} from '@angular/forms';
import { PolicySchemaComponent } from './policy-schema/policy-schema.component';
import {MatRadioModule} from '@angular/material/radio';
import { PopupComponent } from './popup/popup.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatBadgeModule} from '@angular/material/badge';
import { LoadingPopupComponent } from './loading-popup/loading-popup.component';
import {MatChipsModule} from '@angular/material/chips';


const routes : Routes = [
  //{path: '', component: AppComponent}
]
@NgModule({
  declarations: [
    AppComponent,
    PolicyListComponent,
    PolicySchemaComponent,
    PopupComponent,
    LoadingPopupComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatBadgeModule,
    MatToolbarModule,
    MatRadioModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule, 
    MatProgressSpinnerModule,
    OAuthModule.forRoot()
  ],
  providers: [CallAPIService],
  bootstrap: [AppComponent]
})
export class AppModule { }

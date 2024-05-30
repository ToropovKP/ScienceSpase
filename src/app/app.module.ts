import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {AppRoutingModule} from "./app-routing.module";
import {HomeComponent} from "./system/home/home.component";
import {NotFoundComponent} from "./system/not-found/not-found.component";
import {ConferencesComponent} from "./system/all-conferences/conferences.component";
import {ConferenceComponent} from "./system/one-conference/conference.component";
import {HeaderComponent} from "./system/shared/header/header.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {JobsComponent} from './system/jobs/jobs.component';
import {HttpClientModule} from "@angular/common/http";
import {CommonModule} from "@angular/common";
import {NgxMaskModule} from "ngx-mask";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ConferenceJobsComponent} from "./system/conference-jobs/conference-jobs.component";
import {UsersComponent} from "./system/all-users/users.component";
import {ConferenceCreateComponent} from "./system/one-conference-create/conference-create.component";
import {OneJobComponent} from "./system/one-job/one-job.component";
import {ProfileComponent} from './system/profile/profile.component';
import {format} from "date-fns";
import {ru} from "date-fns/locale/ru";
import {AlertModule} from "./system/shared/alert/alert.module";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NotFoundComponent,
    ConferencesComponent,
    ConferenceComponent,
    ConferenceCreateComponent,
    ConferenceJobsComponent,
    UsersComponent,
    HeaderComponent,
    JobsComponent,
    OneJobComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    ReactiveFormsModule.withConfig({callSetDisabledState: 'whenDisabledForLegacyCode'}),
    FormsModule,
    HttpClientModule,
    NgxMaskModule.forRoot(),
    NgbModule,
    AlertModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}

export class AppConstants {

  public static formatDate(date: Date): string {
    return format(date, 'd MMM y', {locale: ru});
  }

  public static formatDateTime(date: Date): string {
    return format(date, 'd MMM y HH:mm:ss', {locale: ru});
  }

  public static get baseURL(): string {
    return ".";
  }

  public static get conferenceStatusMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('ACTIVE', 'Открыта');
    statusMap.set('ON_HOLD', 'Временно приостановлена');
    statusMap.set('CLOSED', 'Закрыта');
    statusMap.set('Открыта', 'ACTIVE');
    statusMap.set('Временно приостановлена', 'ON_HOLD');
    statusMap.set('Закрыта', 'CLOSED');
    return statusMap;
  }

  public static get userStatusMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('ACTIVE', 'Активен');
    statusMap.set('BANNED', 'Заблокирован');
    statusMap.set('CONFIRMATION', 'Подтверждение');
    statusMap.set('Активен', 'ACTIVE');
    statusMap.set('Заблокирован', 'BANNED');
    statusMap.set('Подтверждение', 'CONFIRMATION');
    return statusMap;
  }

  public static get userRoleMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('MEMBER', 'Участник');
    statusMap.set('ADMIN', 'Админ');
    statusMap.set('SUPER_ADMIN', 'Супер-админ');
    statusMap.set('Участник', 'MEMBER');
    statusMap.set('Админ', 'ADMIN');
    statusMap.set('Супер-админ', 'SUPER_ADMIN');
    return statusMap;
  }
}

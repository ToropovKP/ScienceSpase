import {bootstrapApplication} from '@angular/platform-browser';
import {format} from "date-fns";
import {ru} from "date-fns/locale/ru";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask, provideNgxMask} from "ngx-mask";
import {provideRouter, Routes, withInMemoryScrolling} from "@angular/router";
import {enableProdMode} from "@angular/core";
import {environment} from "./environments/environment";
import {HomeComponent} from "./app/system/home/home.component";
import {ConferencesComponent} from "./app/system/all-conferences/conferences.component";
import {ConferenceCreateComponent} from "./app/system/one-conference-create/conference-create.component";
import {ConferenceJobsComponent} from "./app/system/conference-jobs/conference-jobs.component";
import {ConferenceComponent} from "./app/system/one-conference/conference.component";
import {JobsComponent} from "./app/system/jobs/jobs.component";
import {OneJobComponent} from "./app/system/one-job/one-job.component";
import {UsersComponent} from "./app/system/all-users/users.component";
import {ProfileComponent} from "./app/system/profile/profile.component";
import {AppComponent} from "./app/app.component";


// @NgModule({
//   declarations: [],
//   bootstrap: [AppComponent],
//   imports: [BrowserModule,
//     AppRoutingModule,
//     RouterModule,
//     CommonModule,
//     ReactiveFormsModule.withConfig({callSetDisabledState: 'whenDisabledForLegacyCode'}),
//     FormsModule, NgxMaskDirective, NgxMaskPipe,
//     NgbModule,
//     AlertModule],
//   providers: [provideHttpClient(withInterceptorsFromDi()), provideNgxMask()],
// })

if (environment.production) {
  enableProdMode();
}

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'conferences',
    component: ConferencesComponent,
  },
  {
    path: 'conferences/create',
    component: ConferenceCreateComponent
  },
  {
    path: 'conference/:id/edit',
    component: ConferenceCreateComponent
  },
  {
    path: 'conference/:id/jobs',
    component: ConferenceJobsComponent
  },
  {
    path: 'conference/:id',
    component: ConferenceComponent,
  },
  {
    path: 'jobs',
    component: JobsComponent
  },
  {
    path: 'jobs/:id',
    component: OneJobComponent
  },
  {
    path: 'all-users',
    component: UsersComponent
  },
  {
    path: 'profile/:id',
    component: ProfileComponent
  },
  {
    path: '**',
    component: HomeComponent
  },
];

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes,
        withInMemoryScrolling({
          scrollPositionRestoration: 'enabled',
          anchorScrolling: 'enabled',
          // scrollOffset: [0, 64],
        })),
    provideHttpClient(withInterceptorsFromDi()),
    provideEnvironmentNgxMask(maskConfig)
  ],

}).catch((err) => console.error(err));

export class AppConstants {

  public static formatDate(date: Date): string {
    return format(date, 'd MMM y', {locale: ru});
  }

  public static formatDateTime(date: Date): string {
    return format(date, 'd MMM y HH:mm:ss', {locale: ru});
  }

  public static get baseURL(): string {
    return `${environment.apiUrl}`;
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
    statusMap.set('MODERATOR', 'Модератор');
    statusMap.set('ADMIN', 'Админ');
    statusMap.set('REVIEWER', 'Рецензент');
    statusMap.set('Участник', 'MEMBER');
    statusMap.set('Модератор', 'MODERATOR');
    statusMap.set('Админ', 'ADMIN');
    statusMap.set('Рецензент', 'REVIEWER');
    return statusMap;
  }
}

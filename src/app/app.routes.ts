import {Routes} from "@angular/router";
import {ConferencesComponent} from "./system/all-conferences/conferences.component";
import {ConferenceCreateComponent} from "./system/one-conference-create/conference-create.component";
import {ConferenceJobsComponent} from "./system/conference-jobs/conference-jobs.component";
import {ConferenceComponent} from "./system/one-conference/conference.component";
import {JobsComponent} from "./system/jobs/jobs.component";
import {OneJobComponent} from "./system/one-job/one-job.component";
import {UsersComponent} from "./system/all-users/users.component";
import {ProfileComponent} from "./system/profile/profile.component";
import {VerifyAccountComponent} from "./system/verify-account/verify-account.component";
import {RestorePasswordComponent} from "./system/restore-account/restore-password.component";
import {NotFoundComponent} from "./system/not-found/not-found.component";

export const appRoutes: Routes = [
  {
    path: '',
    component: ConferencesComponent
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
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'profile/:id',
    component: ProfileComponent
  },
  {
    path: 'verify-email',
    component: VerifyAccountComponent
  },
  {
    path: 'restore-password',
    component: RestorePasswordComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  },
  {
    path: 'not-found',
    component: NotFoundComponent
  }
];

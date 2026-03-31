import {Routes} from "@angular/router";
import {ConferencesComponent} from "./pages/conferences/conferences.component";
import {ConferenceCreateComponent} from "./pages/one-conference-create/conference-create.component";
import {ConferenceJobsComponent} from "./pages/conference-jobs/conference-jobs.component";
import {ConferenceComponent} from "./pages/one-conference/conference.component";
import {JobsComponent} from "./pages/jobs/jobs.component";
import {OneJobComponent} from "./pages/one-job/one-job.component";
import {UsersComponent} from "./pages/all-users/users.component";
import {ProfileComponent} from "./pages/profile/profile.component";
import {VerifyAccountComponent} from "./pages/verify-account/verify-account.component";
import {RestorePasswordComponent} from "./pages/restore-account/restore-password.component";
import {NotFoundComponent} from "./pages/not-found/not-found.component";
import {JobCreateComponent} from "./pages/one-job-create/job-create.component";

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
    path: 'conference/:confId/job/:id',
    component: OneJobComponent
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
    path: 'jobs/create',
    component: JobCreateComponent
  },
  {
    path: 'job/:id',
    component: OneJobComponent
  },
  {
    path: 'job/:id/edit',
    component: JobCreateComponent
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

import {Routes} from "@angular/router";
import {HomeComponent} from "./system/home/home.component";
import {ConferencesComponent} from "./system/all-conferences/conferences.component";
import {ConferenceCreateComponent} from "./system/one-conference-create/conference-create.component";
import {ConferenceJobsComponent} from "./system/conference-jobs/conference-jobs.component";
import {ConferenceComponent} from "./system/one-conference/conference.component";
import {JobsComponent} from "./system/jobs/jobs.component";
import {OneJobComponent} from "./system/one-job/one-job.component";
import {UsersComponent} from "./system/all-users/users.component";
import {ProfileComponent} from "./system/profile/profile.component";

export const appRoutes: Routes = [
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
    path: 'profile',
    component: ProfileComponent
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

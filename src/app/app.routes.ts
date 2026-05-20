import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/podium/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/shared/auth-layout/auth-layout.component';
import { ConferencesComponent } from './pages/podium/conferences/conferences.component';
import { ConferenceCreateComponent } from './pages/podium/one-conference-create/conference-create.component';
import { ConferenceJobsComponent } from './pages/podium/conference-jobs/conference-jobs.component';
import { ConferenceParticipantsComponent } from './pages/podium/conference-participants/conference-participants.component';
import { ConferenceComponent } from './pages/podium/one-conference/conference.component';
import { JobsComponent } from './pages/podium/jobs/jobs.component';
import { OneJobComponent } from './pages/podium/one-job/one-job.component';
import { UsersComponent } from './pages/podium/all-users/users.component';
import { ProfileComponent } from './pages/podium/profile/profile.component';
import { ChatInboxComponent } from './pages/podium/chat-inbox/chat-inbox.component';
import { VerifyAccountComponent } from './pages/shared/verify-account/verify-account.component';
import { RestorePasswordComponent } from './pages/shared/restore-account/restore-password.component';
import { NotFoundComponent } from './pages/shared/not-found/not-found.component';
import { JobCreateComponent } from './pages/podium/one-job-create/job-create.component';
import { AuthComponent } from './pages/shared/auth/auth.component';
import { SystemContextService } from './shared/services/system-context.service';

const podiumChildRoutes: Routes = [
  { path: '', component: ConferencesComponent },
  { path: 'conferences', component: ConferencesComponent },
  { path: 'conferences/create', component: ConferenceCreateComponent },
  { path: 'conference/:id/edit', component: ConferenceCreateComponent },
  { path: 'conference/:id/participants', component: ConferenceParticipantsComponent },
  { path: 'conference/:id/jobs', component: ConferenceJobsComponent },
  { path: 'conference/:confId/job/:id', component: OneJobComponent },
  { path: 'conference/:id', component: ConferenceComponent },
  { path: 'chat', component: ChatInboxComponent },
  { path: 'jobs', component: JobsComponent },
  { path: 'jobs/create', component: JobCreateComponent },
  { path: 'job/:id', component: OneJobComponent },
  { path: 'job/:id/edit', component: JobCreateComponent },
  { path: 'all-users', component: UsersComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/:id', component: ProfileComponent },
  { path: 'not-found', component: NotFoundComponent },
];

export const appRoutes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: AuthComponent },
      { path: 'recover', component: AuthComponent },
      { path: 'set-password', component: AuthComponent },
    ],
  },
  {
    path: 'podium',
    component: MainLayoutComponent,
    children: podiumChildRoutes,
  },
  {
    path: 'forum',
    loadChildren: () => import('./pages/forum/forum.routes').then((m) => m.forumRoutes),
  },
  {
    path: 'verify-email',
    component: VerifyAccountComponent,
  },
  {
    path: 'restore-password',
    component: RestorePasswordComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const systemContext = inject(SystemContextService);
      return systemContext.current === 'forum' ? '/forum' : '/podium';
    },
  },
  {
    path: '**',
    redirectTo: 'podium/not-found',
  },
];

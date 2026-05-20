import { Routes } from '@angular/router';
import { PageProviderComponent } from '../../layouts/forum/page-provider/page-provider.component';
import { ROUTES as FORUM_ROUTES } from './routes.const';

export const forumRoutes: Routes = [
  {
    path: '',
    component: PageProviderComponent,
    children: [
      {
        path: FORUM_ROUTES.HOME,
        loadComponent: () =>
          import('./home-page/home-page.component').then((m) => m.HomePageComponent),
      },
      {
        path: FORUM_ROUTES.ADD_PUBLICATION,
        loadComponent: () =>
          import('./add-publication-page/add-publication-page.component').then(
            (m) => m.AddPublicationPageComponent,
          ),
      },
      {
        path: FORUM_ROUTES.PROFILE,
        loadComponent: () =>
          import('./profile-page/profile-page.component').then((m) => m.ProfilePageComponent),
      },
    ],
  },
];

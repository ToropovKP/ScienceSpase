import {provideRouter, Router, withInMemoryScrolling} from "@angular/router";
import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from "@angular/core";
import {appRoutes} from "./app.routes";
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';
import {AuthService} from "./shared/services/auth.service";
import {MessageService} from "primeng/api";
import {AuthInterceptor} from "./shared/services/auth.interceptor";

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export function initializeApp(authService: AuthService, router: Router): () => Promise<any> {
  return () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        authService
          .getCurrentUser()
          .catch(() => {
            const currentPath = window.location.pathname;
            const isPublic =
              currentPath === '/auth' ||
              currentPath.startsWith('/auth/') ||
              currentPath === '/verify-email' ||
              currentPath === '/restore-password';
            if (!isPublic) {
              return router.navigate(['']);
            }
            return Promise.resolve(true);
          })
          .finally(resolve);
      }, 500);
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, Router],
      multi: true
    },
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: false, //can true
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'none',
          cssLayer: false
        }
      }
    }),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes,
        withInMemoryScrolling({
          scrollPositionRestoration: 'enabled',
          anchorScrolling: 'enabled',
          // scrollOffset: [0, 64],
        })),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideEnvironmentNgxMask(maskConfig),
    MessageService
  ]
};

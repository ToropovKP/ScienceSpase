import {provideRouter, Router, withInMemoryScrolling} from "@angular/router";
import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from "@angular/core";
import {appRoutes} from "./app.routes";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';
import {AuthService} from "./shared/services/auth.service";
import {MessageService} from "primeng/api";

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export function initializeApp(authService: AuthService, router: Router): () => Promise<any> {
  return () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          authService.getCurrentUser().finally(resolve);
        } catch (error) {
          const currentPath = window.location.pathname;
          console.log(currentPath)
          const isPublic =
            currentPath === '/auth' ||
            currentPath.startsWith('/auth/') ||
            currentPath === '/verify-email' ||
            currentPath === '/restore-password';
          if (!isPublic) {
            router.navigate(['']).finally(resolve);
          } else {
            resolve();
          }
        }
      }, 500)
    })
  };
}

const channel = new BroadcastChannel('auth-channel');
channel.postMessage({token: localStorage.getItem('token')});

channel.onmessage = (event) => {
  if (event.data.token) {
    localStorage.setItem('token', event.data.token);
  }
};

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
    provideEnvironmentNgxMask(maskConfig),
    MessageService
  ]
};

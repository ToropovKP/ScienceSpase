import {provideRouter, Router, withInMemoryScrolling} from "@angular/router";
import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from "@angular/core";
import {provideClientHydration, withEventReplay} from "@angular/platform-browser";
import {appRoutes} from "./app.routes";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';
import {AuthService} from "./system/shared/services/auth.service";

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export function initializeApp(authService: AuthService, router: Router): () => Promise<any> {
  return async () => {
    try {
      await authService.getCurrentUser();
    } catch (error) {
      const currentPath = window.location.pathname;
      console.log(currentPath)
      const publicPaths = ['/verify-email', '/restore-password'];
      if (!publicPaths.includes(currentPath)) {
        await router.navigate(['']);
      }
    }
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
          darkModeSelector: 'system',
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
    provideClientHydration(withEventReplay())
  ]
};

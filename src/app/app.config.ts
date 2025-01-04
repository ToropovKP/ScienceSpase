import {provideRouter, withInMemoryScrolling} from "@angular/router";
import {ApplicationConfig, provideZoneChangeDetection} from "@angular/core";
import {provideClientHydration, withEventReplay} from "@angular/platform-browser";
import {appRoutes} from "./app.routes";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import {providePrimeNG} from "primeng/config";
import Aura from '@primeng/themes/aura';

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export const appConfig: ApplicationConfig = {
  providers: [
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

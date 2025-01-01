import {provideRouter, withInMemoryScrolling} from "@angular/router";
import {ApplicationConfig, provideZoneChangeDetection} from "@angular/core";
import {provideClientHydration, withEventReplay} from "@angular/platform-browser";
import {appRoutes} from "./app.routes";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export const appConfig: ApplicationConfig = {
  providers: [
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

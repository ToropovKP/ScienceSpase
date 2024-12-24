import {ApplicationConfig} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from "@angular/router";
import {appRoutes} from "./app.routes";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideClientHydration, withEventReplay, withHttpTransferCacheOptions} from "@angular/platform-browser";

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes,
        withInMemoryScrolling({
          scrollPositionRestoration: 'enabled',
          anchorScrolling: 'enabled',
          // scrollOffset: [0, 64],
        })),
    provideHttpClient(withInterceptorsFromDi()),
    provideEnvironmentNgxMask(maskConfig), provideClientHydration(withEventReplay()),
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }))
  ],
};

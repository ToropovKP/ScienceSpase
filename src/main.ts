import {bootstrapApplication} from '@angular/platform-browser';
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {NgxMaskConfig, provideEnvironmentNgxMask} from "ngx-mask";
import {provideRouter, withInMemoryScrolling} from "@angular/router";
import {enableProdMode} from "@angular/core";
import {environment} from "./environments/environment";
import {AppComponent} from "./app/app.component";
import {appRoutes} from "./app/app.routes";


//   imports: [BrowserModule,
//     ReactiveFormsModule.withConfig({callSetDisabledState: 'whenDisabledForLegacyCode'}),
//     NgbModule,

if (environment.production) {
  enableProdMode();
}

const maskConfig: Partial<NgxMaskConfig> = {
  validation: false,
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes,
        withInMemoryScrolling({
          scrollPositionRestoration: 'enabled',
          anchorScrolling: 'enabled',
          // scrollOffset: [0, 64],
        })),
    provideHttpClient(withInterceptorsFromDi()),
    provideEnvironmentNgxMask(maskConfig)
  ],

}).catch((err) => console.error(err));

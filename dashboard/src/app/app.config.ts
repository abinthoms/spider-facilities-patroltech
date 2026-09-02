import {ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptors} from "@angular/common/http";
import localeEnGb from '@angular/common/locales/en-GB';
import {DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData} from "@angular/common";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {icons, LucideAngularModule} from "lucide-angular";
import {environment} from "../environments/environment";
import {jwtInterceptor} from "../services/auth/infrastructure/jwt.interceptor";
import {ApiServicesInterface} from "../services/shared/domain/ApiServiceInterface";
import {ApiService} from "../services/shared/infrastructure/ApiService";

registerLocaleData(localeEnGb, 'en-GB');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    { provide: LOCALE_ID, useValue: 'en-GB' },
    provideAnimationsAsync(),
    importProvidersFrom(LucideAngularModule.pick(icons)),
    { provide: 'googleTagManagerId', useValue: environment.googleTagManagerId },
    { provide: 'MAT_DATE_LOCALE', useValue: 'en-GB' },
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { dateFormat: 'dd/MM/yy HH:mm' }
    },
  ],
};

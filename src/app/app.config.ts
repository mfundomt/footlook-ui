import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AnalyticsService } from './core/services/analytics.service';
import { mountCookieBanner } from './shared/components/cookie-banner/cookie-banner';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Starts analytics wiring; it stays inert unless a Measurement ID is set and the visitor accepts cookies.
    provideAppInitializer(() => {
      inject(AnalyticsService);
      mountCookieBanner();
    }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
};

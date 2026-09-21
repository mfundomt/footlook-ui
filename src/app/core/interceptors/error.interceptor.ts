import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isCentralApiUrl } from './auth.interceptor';

/**
 * When the central service answers 401 to a signed-in call the session is no longer valid (expired or revoked):
 * forget it and send the person to sign in again, coming back to the page they were on.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isCentralApiUrl(request.url) &&
        !request.url.endsWith('/auth/microsoft')
      ) {
        void auth.sessionRejected(router.url);
      }
      return throwError(() => error);
    }),
  );
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CENTRAL_API_URL } from '../config/auth.config';
import { AuthService } from '../services/auth.service';

/** True only for URLs on the central service's origin (a relative URL resolves to this site, so it is never central). */
export function isCentralApiUrl(url: string): boolean {
  try {
    return new URL(url, window.location.href).origin === new URL(CENTRAL_API_URL).origin;
  } catch {
    return false;
  }
}

/** Adds the central session token to calls to the central service, and to nothing else. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // The sign-in call is anonymous: it must not carry a stale token.
  if (!isCentralApiUrl(request.url) || request.url.endsWith('/auth/microsoft')) return next(request);
  const token = inject(AuthService).bearerToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};

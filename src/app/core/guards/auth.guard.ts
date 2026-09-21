import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LOGIN_ROUTE } from '../config/auth.config';
import { AuthService } from '../services/auth.service';

/** Lets signed-in visitors through; anyone else goes to the sign-in page and comes back to the page they asked for. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).ensureSession()) return true;
  return inject(Router).createUrlTree([LOGIN_ROUTE], { queryParams: { next: state.url } });
};

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AUTH_API_URL,
  DASHBOARD_URL_FOR_HANDOFF,
  MSAL_AUTHORITY,
  MSAL_CLIENT_ID,
  MSAL_REDIRECT_PATH,
  MSAL_SCOPES,
} from '../config/auth.config';

export type AuthMode = 'login' | 'register';

export type AuthFailureCode =
  | 'not_configured'
  | 'cancelled'
  | 'popup_blocked'
  | 'interaction_in_progress'
  | 'account_not_found'
  | 'terms_not_accepted'
  | 'registration_closed'
  | 'network'
  | 'unknown';

/** A sign-in problem, already worded for the person reading it. */
export interface AuthFailure {
  code: AuthFailureCode;
  message: string;
}

/** Response of POST {AUTH_API_URL}/auth/microsoft. */
export interface AuthSession {
  token: string;
  expiresAtUtc: string;
  isAdmin: boolean;
  user: { id: string; email: string; displayName: string };
}

/** The part of MSAL's PublicClientApplication this service uses. */
export interface MsalClient {
  initialize(): Promise<void>;
  loginPopup(request: { scopes: string[]; prompt?: string }): Promise<{ idToken: string }>;
}

export const MSAL_CLIENT_ID_TOKEN = new InjectionToken<string>('MSAL_CLIENT_ID', {
  providedIn: 'root',
  factory: () => MSAL_CLIENT_ID,
});

/** Creates the MSAL client. MSAL is loaded on first use so it stays out of the main bundle. */
export const MSAL_CLIENT_FACTORY = new InjectionToken<(clientId: string) => Promise<MsalClient>>('MSAL_CLIENT_FACTORY', {
  providedIn: 'root',
  factory: () => async (clientId) => {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    return new PublicClientApplication({
      auth: {
        clientId,
        authority: MSAL_AUTHORITY,
        redirectUri: `${window.location.origin}${MSAL_REDIRECT_PATH}`,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
  },
});

/** Sends the browser to the dashboard. Replaced in tests. */
export const DASHBOARD_HANDOFF = new InjectionToken<(url: string) => void>('DASHBOARD_HANDOFF', {
  providedIn: 'root',
  factory: () => (url) => window.location.assign(url),
});

const MESSAGES: Record<AuthFailureCode, string> = {
  not_configured: "Sign-in isn't configured yet. Please try again later.",
  cancelled: "Sign-in was cancelled. You can try again when you're ready.",
  popup_blocked: 'Your browser blocked the Microsoft sign-in window. Allow pop-ups for this site and try again.',
  interaction_in_progress: 'A Microsoft sign-in window is already open. Finish there, or close it and try again.',
  account_not_found: 'No FootLook account for that Microsoft account yet.',
  terms_not_accepted: 'Please accept the Terms of Use and Privacy Policy to create your account.',
  registration_closed: 'Registration is closed at the moment. Please check back later.',
  network: "We couldn't reach FootLook. Check your connection and try again.",
  unknown: 'Something went wrong while signing you in. Please try again.',
};

export function authFailure(code: AuthFailureCode): AuthFailure {
  return { code, message: MESSAGES[code] };
}

/** Turns an MSAL error or a backend HTTP error into a friendly failure. */
export function mapAuthError(error: unknown): AuthFailure {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: unknown } | null;
    const apiCode = typeof body === 'object' && body !== null ? body.error : undefined;
    if (error.status === 0) return authFailure('network');
    if (error.status === 404 && apiCode === 'account_not_found') return authFailure('account_not_found');
    if (error.status === 400 && apiCode === 'terms_not_accepted') return authFailure('terms_not_accepted');
    if (error.status === 403 && apiCode === 'registration_closed') return authFailure('registration_closed');
    return authFailure('unknown');
  }
  // MSAL errors carry a string errorCode; matching on it avoids importing MSAL here.
  const msalCode = (error as { errorCode?: unknown } | null)?.errorCode;
  switch (msalCode) {
    case 'user_cancelled':
      return authFailure('cancelled');
    case 'popup_window_error':
    case 'empty_window_error':
      return authFailure('popup_blocked');
    case 'interaction_in_progress':
      return authFailure('interaction_in_progress');
    default:
      return authFailure('unknown');
  }
}

function isSession(value: unknown): value is AuthSession {
  const session = value as Partial<AuthSession> | null;
  return !!session && typeof session.token === 'string' && !!session.token && typeof session.expiresAtUtc === 'string';
}

/**
 * Signs a developer in with a Microsoft account (work or personal) and hands the resulting
 * FootLook session to the dashboard. This site keeps no session of its own: the token goes to
 * the dashboard in the URL fragment (never sent to a server) and is not stored or logged here.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly clientId = inject(MSAL_CLIENT_ID_TOKEN).trim();
  private readonly createClient = inject(MSAL_CLIENT_FACTORY);
  private readonly handOff = inject(DASHBOARD_HANDOFF);

  private client: Promise<MsalClient> | null = null;

  /** False until MSAL_CLIENT_ID is filled in. */
  readonly configured = this.clientId.length > 0;

  readonly isAuthenticated = signal(false);

  signOut(): void {
    this.isAuthenticated.set(false);
  }

  /** Opens the Microsoft window, then signs in or registers. Resolves to null on success, otherwise the failure to show. */
  async signInWithMicrosoft(mode: AuthMode, acceptedTerms: boolean): Promise<AuthFailure | null> {
    if (!this.configured) return authFailure('not_configured');
    if (mode === 'register' && !acceptedTerms) return authFailure('terms_not_accepted');

    try {
      const msal = await this.getClient();
      const { idToken } = await msal.loginPopup({ scopes: MSAL_SCOPES, prompt: 'select_account' });
      const session = await firstValueFrom(
        this.http.post<AuthSession>(`${AUTH_API_URL}/auth/microsoft`, { idToken, mode, acceptedTerms }),
      );
      if (!isSession(session)) return authFailure('unknown');
      this.handOff(`${DASHBOARD_URL_FOR_HANDOFF}#token=${encodeURIComponent(session.token)}&expires=${encodeURIComponent(session.expiresAtUtc)}`);
      return null;
    } catch (error) {
      return mapAuthError(error);
    }
  }

  private getClient(): Promise<MsalClient> {
    this.client ??= this.createClient(this.clientId).then(async (client) => {
      await client.initialize();
      return client;
    });
    // A failed start must not be cached, or the next click would fail the same way.
    this.client.catch(() => (this.client = null));
    return this.client;
  }
}

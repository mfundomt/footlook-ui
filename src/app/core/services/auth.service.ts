import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  CENTRAL_API_URL,
  LOGIN_ROUTE,
  MSAL_AUTHORITY,
  MSAL_CLIENT_ID,
  MSAL_REDIRECT_PATH,
  MSAL_SCOPES,
  PROJECTS_ROUTE,
} from '../config/auth.config';
import { safeInternalPath } from '../util/safe-redirect';
import { parseUtc } from '../util/dates';

export type AuthMode = 'login' | 'register';

export type AuthFailureCode =
  | 'not_configured'
  | 'cancelled'
  | 'popup_blocked'
  | 'interaction_in_progress'
  | 'account_not_found'
  | 'terms_not_accepted'
  | 'registration_closed'
  | 'invalid_token'
  | 'unavailable'
  | 'too_many_requests'
  | 'network'
  | 'unknown';

/** A sign-in problem, already worded for the person reading it. */
export interface AuthFailure {
  code: AuthFailureCode;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

/** Response of POST {CENTRAL_API_URL}/auth/microsoft; `token` is the central session token. */
export interface AuthSession {
  token: string;
  expiresAtUtc: string;
  isAdmin: boolean;
  user: AuthUser;
}

/** The only key this site writes for the sign-in, and only ever to sessionStorage (never localStorage). */
export const SESSION_STORAGE_KEY = 'footlook.session';

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

const MESSAGES: Record<AuthFailureCode, string> = {
  not_configured: "Sign-in isn't configured yet. Please try again later.",
  cancelled: "Sign-in was cancelled. You can try again when you're ready.",
  popup_blocked: 'Your browser blocked the Microsoft sign-in window. Allow pop-ups for this site and try again.',
  interaction_in_progress: 'A Microsoft sign-in window is already open. Finish there, or close it and try again.',
  account_not_found: 'No FootLook account for that Microsoft account yet.',
  terms_not_accepted: 'Please accept the Terms of Use and Privacy Policy to create your account.',
  registration_closed: 'Registration is closed at the moment. Please check back later.',
  invalid_token: "We couldn't verify your Microsoft sign-in. Please try again.",
  unavailable: 'FootLook sign-in is temporarily unavailable. Please try again in a few minutes.',
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
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
    if (error.status === 401 && apiCode === 'invalid_token') return authFailure('invalid_token');
    if (error.status === 429) return authFailure('too_many_requests');
    if (error.status === 503) return authFailure('unavailable');
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
  const user = session?.user as Partial<AuthUser> | undefined;
  return (
    !!session &&
    typeof session.token === 'string' &&
    !!session.token &&
    typeof session.expiresAtUtc === 'string' &&
    Number.isFinite(parseUtc(session.expiresAtUtc)) &&
    !!user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.displayName === 'string'
  );
}

function isExpired(session: AuthSession): boolean {
  return parseUtc(session.expiresAtUtc) <= Date.now();
}

/**
 * Signs a developer in with a Microsoft account (work or personal) and keeps the FootLook central session.
 *
 * The central session token lives in sessionStorage only (gone when the tab closes), is never put in a URL,
 * never logged, and is sent only to the central service (see authInterceptor). Nothing goes to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly clientId = inject(MSAL_CLIENT_ID_TOKEN).trim();
  private readonly createClient = inject(MSAL_CLIENT_FACTORY);

  private client: Promise<MsalClient> | null = null;
  private readonly session = signal<AuthSession | null>(this.restore());

  /** False until MSAL_CLIENT_ID is filled in. */
  readonly configured = this.clientId.length > 0;

  /** The signed-in person, or null. */
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAdmin = computed(() => this.session()?.isAdmin ?? false);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /**
   * True when there is a session that has not expired. Drops an expired session (and clears storage) as a side effect,
   * so route guards and pages call this rather than reading the signal.
   */
  ensureSession(): boolean {
    const current = this.session();
    if (!current) return false;
    if (isExpired(current)) {
      this.signOut();
      return false;
    }
    return true;
  }

  /** The central session token for the HTTP interceptor, or null when signed out or expired. Never display or log it. */
  bearerToken(): string | null {
    return this.ensureSession() ? (this.session()?.token ?? null) : null;
  }

  signOut(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage can be blocked; the in-memory session is already gone.
    }
  }

  /**
   * Opens the Microsoft window, then signs in or registers. On success the central session is stored and the browser goes to
   * `next` (only an internal path is honoured) or the projects page. Resolves to null on success, otherwise the failure to show.
   */
  async signInWithMicrosoft(mode: AuthMode, acceptedTerms: boolean, next?: string | null): Promise<AuthFailure | null> {
    if (!this.configured) return authFailure('not_configured');
    if (mode === 'register' && !acceptedTerms) return authFailure('terms_not_accepted');

    try {
      const msal = await this.getClient();
      const { idToken } = await msal.loginPopup({ scopes: MSAL_SCOPES, prompt: 'select_account' });
      const session = await firstValueFrom(
        this.http.post<AuthSession>(`${CENTRAL_API_URL}/auth/microsoft`, { idToken, mode, acceptedTerms }),
      );
      if (!isSession(session)) return authFailure('unknown');
      this.store(session);
      await this.goAfterSignIn(next);
      return null;
    } catch (error) {
      return mapAuthError(error);
    }
  }

  /** Opens the validated `next` path, else the projects page. */
  async goAfterSignIn(next?: string | null): Promise<void> {
    await this.router.navigateByUrl(this.destination(next), { replaceUrl: true });
  }

  /** The path to open after sign-in for a `next` query value: an internal path (never the login pages) or the projects page. */
  destination(next?: string | null): string {
    const safe = safeInternalPath(next);
    if (!safe || /^\/(login|register)(?:[/?#]|$)/i.test(safe)) return PROJECTS_ROUTE;
    return safe;
  }

  /** Called when the central service rejects the session token: forget it and ask for a fresh sign-in, coming back here after. */
  async sessionRejected(returnTo: string): Promise<void> {
    this.signOut();
    await this.router.navigate([LOGIN_ROUTE], { queryParams: { next: returnTo } });
  }

  private store(session: AuthSession): void {
    const kept: AuthSession = { token: session.token, expiresAtUtc: session.expiresAtUtc, isAdmin: !!session.isAdmin, user: session.user };
    this.session.set(kept);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(kept));
    } catch {
      // Storage blocked: the session still works until the page is reloaded.
    }
  }

  private restore(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (isSession(parsed) && !isExpired(parsed)) return parsed;
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Unreadable or blocked storage counts as signed out; drop whatever unreadable value is there.
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Storage is blocked altogether.
      }
    }
    return null;
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

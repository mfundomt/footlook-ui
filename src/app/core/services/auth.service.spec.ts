import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CENTRAL_API_URL } from '../config/auth.config';
import { AuthService, MSAL_CLIENT_FACTORY, MSAL_CLIENT_ID_TOKEN, MsalClient, SESSION_STORAGE_KEY, mapAuthError } from './auth.service';

const API = `${CENTRAL_API_URL}/auth/microsoft`;
const httpError = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });
const BACKSLASH = String.fromCharCode(92);

const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();
const anHourAgo = () => new Date(Date.now() - 3_600_000).toISOString();
const sessionBody = (overrides: Record<string, unknown> = {}) => ({
  token: 'central.session.token',
  expiresAtUtc: inOneHour(),
  isAdmin: false,
  user: { id: '11111111-1111-1111-1111-111111111111', email: 'dev@example.com', displayName: 'Dev Eloper' },
  ...overrides,
});

function setup(clientId = 'test-client-id', loginPopup: MsalClient['loginPopup'] = async () => ({ idToken: 'id-token' })) {
  const msal: MsalClient = { initialize: vi.fn(async () => undefined), loginPopup: vi.fn(loginPopup) };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MSAL_CLIENT_ID_TOKEN, useValue: clientId },
      { provide: MSAL_CLIENT_FACTORY, useValue: async () => msal },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController), msal, navigate, router };
}

async function signIn(ctx: ReturnType<typeof setup>, next?: string | null, body: unknown = sessionBody()) {
  const result = ctx.auth.signInWithMicrosoft('login', false, next);
  (await vi.waitFor(() => ctx.http.expectOne(API))).flush(body as object);
  return result;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('mapAuthError', () => {
  it('maps the backend error shapes', () => {
    expect(mapAuthError(httpError(404, { error: 'account_not_found' })).code).toBe('account_not_found');
    expect(mapAuthError(httpError(400, { error: 'terms_not_accepted' })).code).toBe('terms_not_accepted');
    expect(mapAuthError(httpError(403, { error: 'registration_closed' })).code).toBe('registration_closed');
    expect(mapAuthError(httpError(401, { error: 'invalid_token' })).code).toBe('invalid_token');
    expect(mapAuthError(httpError(503, { error: 'accounts_unavailable' })).code).toBe('unavailable');
    expect(mapAuthError(httpError(503, { error: 'token_validation_unavailable' })).code).toBe('unavailable');
    expect(mapAuthError(httpError(429, null)).code).toBe('too_many_requests');
  });

  it('treats an unreachable backend as a network problem', () => {
    expect(mapAuthError(httpError(0, null)).code).toBe('network');
  });

  it('falls back to a generic message for anything else', () => {
    expect(mapAuthError(httpError(500, { error: 'boom' })).code).toBe('unknown');
    expect(mapAuthError(httpError(404, 'not json')).code).toBe('unknown');
    expect(mapAuthError(httpError(404, { error: 'something_else' })).code).toBe('unknown');
    expect(mapAuthError(new Error('nope')).code).toBe('unknown');
    expect(mapAuthError(null).code).toBe('unknown');
  });

  it('maps MSAL popup errors', () => {
    expect(mapAuthError({ errorCode: 'user_cancelled' }).code).toBe('cancelled');
    expect(mapAuthError({ errorCode: 'popup_window_error' }).code).toBe('popup_blocked');
    expect(mapAuthError({ errorCode: 'empty_window_error' }).code).toBe('popup_blocked');
    expect(mapAuthError({ errorCode: 'interaction_in_progress' }).code).toBe('interaction_in_progress');
  });
});

describe('AuthService sign-in', () => {
  it('reports it is not configured, and never opens a popup, while the client ID is empty', async () => {
    const { auth, msal } = setup('');
    expect(auth.configured).toBe(false);
    expect((await auth.signInWithMicrosoft('login', false))?.code).toBe('not_configured');
    expect(msal.loginPopup).not.toHaveBeenCalled();
  });

  it('refuses to register without accepted terms, before any popup or request', async () => {
    const { auth, http, msal } = setup();
    expect((await auth.signInWithMicrosoft('register', false))?.code).toBe('terms_not_accepted');
    expect(msal.loginPopup).not.toHaveBeenCalled();
    http.expectNone(API);
  });

  it('posts the ID token to the central service with the unchanged request contract', async () => {
    const ctx = setup();
    const result = ctx.auth.signInWithMicrosoft('register', true);
    const request = await vi.waitFor(() => ctx.http.expectOne(API));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ idToken: 'id-token', mode: 'register', acceptedTerms: true });
    request.flush(sessionBody());

    expect(await result).toBeNull();
    expect(ctx.msal.initialize).toHaveBeenCalledOnce();
    expect(ctx.msal.loginPopup).toHaveBeenCalledWith({ scopes: ['openid', 'profile', 'email'], prompt: 'select_account' });
  });

  it('keeps the session token in sessionStorage only, and exposes the user', async () => {
    const ctx = setup();
    expect(ctx.auth.isAuthenticated()).toBe(false);
    expect(await signIn(ctx)).toBeNull();

    expect(ctx.auth.isAuthenticated()).toBe(true);
    expect(ctx.auth.user()).toEqual({ id: '11111111-1111-1111-1111-111111111111', email: 'dev@example.com', displayName: 'Dev Eloper' });
    expect(ctx.auth.bearerToken()).toBe('central.session.token');
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '{}').token).toBe('central.session.token');
    expect(localStorage.length).toBe(0);
  });

  it('never puts the token in a URL: it navigates to a plain path', async () => {
    const ctx = setup();
    await signIn(ctx);
    expect(ctx.navigate).toHaveBeenCalledOnce();
    const [url] = ctx.navigate.mock.calls[0];
    expect(url).toBe('/projects');
    expect(String(url)).not.toContain('token');
  });

  it('goes to a valid internal ?next= after sign-in', async () => {
    const ctx = setup();
    const next = '/connect?project=prj_abc&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html';
    await signIn(ctx, next);
    expect(ctx.navigate).toHaveBeenCalledWith(next, { replaceUrl: true });
  });

  it('shows the account_not_found failure on login, stores nothing and does not navigate', async () => {
    const ctx = setup();
    const result = ctx.auth.signInWithMicrosoft('login', false);
    (await vi.waitFor(() => ctx.http.expectOne(API))).flush({ error: 'account_not_found' }, { status: 404, statusText: 'Not Found' });
    expect((await result)?.code).toBe('account_not_found');
    expect(ctx.navigate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(ctx.auth.isAuthenticated()).toBe(false);
  });

  it('rejects a 200 response that has no token or user, and stores nothing', async () => {
    for (const body of [{}, sessionBody({ token: '' }), sessionBody({ user: null }), sessionBody({ expiresAtUtc: 'never' })]) {
      const ctx = setup();
      expect((await signIn(ctx, null, body))?.code).toBe('unknown');
      expect(ctx.navigate).not.toHaveBeenCalled();
      expect(sessionStorage.length).toBe(0);
    }
  });

  it('turns a blocked popup into a friendly failure without calling the backend', async () => {
    const { auth, http } = setup('test-client-id', async () => {
      throw { errorCode: 'popup_window_error' };
    });
    expect((await auth.signInWithMicrosoft('login', false))?.code).toBe('popup_blocked');
    http.expectNone(API);
  });

  it('does not log the token or the ID token', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    const ctx = setup();
    await signIn(ctx);
    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain('central.session.token');
      expect(JSON.stringify(spy.mock.calls)).not.toContain('id-token');
      spy.mockRestore();
    }
  });
});

describe('AuthService session', () => {
  it('restores a valid session from sessionStorage on load', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody()));
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.ensureSession()).toBe(true);
    expect(auth.user()?.email).toBe('dev@example.com');
  });

  it('drops an expired stored session on load and clears the storage', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody({ expiresAtUtc: anHourAgo() })));
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('ignores corrupt stored data', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '{not json');
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('never restores a session from localStorage', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody()));
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('treats a timestamp without a zone marker as UTC', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString().replace('Z', '');
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody({ expiresAtUtc: future })));
    expect(setup().auth.isAuthenticated()).toBe(true);
  });

  it('drops a session that expires while the tab is open', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody()));
      const { auth } = setup();
      expect(auth.ensureSession()).toBe(true);
      vi.setSystemTime(Date.now() + 2 * 3_600_000);
      expect(auth.bearerToken()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('signOut() clears the signals and the storage, and is safe to call when signed out', async () => {
    const ctx = setup();
    ctx.auth.signOut();
    expect(ctx.auth.isAuthenticated()).toBe(false);
    await signIn(ctx);
    ctx.auth.signOut();
    expect(ctx.auth.isAuthenticated()).toBe(false);
    expect(ctx.auth.user()).toBeNull();
    expect(ctx.auth.bearerToken()).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('sessionRejected() forgets the session and returns to the sign-in page with the page to come back to', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody()));
    const { auth, router } = setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await auth.sessionRejected('/projects/prj_abc');
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { next: '/projects/prj_abc' } });
  });
});

describe('AuthService destination (?next= validation)', () => {
  const dest = (next: string | null | undefined) => setup().auth.destination(next);

  it('accepts internal paths, with their query', () => {
    expect(dest('/projects')).toBe('/projects');
    expect(dest('/projects/prj_abc')).toBe('/projects/prj_abc');
    expect(dest('/join?code=FL-ABC')).toBe('/join?code=FL-ABC');
    expect(dest('/connect?project=prj_a&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html')).toBe(
      '/connect?project=prj_a&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html',
    );
  });

  it('falls back to /projects when there is no next', () => {
    expect(dest(null)).toBe('/projects');
    expect(dest(undefined)).toBe('/projects');
    expect(dest('')).toBe('/projects');
  });

  it('rejects anything that could leave the site', () => {
    const bad = [
      '//evil.example',
      '//evil.example/path',
      'https://evil.example',
      'http://evil.example/',
      'javascript:alert(1)',
      'evil.example',
      'projects',
      `/${BACKSLASH}evil.example`,
      `/${BACKSLASH}/evil.example`,
      `/projects${BACKSLASH}..${BACKSLASH}evil`,
      '/%2Fevil.example',
      '/%2F%2Fevil.example',
      '/%5Cevil.example',
      '/%252Fevil.example',
      '/%255Cevil.example',
      '/%09/evil.example',
      '/%0A/evil.example',
      '/\t/evil.example',
      '/\n/evil.example',
      '/ /evil.example',
      '/%E0%A4%A',
    ];
    for (const value of bad) expect(dest(value), value).toBe('/projects');
  });

  it('never loops back to the login or register pages', () => {
    expect(dest('/login')).toBe('/projects');
    expect(dest('/login?next=/join')).toBe('/projects');
    expect(dest('/register')).toBe('/projects');
  });
});

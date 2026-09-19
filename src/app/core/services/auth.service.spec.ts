import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_API_URL, DASHBOARD_URL_FOR_HANDOFF } from '../config/auth.config';
import { AuthService, DASHBOARD_HANDOFF, MSAL_CLIENT_FACTORY, MSAL_CLIENT_ID_TOKEN, MsalClient, mapAuthError } from './auth.service';

const API = `${AUTH_API_URL}/auth/microsoft`;
const httpError = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

function setup(clientId = 'test-client-id', loginPopup: MsalClient['loginPopup'] = async () => ({ idToken: 'id-token' })) {
  const msal: MsalClient = { initialize: vi.fn(async () => undefined), loginPopup: vi.fn(loginPopup) };
  const handOff = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MSAL_CLIENT_ID_TOKEN, useValue: clientId },
      { provide: MSAL_CLIENT_FACTORY, useValue: async () => msal },
      { provide: DASHBOARD_HANDOFF, useValue: handOff },
    ],
  });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController), msal, handOff };
}

describe('mapAuthError', () => {
  it('maps the backend error shapes', () => {
    expect(mapAuthError(httpError(404, { error: 'account_not_found' })).code).toBe('account_not_found');
    expect(mapAuthError(httpError(400, { error: 'terms_not_accepted' })).code).toBe('terms_not_accepted');
    expect(mapAuthError(httpError(403, { error: 'registration_closed' })).code).toBe('registration_closed');
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

describe('AuthService', () => {
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

  it('posts the ID token to the backend and hands the session to the dashboard in the URL fragment', async () => {
    const { auth, http, msal, handOff } = setup();
    const result = auth.signInWithMicrosoft('register', true);
    const request = await vi.waitFor(() => http.expectOne(API));
    expect(request.request.body).toEqual({ idToken: 'id-token', mode: 'register', acceptedTerms: true });
    request.flush({ token: 'a b+c', expiresAtUtc: '2026-09-20T10:00:00Z', isAdmin: false, user: { id: '1', email: 'a@b.c', displayName: 'A' } });

    expect(await result).toBeNull();
    expect(msal.initialize).toHaveBeenCalledOnce();
    expect(msal.loginPopup).toHaveBeenCalledWith({ scopes: ['openid', 'profile', 'email'], prompt: 'select_account' });
    expect(handOff).toHaveBeenCalledWith(`${DASHBOARD_URL_FOR_HANDOFF}#token=a%20b%2Bc&expires=2026-09-20T10%3A00%3A00Z`);
  });

  it('shows the account_not_found failure on login and does not leave the page', async () => {
    const { auth, http, handOff } = setup();
    const result = auth.signInWithMicrosoft('login', false);
    (await vi.waitFor(() => http.expectOne(API))).flush({ error: 'account_not_found' }, { status: 404, statusText: 'Not Found' });
    expect((await result)?.code).toBe('account_not_found');
    expect(handOff).not.toHaveBeenCalled();
  });

  it('rejects a 200 response that has no token', async () => {
    const { auth, http, handOff } = setup();
    const result = auth.signInWithMicrosoft('login', false);
    (await vi.waitFor(() => http.expectOne(API))).flush({});
    expect((await result)?.code).toBe('unknown');
    expect(handOff).not.toHaveBeenCalled();
  });

  it('turns a blocked popup into a friendly failure without calling the backend', async () => {
    const { auth, http } = setup('test-client-id', async () => {
      throw { errorCode: 'popup_window_error' };
    });
    expect((await auth.signInWithMicrosoft('login', false))?.code).toBe('popup_blocked');
    http.expectNone(API);
  });

  it('keeps isAuthenticated false and signOut() safe to call', () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    auth.signOut();
    expect(auth.isAuthenticated()).toBe(false);
  });
});

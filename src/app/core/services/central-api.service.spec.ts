import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CENTRAL_API_URL } from '../config/auth.config';
import { authInterceptor, isCentralApiUrl } from '../interceptors/auth.interceptor';
import { errorInterceptor } from '../interceptors/error.interceptor';
import { AuthService, SESSION_STORAGE_KEY } from './auth.service';
import { CentralApiError, CentralApiService, mapApiError } from './central-api.service';

const httpError = (status: number, body: unknown = null) => new HttpErrorResponse({ status, error: body });
const TOKEN = 'central.session.token';

function setup(signedIn = true) {
  sessionStorage.clear();
  if (signedIn) {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: TOKEN,
        expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
        isAdmin: false,
        user: { id: 'u1', email: 'dev@example.com', displayName: 'Dev' },
      }),
    );
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])), provideHttpClientTesting()],
  });
  return {
    api: TestBed.inject(CentralApiService),
    http: TestBed.inject(HttpTestingController),
    raw: TestBed.inject(HttpClient),
    auth: TestBed.inject(AuthService),
    router: TestBed.inject(Router),
  };
}

describe('bearer token', () => {
  it('is added to calls to the central API', () => {
    const { api, http } = setup();
    void api.listProjects();
    const req = http.expectOne(`${CENTRAL_API_URL}/projects`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${TOKEN}`);
    req.flush([]);
  });

  it('is never added to another origin, however it is written', () => {
    const { raw, http } = setup();
    for (const url of [
      'https://evil.example/projects',
      `https://evil.example/?u=${CENTRAL_API_URL}`,
      `${CENTRAL_API_URL}.evil.example/projects`,
      `${CENTRAL_API_URL.replace(/^https?:\/\//, 'http://user@')}.evil.example/x`,
      '/api/anything',
      'assets/logo.png',
      'https://footlook-dashboard.azurewebsites.net/footlook/auth/exchange',
    ]) {
      raw.get(url).subscribe({ error: () => undefined });
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization'), url).toBe(false);
      req.flush({});
    }
  });

  it('is not added to the anonymous sign-in call', () => {
    const { raw, http } = setup();
    raw.post(`${CENTRAL_API_URL}/auth/microsoft`, {}).subscribe({ error: () => undefined });
    const req = http.expectOne(`${CENTRAL_API_URL}/auth/microsoft`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('is not sent when signed out', () => {
    const { api, http } = setup(false);
    void api.listProjects();
    const req = http.expectOne(`${CENTRAL_API_URL}/projects`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('recognises only the central origin', () => {
    expect(isCentralApiUrl(`${CENTRAL_API_URL}/projects`)).toBe(true);
    expect(isCentralApiUrl('https://evil.example/projects')).toBe(false);
    expect(isCentralApiUrl('not a url at all')).toBe(false);
  });

  it('a 401 from the central API ends the session and sends the person to sign in again', async () => {
    const { api, http, auth, router } = setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const call = api.listProjects();
    http.expectOne(`${CENTRAL_API_URL}/projects`).flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    await expect(call).rejects.toMatchObject({ code: 'unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate.mock.calls[0][0]).toEqual(['/login']);
  });
});

describe('CentralApiService requests', () => {
  const cases: {
    name: string;
    call: (api: CentralApiService) => Promise<unknown>;
    method: string;
    path: string;
    body?: unknown;
    reply?: unknown;
  }[] = [
    { name: 'listProjects', call: (a) => a.listProjects(), method: 'GET', path: '/projects', reply: [] },
    {
      name: 'createProject',
      call: (a) => a.createProject({ name: 'Shop', allowedReturnUrls: ['https://a.example/x'] }),
      method: 'POST',
      path: '/projects',
      body: { name: 'Shop', allowedReturnUrls: ['https://a.example/x'] },
      reply: {},
    },
    { name: 'getProject', call: (a) => a.getProject('prj_abc'), method: 'GET', path: '/projects/prj_abc', reply: {} },
    { name: 'updateProject', call: (a) => a.updateProject('prj_abc', { name: 'New' }), method: 'PATCH', path: '/projects/prj_abc', body: { name: 'New' }, reply: {} },
    { name: 'deleteProject', call: (a) => a.deleteProject('prj_abc'), method: 'DELETE', path: '/projects/prj_abc', reply: null },
    { name: 'listMembers', call: (a) => a.listMembers('prj_abc'), method: 'GET', path: '/projects/prj_abc/members', reply: [] },
    { name: 'removeMember', call: (a) => a.removeMember('prj_abc', 'user-1'), method: 'DELETE', path: '/projects/prj_abc/members/user-1', reply: null },
    {
      name: 'createInvite',
      call: (a) => a.createInvite('prj_abc', { maxUses: 3, expiresInHours: 24 }),
      method: 'POST',
      path: '/projects/prj_abc/invites',
      body: { maxUses: 3, expiresInHours: 24 },
      reply: {},
    },
    { name: 'listInvites', call: (a) => a.listInvites('prj_abc'), method: 'GET', path: '/projects/prj_abc/invites', reply: [] },
    { name: 'revokeInvite', call: (a) => a.revokeInvite('prj_abc', 7), method: 'DELETE', path: '/projects/prj_abc/invites/7', reply: null },
    { name: 'redeemInvite', call: (a) => a.redeemInvite('FL-ABC'), method: 'POST', path: '/invites/redeem', body: { code: 'FL-ABC' }, reply: {} },
    {
      name: 'connect',
      call: (a) => a.connect('prj_abc', 'https://a.example/footlook.html'),
      method: 'POST',
      path: '/projects/prj_abc/connect',
      body: { returnUrl: 'https://a.example/footlook.html' },
      reply: {},
    },
  ];

  for (const c of cases) {
    it(`${c.name} calls ${c.method} ${c.path}`, async () => {
      const { api, http } = setup();
      const result = c.call(api);
      const req = http.expectOne(`${CENTRAL_API_URL}${c.path}`);
      expect(req.request.method).toBe(c.method);
      if (c.body !== undefined) expect(req.request.body).toEqual(c.body);
      req.flush(c.reply ?? null);
      await result;
      http.verify();
    });
  }

  it('encodes ids so they cannot change the path', async () => {
    const { api, http } = setup();
    const result = api.getProject('a/../b?x=1');
    const req = http.expectOne((r) => r.url.startsWith(`${CENTRAL_API_URL}/projects/`));
    expect(req.request.url).toBe(`${CENTRAL_API_URL}/projects/a%2F..%2Fb%3Fx%3D1`);
    req.flush({});
    await result;
  });

  it('returns the typed body', async () => {
    const { api, http } = setup();
    const result = api.createInvite('prj_abc', {});
    http.expectOne(`${CENTRAL_API_URL}/projects/prj_abc/invites`).flush({ id: 5, code: 'FL-ABCDEFGHIJ', expiresAtUtc: '2026-10-01T00:00:00Z', maxUses: 1 });
    expect(await result).toEqual({ id: 5, code: 'FL-ABCDEFGHIJ', expiresAtUtc: '2026-10-01T00:00:00Z', maxUses: 1 });
  });
});

describe('error mapping', () => {
  it('maps every contract error code to its own friendly message', () => {
    const codes: [number, string][] = [
      [400, 'invalid_request'],
      [400, 'invalid_return_url'],
      [404, 'project_not_found'],
      [404, 'invalid_invite'],
      [409, 'project_limit'],
      [409, 'project_full'],
      [429, 'too_many_attempts'],
      [409, 'invite_limit'],
      [400, 'cannot_remove_owner'],
      [404, 'member_not_found'],
      [404, 'invite_not_found'],
    ];
    for (const [status, code] of codes) {
      const error = mapApiError(httpError(status, { error: code }));
      expect(error).toBeInstanceOf(CentralApiError);
      expect(error.code).toBe(code);
      expect(error.status).toBe(status);
      expect(error.message.length).toBeGreaterThan(10);
      expect(error.message).not.toContain('_');
    }
  });

  it("treats the service's own names for rate limiting, unavailability and server errors like the general cases", () => {
    expect(mapApiError(httpError(429, { error: 'rate_limited' })).code).toBe('too_many_requests');
    expect(mapApiError(httpError(503, { error: 'service_unavailable' })).code).toBe('unavailable');
    expect(mapApiError(httpError(503, { error: 'service_unavailable' })).isTransient).toBe(true);
    expect(mapApiError(httpError(500, { error: 'server_error' })).code).toBe('unknown');
  });

  it('uses the status when there is no known code', () => {
    expect(mapApiError(httpError(0)).code).toBe('network');
    expect(mapApiError(httpError(401)).code).toBe('unauthorized');
    expect(mapApiError(httpError(403)).code).toBe('forbidden');
    expect(mapApiError(httpError(404, 'text')).code).toBe('project_not_found');
    expect(mapApiError(httpError(429)).code).toBe('too_many_requests');
    expect(mapApiError(httpError(503, { error: 'accounts_unavailable' })).code).toBe('unavailable');
    expect(mapApiError(httpError(500, { error: '<script>' })).code).toBe('unknown');
    expect(mapApiError(new Error('x')).code).toBe('unknown');
  });

  it('marks unreachable and unavailable as retryable, and nothing else', () => {
    expect(mapApiError(httpError(0)).isTransient).toBe(true);
    expect(mapApiError(httpError(503)).isTransient).toBe(true);
    expect(mapApiError(httpError(404, { error: 'invalid_invite' })).isTransient).toBe(false);
  });

  it('never repeats server text or request data in the message', () => {
    const error = mapApiError(httpError(400, { error: 'invalid_request', detail: 'secret-invite-code FL-XXXX' }));
    expect(error.message).not.toContain('FL-XXXX');
  });
});

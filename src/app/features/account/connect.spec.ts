import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ConnectResult } from '../../core/models/central.model';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { CONNECT_REDIRECT, Connect } from './connect';

const RAW_RETURN = 'https://attacker.example/steal?x=1';
const ECHOED = 'https://api.example.com/footlook.html';

async function render(connect: () => Promise<ConnectResult>, query: Record<string, string> = { project: 'prj_abc', return: RAW_RETURN }) {
  const api = { connect: vi.fn(connect) };
  const redirect = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Connect],
    providers: [
      provideRouter([]),
      { provide: CentralApiService, useValue: api },
      { provide: CONNECT_REDIRECT, useValue: redirect },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
    ],
  });
  const fixture = TestBed.createComponent(Connect);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, api, redirect, text: () => el.textContent ?? '' };
}

const fail = (status: number, code: 'project_not_found' | 'invalid_return_url' | 'network' | 'unavailable' | 'unknown') => async (): Promise<ConnectResult> => {
  throw new CentralApiError(status, code);
};

describe('Connect page', () => {
  it('redirects to the address the SERVER echoed, with the pass in the fragment, never to the raw query value', async () => {
    const { api, redirect } = await render(async () => ({ pass: 'a.b+c/d=', expiresAtUtc: '2026-09-20T10:05:00Z', returnUrl: ECHOED }));
    expect(api.connect).toHaveBeenCalledExactlyOnceWith('prj_abc', RAW_RETURN);
    expect(redirect).toHaveBeenCalledExactlyOnceWith(`${ECHOED}#pass=${encodeURIComponent('a.b+c/d=')}`);
    expect(redirect.mock.calls[0][0]).toBe(`${ECHOED}#pass=a.b%2Bc%2Fd%3D`);
    expect(redirect.mock.calls[0][0]).not.toContain('attacker');
  });

  it('does not redirect when the echoed address is not a plain web address', async () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '/relative', '', 'https://ok.example/x#already']) {
      const { redirect, text } = await render(async () => ({ pass: 'p', expiresAtUtc: 'x', returnUrl: bad }));
      expect(redirect, bad).not.toHaveBeenCalled();
      expect(text()).toContain('Something went wrong');
    }
  });

  it('does not redirect when the answer carries no pass', async () => {
    const { redirect, text } = await render(async () => ({ pass: '', expiresAtUtc: 'x', returnUrl: ECHOED }));
    expect(redirect).not.toHaveBeenCalled();
    expect(text()).toContain('Something went wrong');
  });

  it('404: says the person has no access and links to /join', async () => {
    const { el, redirect, text } = await render(fail(404, 'project_not_found'));
    expect(text()).toContain("You don't have access to this project");
    expect(el.querySelector('a[href="/join"]')).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('400: explains that the return address is not allowed', async () => {
    const { text, redirect } = await render(fail(400, 'invalid_return_url'));
    expect(text()).toContain("doesn't allow sign-in from that address");
    expect(text()).not.toContain('attacker.example');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('central unreachable: shows a retry message and retries', async () => {
    const results: (() => Promise<ConnectResult>)[] = [fail(0, 'network'), async () => ({ pass: 'p', expiresAtUtc: 'x', returnUrl: ECHOED })];
    const { fixture, el, text, redirect, api } = await render(() => results.shift()!());
    expect(text()).toContain("couldn't reach FootLook");
    (el.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.connect).toHaveBeenCalledTimes(2);
    expect(redirect).toHaveBeenCalledExactlyOnceWith(`${ECHOED}#pass=p`);
  });

  it('a 503 also counts as unreachable', async () => {
    const { text } = await render(fail(503, 'unavailable'));
    expect(text()).toContain("couldn't reach FootLook");
  });

  it('an incomplete link makes no request', async () => {
    for (const query of [{} as Record<string, string>, { project: 'prj_abc' }, { return: ECHOED }, { project: '../x', return: ECHOED }]) {
      const { api, text } = await render(async () => ({ pass: 'p', expiresAtUtc: 'x', returnUrl: ECHOED }), query);
      expect(api.connect).not.toHaveBeenCalled();
      expect(text()).toContain('This link is incomplete');
    }
  });

  it('keeps errors free of the pass and the return address', async () => {
    const { text } = await render(fail(500, 'unknown'));
    expect(text()).not.toContain('attacker.example');
    expect(text()).not.toContain('#pass');
  });
});

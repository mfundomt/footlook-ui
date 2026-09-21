import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { Join } from './join';

function render(query: Record<string, string> = {}) {
  const api = { redeemInvite: vi.fn(async (_code: string) => ({ projectId: 'prj_abc', name: 'Shop', role: 'member' as const })) };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Join],
    providers: [
      provideRouter([]),
      { provide: CentralApiService, useValue: api },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Join);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector('#invite-code') as HTMLInputElement;
  const enter = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { fixture, el, input, api, navigate, enter, submit, text: () => el.textContent ?? '' };
}

describe('Join page', () => {
  it('prefills the code from ?code= without submitting it, and takes it out of the address bar', () => {
    const { input, api, navigate } = render({ code: ' FL-ABC123DEF4 ' });
    expect(input.value).toBe('FL-ABC123DEF4');
    expect(api.redeemInvite).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith([], { queryParams: { code: null }, queryParamsHandling: 'merge', replaceUrl: true });
  });

  it('labels the field', () => {
    const { el } = render();
    expect(el.querySelector('label[for="invite-code"]')?.textContent).toContain('Invite code');
  });

  it('asks for a code when the box is empty', async () => {
    const { submit, text, api } = render();
    await submit();
    expect(text()).toContain('Enter the invite code');
    expect(api.redeemInvite).not.toHaveBeenCalled();
  });

  it('redeems the code and opens the project', async () => {
    const { enter, submit, api, navigate } = render();
    enter('FL-ABC123DEF4');
    await submit();
    expect(api.redeemInvite).toHaveBeenCalledExactlyOnceWith('FL-ABC123DEF4');
    expect(navigate).toHaveBeenCalledWith(['/projects', 'prj_abc']);
  });

  it('shows the same friendly message for any invalid code, without echoing it', async () => {
    const { enter, submit, api, text, navigate } = render();
    api.redeemInvite.mockRejectedValueOnce(new CentralApiError(404, 'invalid_invite'));
    enter('FL-WRONGWRONG');
    await submit();
    expect(text()).toContain("That code isn't valid");
    expect(text()).not.toContain('FL-WRONGWRONG');
    expect(navigate).not.toHaveBeenCalledWith(['/projects', expect.anything()]);
  });

  it('explains throttling and a full project', async () => {
    for (const [status, code, expected] of [
      [429, 'too_many_attempts', 'Too many wrong codes'],
      [409, 'project_full', 'maximum number of members'],
    ] as const) {
      const { enter, submit, api, text } = render();
      api.redeemInvite.mockRejectedValueOnce(new CentralApiError(status, code));
      enter('FL-ABC123DEF4');
      await submit();
      expect(text()).toContain(expected);
    }
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService, authFailure } from '../../core/services/auth.service';
import { Login } from './login';

function render(result: ReturnType<typeof authFailure> | null, configured = true, next: string | null = null, signedIn = false) {
  const signInWithMicrosoft = vi.fn(async () => result);
  const goAfterSignIn = vi.fn(async () => undefined);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Login],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(next === null ? {} : { next }) } } },
      { provide: AuthService, useValue: { configured, signInWithMicrosoft, ensureSession: () => signedIn, goAfterSignIn } },
    ],
  });
  const fixture = TestBed.createComponent(Login);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, signInWithMicrosoft, goAfterSignIn, button: el.querySelector('button.ms-button') as HTMLButtonElement };
}

describe('Login', () => {
  it('signs in with mode "login" and does not require terms', async () => {
    const { fixture, button, signInWithMicrosoft } = render(null);
    button.click();
    await fixture.whenStable();
    expect(signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('login', false, null);
  });

  it('offers the register link when there is no account for the Microsoft account', async () => {
    const { fixture, el, button } = render(authFailure('account_not_found'));
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const error = el.querySelector('.auth-error') as HTMLElement;
    expect(error.textContent).toContain('No FootLook account for that Microsoft account yet');
    expect(error.querySelector('a')?.getAttribute('href')).toBe('/register');
  });

  it('shows a not-configured state and never signs in while there is no client ID', async () => {
    const { fixture, el, button, signInWithMicrosoft } = render(null, false);
    expect(el.textContent).toContain("isn't configured yet");
    button.click();
    await fixture.whenStable();
    expect(signInWithMicrosoft).not.toHaveBeenCalled();
  });

  it('passes a valid ?next= to the sign-in, and ignores one that leaves the site', async () => {
    const good = render(null, true, '/connect?project=prj_a&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html');
    good.button.click();
    await good.fixture.whenStable();
    expect(good.signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('login', false, '/connect?project=prj_a&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html');
    expect(good.el.textContent).toContain("Sign in to open your project's dashboard");

    for (const evil of ['https://evil.example', '//evil.example', '/' + String.fromCharCode(92) + 'evil.example']) {
      const bad = render(null, true, evil);
      bad.button.click();
      await bad.fixture.whenStable();
      expect(bad.signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('login', false, null);
    }
  });

  it('carries straight on when the visitor is already signed in', () => {
    const { goAfterSignIn } = render(null, true, '/join', true);
    expect(goAfterSignIn).toHaveBeenCalledExactlyOnceWith('/join');
  });
});

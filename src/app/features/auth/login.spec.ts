import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, authFailure } from '../../core/services/auth.service';
import { Login } from './login';

function render(result: ReturnType<typeof authFailure> | null, configured = true) {
  const signInWithMicrosoft = vi.fn(async () => result);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Login],
    providers: [provideRouter([]), { provide: AuthService, useValue: { configured, signInWithMicrosoft } }],
  });
  const fixture = TestBed.createComponent(Login);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el, signInWithMicrosoft, button: el.querySelector('button.ms-button') as HTMLButtonElement };
}

describe('Login', () => {
  it('signs in with mode "login" and does not require terms', async () => {
    const { fixture, button, signInWithMicrosoft } = render(null);
    button.click();
    await fixture.whenStable();
    expect(signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('login', false);
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
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Register } from './register';

function render(configured = true, next: string | null = null, signedIn = false) {
  const signInWithMicrosoft = vi.fn(async () => null);
  const goAfterSignIn = vi.fn(async () => undefined);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [Register],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(next === null ? {} : { next }) } } },
      { provide: AuthService, useValue: { configured, signInWithMicrosoft, ensureSession: () => signedIn, goAfterSignIn } },
    ],
  });
  const fixture = TestBed.createComponent(Register);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    el,
    signInWithMicrosoft,
    goAfterSignIn,
    button: el.querySelector('button.ms-button') as HTMLButtonElement,
    checkbox: el.querySelector('#accept-terms') as HTMLInputElement,
    message: () => el.querySelector('.auth-error')?.textContent?.trim() ?? '',
  };
}

describe('Register', () => {
  it('links the checkbox label to the terms and privacy pages', () => {
    const { el } = render();
    const label = el.querySelector('label[for="accept-terms"]') as HTMLElement;
    expect(label.textContent).toContain('I accept the Terms of Use and Privacy Policy');
    expect(Array.from(label.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual(['/terms', '/privacy']);
  });

  it('blocks the Microsoft button until the terms are ticked', async () => {
    const { fixture, button, checkbox, signInWithMicrosoft, message } = render();
    expect(checkbox.checked).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');

    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(signInWithMicrosoft).not.toHaveBeenCalled();
    expect(message()).toContain('accept the Terms of Use and Privacy Policy');

    checkbox.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-disabled')).toBe('false');
    expect(message()).toBe('');

    button.click();
    await fixture.whenStable();
    expect(signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('register', true, null);
  });

  it('blocks the button again when the terms are unticked', () => {
    const { fixture, button, checkbox } = render();
    checkbox.click();
    fixture.detectChanges();
    checkbox.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('shows a not-configured state and never signs in while there is no client ID', async () => {
    const { fixture, el, button, checkbox, signInWithMicrosoft } = render(false);
    expect(el.textContent).toContain("isn't configured yet");
    checkbox.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.click();
    await fixture.whenStable();
    expect(signInWithMicrosoft).not.toHaveBeenCalled();
  });

  it('passes a valid ?next= on, and drops one that leaves the site', async () => {
    for (const [next, expected] of [
      ['/connect?project=prj_a', '/connect?project=prj_a'],
      ['https://evil.example', null],
      ['//evil.example', null],
    ] as const) {
      const { fixture, button, checkbox, signInWithMicrosoft } = render(true, next);
      checkbox.click();
      fixture.detectChanges();
      button.click();
      await fixture.whenStable();
      expect(signInWithMicrosoft).toHaveBeenCalledExactlyOnceWith('register', true, expected);
    }
  });

  it('carries straight on when already signed in', () => {
    const { goAfterSignIn } = render(true, '/join', true);
    expect(goAfterSignIn).toHaveBeenCalledExactlyOnceWith('/join');
  });
});

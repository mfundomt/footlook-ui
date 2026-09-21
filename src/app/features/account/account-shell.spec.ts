import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AccountShell } from './account-shell';

function render() {
  const signOut = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [AccountShell],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { user: signal({ id: '1', email: 'dev@example.com', displayName: 'Dev Eloper' }), signOut } },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AccountShell);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, signOut, navigate, fixture };
}

describe('AccountShell', () => {
  it('shows the logo, the links, the name and a sign-out button', () => {
    const { el } = render();
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/logo-transparent.png');
    expect(Array.from(el.querySelectorAll('nav a')).map((a) => a.getAttribute('href'))).toEqual(['/projects', '/join']);
    expect(el.querySelector('.name')?.textContent).toBe('Dev Eloper');
    expect(el.querySelector('main#main')).toBeTruthy();
  });

  it('signs out and returns to the home page', async () => {
    const { el, signOut, navigate, fixture } = render();
    (el.querySelector('.signout') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});

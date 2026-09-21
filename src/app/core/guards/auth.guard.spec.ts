import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

function run(signedIn: boolean, url: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { ensureSession: () => signedIn } }],
  });
  return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
}

describe('authGuard', () => {
  it('lets a signed-in visitor through', () => {
    expect(run(true, '/projects')).toBe(true);
  });

  it('sends a signed-out visitor to /login and remembers the page they asked for', () => {
    const result = run(false, '/projects/prj_abc');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?next=%2Fprojects%2Fprj_abc');
  });

  it('keeps the whole connect link, encoded, so it can be resumed after sign-in', () => {
    const connect = '/connect?project=prj_abc&return=https%3A%2F%2Fapi.example.com%2Ffootlook.html';
    const tree = run(false, connect) as UrlTree;
    expect(tree.queryParams['next']).toBe(connect);
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe(`/login?next=${encodeURIComponent(connect)}`);
  });
});

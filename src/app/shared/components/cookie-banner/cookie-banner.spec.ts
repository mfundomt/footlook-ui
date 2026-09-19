import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GA_MEASUREMENT_ID } from '../../../core/services/analytics.service';
import { CookieBanner } from './cookie-banner';

function render(measurementId: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CookieBanner],
    providers: [provideRouter([]), { provide: GA_MEASUREMENT_ID, useValue: measurementId }],
  });
  const fixture = TestBed.createComponent(CookieBanner);
  fixture.detectChanges();
  return fixture;
}

describe('CookieBanner', () => {
  afterEach(() => localStorage.clear());

  it('renders nothing when analytics is not configured', () => {
    const el = render('').nativeElement as HTMLElement;
    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('[role="region"]')).toBeNull();
  });

  it('asks for consent with equally weighted accept and reject buttons', () => {
    const el = render('G-TEST1234').nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Reject analytics', 'Accept analytics']);
    expect(new Set(buttons.map((b) => b.className)).size).toBe(1);
    expect(el.querySelector('[role="region"]')?.getAttribute('aria-labelledby')).toBe('cookie-title');
  });

  it('swaps the panel for a cookie settings button once a choice is made', () => {
    const fixture = render('G-TEST1234');
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelectorAll('button')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[role="region"]')).toBeNull();
    expect(el.querySelector('button')?.textContent?.trim()).toBe('Cookie settings');
  });
});

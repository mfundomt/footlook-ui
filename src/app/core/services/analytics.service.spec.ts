import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService, GA_MEASUREMENT_ID } from './analytics.service';
import { ConsentService } from './consent.service';

const TEST_ID = 'G-TEST1234';
const gaScripts = () => document.querySelectorAll('script[src*="googletagmanager.com"]');

function setup(measurementId: string): { analytics: AnalyticsService; consent: ConsentService } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: GA_MEASUREMENT_ID, useValue: measurementId }],
  });
  const consent = TestBed.inject(ConsentService);
  const analytics = TestBed.inject(AnalyticsService);
  TestBed.tick();
  return { analytics, consent };
}

describe('AnalyticsService', () => {
  afterEach(() => {
    localStorage.clear();
    gaScripts().forEach((script) => script.remove());
    const win = window as unknown as Record<string, unknown>;
    delete win['dataLayer'];
    delete win['gtag'];
    delete win[`ga-disable-${TEST_ID}`];
  });

  it('does nothing when no Measurement ID is configured', () => {
    const { analytics, consent } = setup('');
    consent.accept();
    TestBed.tick();
    expect(analytics.enabled).toBe(false);
    expect(gaScripts().length).toBe(0);
  });

  it('ignores a malformed Measurement ID', () => {
    const { analytics } = setup('not-an-id');
    expect(analytics.enabled).toBe(false);
  });

  it('does not request Google before the visitor accepts', () => {
    const { analytics } = setup(TEST_ID);
    expect(analytics.enabled).toBe(true);
    expect(gaScripts().length).toBe(0);
    expect((window as unknown as Record<string, unknown>)['dataLayer']).toBeUndefined();
  });

  it('does not request Google after the visitor rejects', () => {
    const { consent } = setup(TEST_ID);
    consent.reject();
    TestBed.tick();
    expect(gaScripts().length).toBe(0);
  });

  it('loads Google Analytics once after acceptance', () => {
    const { consent } = setup(TEST_ID);
    consent.accept();
    TestBed.tick();
    const scripts = gaScripts();
    expect(scripts.length).toBe(1);
    expect(scripts[0].getAttribute('src')).toContain(`id=${TEST_ID}`);

    const dataLayer = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer;
    const commands = dataLayer.map((entry) => entry[0]);
    expect(commands).toEqual(['consent', 'js', 'config']);
    expect(dataLayer[2][2]).toMatchObject({ send_page_view: false, allow_google_signals: false });
  });

  it('stops sending and clears cookies when consent is withdrawn', () => {
    const { consent } = setup(TEST_ID);
    consent.accept();
    TestBed.tick();
    document.cookie = '_ga=GA1.1.123.456; path=/';

    consent.reject();
    TestBed.tick();

    expect((window as unknown as Record<string, unknown>)[`ga-disable-${TEST_ID}`]).toBe(true);
    expect(document.cookie).not.toContain('_ga=');
  });

  it('does not load a second script when consent is given again', () => {
    const { consent } = setup(TEST_ID);
    consent.accept();
    TestBed.tick();
    consent.reject();
    TestBed.tick();
    consent.accept();
    TestBed.tick();
    expect(gaScripts().length).toBe(1);
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${TEST_ID}`]).toBe(false);
  });
});

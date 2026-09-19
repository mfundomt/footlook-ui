import { TestBed } from '@angular/core/testing';
import { CONSENT_STORAGE_KEY, ConsentService } from './consent.service';

function freshService(): ConsentService {
  TestBed.resetTestingModule();
  return TestBed.inject(ConsentService);
}

describe('ConsentService', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts undecided and asks the visitor', () => {
    const service = freshService();
    expect(service.status()).toBe('unset');
    expect(service.analyticsGranted()).toBe(false);
    expect(service.panelOpen()).toBe(true);
  });

  it('remembers acceptance across visits', () => {
    freshService().accept();
    const next = freshService();
    expect(next.status()).toBe('granted');
    expect(next.panelOpen()).toBe(false);
  });

  it('remembers rejection across visits', () => {
    freshService().reject();
    const next = freshService();
    expect(next.status()).toBe('denied');
    expect(next.analyticsGranted()).toBe(false);
  });

  it('can be reopened from the cookie settings button', () => {
    const service = freshService();
    service.accept();
    service.openSettings();
    expect(service.panelOpen()).toBe(true);
    service.reject();
    expect(service.status()).toBe('denied');
    expect(service.panelOpen()).toBe(false);
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, '{not json');
    expect(freshService().status()).toBe('unset');
  });

  it('ignores a stored value from an unknown version', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 99, analytics: true }));
    expect(freshService().status()).toBe('unset');
  });

  it('treats the Global Privacy Control signal as a rejection', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    try {
      const service = freshService();
      expect(service.status()).toBe('denied');
      expect(service.panelOpen()).toBe(false);
    } finally {
      delete (navigator as unknown as Record<string, unknown>)['globalPrivacyControl'];
    }
  });

  it('still applies the choice for this visit when storage is blocked', () => {
    const service = freshService();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => service.accept()).not.toThrow();
    expect(service.status()).toBe('granted');
  });
});

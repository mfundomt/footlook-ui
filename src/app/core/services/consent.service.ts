import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ConsentStatus = 'unset' | 'granted' | 'denied';

/** Where the visitor's cookie choice is remembered. Keep in sync with the Cookie Policy page. */
export const CONSENT_STORAGE_KEY = 'footlook-cookie-consent';
const CONSENT_VERSION = 1;

interface StoredConsent {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

/**
 * Remembers whether the visitor allows analytics cookies.
 *
 * With no stored choice the status is 'unset' (treated as "no"). A browser that sends the
 * Global Privacy Control signal is treated as "denied" until the visitor explicitly chooses otherwise.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly state = signal<ConsentStatus>(this.readInitialStatus());

  readonly status = this.state.asReadonly();
  readonly analyticsGranted = computed(() => this.state() === 'granted');

  /** True while the consent panel should be visible: undecided, or reopened from "Cookie settings". */
  readonly panelOpen = signal(this.state() === 'unset');

  accept(): void {
    this.decide(true);
  }

  reject(): void {
    this.decide(false);
  }

  openSettings(): void {
    this.panelOpen.set(true);
  }

  private decide(analytics: boolean): void {
    this.state.set(analytics ? 'granted' : 'denied');
    this.panelOpen.set(false);
    try {
      const value: StoredConsent = { version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() };
      this.window?.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Storage can be blocked (private mode, browser settings). The choice still applies for this visit.
    }
  }

  private readInitialStatus(): ConsentStatus {
    try {
      const raw = this.window?.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<StoredConsent>;
        if (stored.version === CONSENT_VERSION && typeof stored.analytics === 'boolean') {
          return stored.analytics ? 'granted' : 'denied';
        }
      }
    } catch {
      // Unreadable or corrupted value: behave as if no choice was made.
    }
    const gpc = (this.window?.navigator as (Navigator & { globalPrivacyControl?: boolean }) | undefined)?.globalPrivacyControl;
    return gpc === true ? 'denied' : 'unset';
  }
}

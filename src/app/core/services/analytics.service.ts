import { DOCUMENT } from '@angular/common';
import { InjectionToken, Injectable, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsentService } from './consent.service';

/** Google Analytics 4 Measurement ID (looks like "G-XXXXXXXXXX"). Empty means analytics is switched off. */
export const GA_MEASUREMENT_ID = new InjectionToken<string>('GA_MEASUREMENT_ID', {
  providedIn: 'root',
  factory: () => environment.gaMeasurementId,
});

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

/* eslint-disable @typescript-eslint/no-explicit-any */
type BrowserWindow = Record<string, any>;

/**
 * Loads Google Analytics 4 only after the visitor has accepted analytics cookies.
 *
 * - No Measurement ID configured: does nothing at all (no script, no cookies, no banner).
 * - Consent not granted: Google's script is never requested.
 * - Consent withdrawn: sending is disabled and the Google cookies are removed.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly measurementId = inject(GA_MEASUREMENT_ID).trim();
  private readonly consent = inject(ConsentService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private loaded = false;
  private lastTrackedUrl: string | null = null;

  /** True when a valid Measurement ID is configured, i.e. there is something to ask consent for. */
  readonly enabled = MEASUREMENT_ID_PATTERN.test(this.measurementId);

  constructor() {
    if (!this.enabled) {
      return;
    }

    effect(() => {
      if (this.consent.analyticsGranted()) {
        this.enable();
      } else {
        this.disable();
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.trackPageView(event.urlAfterRedirects));
  }

  private get win(): BrowserWindow {
    return this.document.defaultView as unknown as BrowserWindow;
  }

  private enable(): void {
    const win = this.win;
    win[`ga-disable-${this.measurementId}`] = false;

    if (!this.loaded) {
      this.loaded = true;
      win['dataLayer'] = win['dataLayer'] ?? [];
      // Google's snippet requires the `arguments` object to be pushed, not an array.
      win['gtag'] = function () {
        // eslint-disable-next-line prefer-rest-params
        win['dataLayer'].push(arguments);
      };

      win['gtag']('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      win['gtag']('js', new Date());
      win['gtag']('config', this.measurementId, {
        send_page_view: false, // page views are sent on each route change instead
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=Lax;Secure',
      });

      const script = this.document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
      this.document.head.appendChild(script);
    }

    // If the first navigation has not finished yet, its NavigationEnd will report the page.
    if (this.router.navigated) {
      this.trackPageView(this.router.url);
    }
  }

  private disable(): void {
    if (this.loaded) {
      this.win[`ga-disable-${this.measurementId}`] = true;
    }
    this.lastTrackedUrl = null;
    this.deleteGoogleCookies();
  }

  private trackPageView(url: string): void {
    if (!this.loaded || !this.consent.analyticsGranted() || url === this.lastTrackedUrl) {
      return;
    }
    this.lastTrackedUrl = url;
    // Let the router finish setting the document title before it is read.
    setTimeout(() => {
      if (!this.consent.analyticsGranted()) {
        return;
      }
      this.win['gtag']('event', 'page_view', {
        page_location: this.document.location.href,
        page_path: url,
        page_title: this.document.title,
      });
    });
  }

  private deleteGoogleCookies(): void {
    const names = this.document.cookie
      .split(';')
      .map((cookie) => cookie.split('=')[0].trim())
      .filter((name) => name === '_ga' || name.startsWith('_ga_') || name === '_gid');
    if (!names.length) {
      return;
    }

    const labels = this.document.location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < labels.length - 1; i++) {
      const domain = labels.slice(i).join('.');
      domains.push(domain, `.${domain}`);
    }
    for (const name of names) {
      for (const domain of domains) {
        this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
      }
    }
  }
}

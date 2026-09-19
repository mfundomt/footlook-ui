import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Component, ElementRef, EnvironmentInjector, createComponent, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ConsentService } from '../../../core/services/consent.service';

/**
 * Asks for consent to analytics cookies. Renders nothing unless analytics is configured
 * (a Measurement ID is set), because otherwise there is nothing to consent to.
 */
@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css',
})
export class CookieBanner {
  protected readonly analytics = inject(AnalyticsService);
  protected readonly consent = inject(ConsentService);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly settingsButton = viewChild<ElementRef<HTMLButtonElement>>('settingsButton');
  private reopened = false;

  protected reopen(): void {
    this.reopened = true;
    this.consent.openSettings();
    // Move focus into the panel so keyboard and screen-reader users land on it.
    setTimeout(() => this.panel()?.nativeElement.focus());
  }

  protected choose(allow: boolean): void {
    if (allow) {
      this.consent.accept();
    } else {
      this.consent.reject();
    }
    if (this.reopened) {
      // Return focus to where the user came from once the panel closes.
      this.reopened = false;
      setTimeout(() => this.settingsButton()?.nativeElement.focus());
    }
  }
}

/**
 * Adds the banner to the page from an app initializer, so no template needs to know about it.
 * Does nothing unless analytics is configured. Call it from an injection context.
 */
export function mountCookieBanner(): void {
  if (!inject(AnalyticsService).enabled) {
    return;
  }
  const document = inject(DOCUMENT);
  const host = document.createElement('app-cookie-banner');
  document.body.appendChild(host);
  const ref = createComponent(CookieBanner, { environmentInjector: inject(EnvironmentInjector), hostElement: host });
  inject(ApplicationRef).attachView(ref.hostView);
}

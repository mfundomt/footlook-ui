import { Component, ViewEncapsulation, isDevMode } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BUSINESS, missingBusinessDetails } from '../../core/config/business.config';
import { LEGAL_LINKS, TRADEMARK_NOTICE } from '../../core/config/legal-links';

/** Shared shell for the legal pages: header, main landmark and a footer with the business details. */
@Component({
  selector: 'app-legal-layout',
  imports: [RouterLink, RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './legal-layout.html',
  styleUrl: './legal-layout.css',
})
export class LegalLayout {
  protected readonly business = BUSINESS;
  protected readonly links = LEGAL_LINKS;
  protected readonly trademarkNotice = TRADEMARK_NOTICE;
  protected readonly year = new Date().getFullYear();

  constructor() {
    const missing = missingBusinessDetails();
    if (isDevMode() && missing.length) {
      console.warn(`[FootLook] Business details still to fill in (src/app/core/config/business.config.ts): ${missing.join(", ")}`);
    }
  }
}

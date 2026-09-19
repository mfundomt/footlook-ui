import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUSINESS } from '../../core/config/business.config';
import { LEGAL_LAST_UPDATED } from '../../core/config/legal-links';
import { Detail } from './detail';

@Component({
  selector: 'app-refund-policy',
  imports: [Detail, RouterLink],
  template: `
    <h1>Refund Policy</h1>
    <p class="legal-meta">Last updated: {{ updated }}</p>

    <p class="legal-note">
      At the time of the last update, FootLook does not sell paid plans through this website, so there is currently
      nothing to refund. This page explains what will apply if and when we do.
    </p>

    <h2>1. If you buy something from us</h2>
    <ul>
      <li>Your statutory rights under the Consumer Protection Act 68 of 2008 and the Electronic Communications and Transactions Act 25 of 2002 always apply and are not reduced by this policy.</li>
      <li>Where you buy electronically, you may have a right to cancel within 7 days without giving a reason (section 44 of the Electronic Communications and Transactions Act), subject to that section's exceptions. We will state the refund conditions for each paid plan clearly before you pay.</li>
      <li>If a product or service is faulty or is not what we described, you may be entitled to a repair, replacement or refund under the Consumer Protection Act.</li>
    </ul>

    <h2>2. How to ask for a refund</h2>
    <p>
      Email <app-detail [value]="business.email" label="contact email" /> with your name, the email address you used to
      buy, the date of purchase and the reason for your request. We will reply and, if a refund is due, pay it to the
      original payment method without undue delay, and within any period the law requires.
    </p>

    <h2>3. Free use</h2>
    <p>Anything we offer free of charge has no purchase price, so no refund applies to it.</p>

    <p>See also our <a routerLink="/terms">Terms of Use</a> and <a routerLink="/privacy">Privacy Policy</a>.</p>
  `,
})
export class RefundPolicy {
  protected readonly business = BUSINESS;
  protected readonly updated = LEGAL_LAST_UPDATED;
}

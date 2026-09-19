import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUSINESS } from '../../core/config/business.config';
import { LEGAL_LAST_UPDATED, TRADEMARK_NOTICE } from '../../core/config/legal-links';
import { Detail } from './detail';

@Component({
  selector: 'app-terms',
  imports: [Detail, RouterLink],
  template: `
    <h1>Terms of Use</h1>
    <p class="legal-meta">Last updated: {{ updated }}</p>

    <p>
      These terms apply to your use of the FootLook website at <strong>footlook.co.za</strong>. By using the website
      you agree to them. If you do not agree, please do not use the website.
    </p>

    <h2>1. Who we are</h2>
    <p>These are the details required by section 43 of the Electronic Communications and Transactions Act 25 of 2002.</p>
    <dl>
      <dt>Business name</dt>
      <dd><app-detail [value]="business.legalName" label="registered business name" /> (trading as {{ business.tradingName }})</dd>
      <dt>Legal status</dt>
      <dd><app-detail [value]="business.legalStatus" label="legal status, e.g. (Pty) Ltd" /></dd>
      <dt>Registration number</dt>
      <dd><app-detail [value]="business.registrationNumber" label="CIPC registration number" /></dd>
      @if (business.vatNumber) {
        <dt>VAT number</dt>
        <dd>{{ business.vatNumber }}</dd>
      }
      <dt>Physical address</dt>
      <dd><app-detail [value]="business.physicalAddress" label="physical address" /></dd>
      <dt>Telephone</dt>
      <dd><app-detail [value]="business.phone" label="telephone number" /></dd>
      <dt>Email</dt>
      <dd><app-detail [value]="business.email" label="contact email" /></dd>
      <dt>Website</dt>
      <dd>https://www.footlook.co.za</dd>
    </dl>

    <h2>2. Using the website</h2>
    <ul>
      <li>You may use the website for lawful purposes only.</li>
      <li>You must not try to disrupt it, gain unauthorised access to it or its systems, or scrape it in a way that harms its performance.</li>
      <li>We may change, suspend or remove the website or any part of it at any time.</li>
    </ul>

    <h2>3. The FootLook software</h2>
    <p>
      These terms cover the website. If you download or use the FootLook software, its own licence or agreement
      applies to that use. Product descriptions on the website are general information, and features may change.
    </p>

    <h2>4. Intellectual property</h2>
    <p>
      The FootLook name, logo, website text, design and code are owned by us or our licensors and are protected by
      copyright and other laws. You may view the website and share links to it, but you may not copy or reuse
      our material commercially without written permission.
    </p>
    <p class="legal-note">{{ trademark }}</p>

    <h2>5. Links and third-party services</h2>
    <p>The website may link to or load content from other parties (for example documentation tooling and analytics). We do not control those parties and are not responsible for their content or practices.</p>

    <h2>6. No warranty, and limits on our liability</h2>
    <p>
      We work to keep the website accurate and available, but it is provided "as is". To the fullest extent the law
      allows, we do not promise that it will be uninterrupted or error-free, and we are not liable for indirect or
      consequential loss arising from using it. Nothing in these terms limits any right you have under the Consumer
      Protection Act 68 of 2008 or other law that cannot lawfully be excluded, and nothing limits liability for
      gross negligence or intentional harm.
    </p>

    <h2>7. Privacy and cookies</h2>
    <p>
      How we handle personal information is described in our <a routerLink="/privacy">Privacy Policy</a> and
      <a routerLink="/cookies">Cookie Policy</a>. Refunds are covered in our <a routerLink="/refunds">Refund Policy</a>.
    </p>

    <h2>8. Governing law</h2>
    <p>
      These terms are governed by the laws of the Republic of South Africa. You consent to the jurisdiction of the
      courts of <app-detail [value]="business.jurisdiction" label="court jurisdiction, e.g. Gauteng" />, without limiting
      any right you have to approach another court or forum, such as the National Consumer Commission or the Consumer
      Goods and Services Ombud, where the law allows.
    </p>

    <h2>9. Changes</h2>
    <p>We may update these terms. The version on this page, with its "last updated" date, is the one that applies.</p>

    <h2>10. Contact</h2>
    <p>Questions about these terms: <app-detail [value]="business.email" label="contact email" />.</p>
  `,
})
export class Terms {
  protected readonly business = BUSINESS;
  protected readonly updated = LEGAL_LAST_UPDATED;
  protected readonly trademark = TRADEMARK_NOTICE;
}

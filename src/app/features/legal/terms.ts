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
      These terms apply to your use of the FootLook website at <strong>footlook.co.za</strong> and of your FootLook
      account. By using the website, or by ticking the box to accept these terms and creating an account, you agree to
      them. If you do not agree, please do not use the website or create an account.
    </p>

    <h2>1. Who we are</h2>
    <p>These are the details required by section 43 of the Electronic Communications and Transactions Act 25 of 2002.</p>
    <dl>
      <dt>Business name</dt>
      <dd><app-detail [value]="business.legalName" label="registered business name" /> (trading as {{ business.tradingName }})</dd>
      <dt>Legal status</dt>
      <dd><app-detail [value]="business.legalStatus" label="legal status, e.g. (Pty) Ltd" /></dd>
      @if (business.registrationNumber) {
        <dt>Registration number</dt>
        <dd>{{ business.registrationNumber }}</dd>
      }
      @if (business.vatNumber) {
        <dt>VAT number</dt>
        <dd>{{ business.vatNumber }}</dd>
      }
      <dt>Physical address</dt>
      <dd><app-detail [value]="business.physicalAddress" label="physical address" /></dd>
      @if (business.phone) {
        <dt>Telephone</dt>
        <dd>{{ business.phone }}</dd>
      }
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

    <h2>3. Your FootLook account</h2>
    <ul>
      <li>You need an account to sign in to the FootLook dashboard. You create one by signing in with a work or personal Microsoft account. We do not ask for or store a password.</li>
      <li>You must be 18 or older, and you must be allowed to enter into these terms. If you sign up for an organisation, you confirm you have its authority to do so.</li>
      <li>Keep your Microsoft account secure. You are responsible for activity under your FootLook account, so tell us promptly if you think someone else has used it.</li>
      <li>Use FootLook only to observe APIs and systems that you own or are authorised to observe. You are responsible for making sure you may capture and view that traffic, including any personal information of your own users that it contains.</li>
      <li>Do not share your access, resell it, or try to reach another person's captures or account.</li>
      <li>We may suspend or close an account that breaks these terms or is used to harm the service or other people. You may ask us to delete your account at any time by contacting the Information Officer named in our <a routerLink="/privacy">Privacy Policy</a>.</li>
      <li>We record when you accept these terms, as described in the Privacy Policy.</li>
    </ul>

    <h2>4. The FootLook software</h2>
    <p>
      These terms cover the website and your account. If you download or use the FootLook software, its own licence or agreement
      applies to that use. Product descriptions on the website are general information, and features may change.
    </p>

    <h2>5. Intellectual property</h2>
    <p>
      The FootLook name, logo, website text, design and code are owned by us or our licensors and are protected by
      copyright and other laws. You may view the website and share links to it, but you may not copy or reuse
      our material commercially without written permission.
    </p>
    <p class="legal-note">{{ trademark }}</p>

    <h2>6. Links and third-party services</h2>
    <p>The website may link to or load content from other parties (for example documentation tooling, analytics and Microsoft, which provides sign-in). We do not control those parties and are not responsible for their content or practices.</p>

    <h2>7. No warranty, and limits on our liability</h2>
    <p>
      We work to keep the website accurate and available, but it is provided "as is". To the fullest extent the law
      allows, we do not promise that it will be uninterrupted or error-free, and we are not liable for indirect or
      consequential loss arising from using it. Nothing in these terms limits any right you have under the Consumer
      Protection Act 68 of 2008 or other law that cannot lawfully be excluded, and nothing limits liability for
      gross negligence or intentional harm.
    </p>

    <h2>8. Privacy and cookies</h2>
    <p>
      How we handle personal information is described in our <a routerLink="/privacy">Privacy Policy</a> and
      <a routerLink="/cookies">Cookie Policy</a>. Refunds are covered in our <a routerLink="/refunds">Refund Policy</a>.
    </p>

    <h2>9. Governing law</h2>
    <p>
      These terms are governed by the laws of the Republic of South Africa. You consent to the jurisdiction of the
      courts of <app-detail [value]="business.jurisdiction" label="court jurisdiction, e.g. Gauteng" />, without limiting
      any right you have to approach another court or forum, such as the National Consumer Commission or the Consumer
      Goods and Services Ombud, where the law allows.
    </p>

    <h2>10. Changes</h2>
    <p>We may update these terms. The version on this page, with its "last updated" date, is the one that applies.</p>

    <h2>11. Contact</h2>
    <p>Questions about these terms: <app-detail [value]="business.email" label="contact email" />.</p>
  `,
})
export class Terms {
  protected readonly business = BUSINESS;
  protected readonly updated = LEGAL_LAST_UPDATED;
  protected readonly trademark = TRADEMARK_NOTICE;
}

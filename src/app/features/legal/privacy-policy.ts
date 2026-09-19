import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUSINESS } from '../../core/config/business.config';
import { LEGAL_LAST_UPDATED } from '../../core/config/legal-links';
import { Detail } from './detail';

@Component({
  selector: 'app-privacy-policy',
  imports: [Detail, RouterLink],
  template: `
    <h1>Privacy Policy</h1>
    <p class="legal-meta">Last updated: {{ updated }}</p>

    <p>
      This policy explains how <strong>{{ business.tradingName }}</strong> ("we", "us") handles personal information
      when you visit <strong>footlook.co.za</strong> (the "website") and when you create or use a FootLook account
      (your "account"). We follow the Protection of Personal Information Act 4 of 2013 ("POPIA").
    </p>
    <p class="legal-note">
      This policy covers the website and your account. It does not describe the FootLook software you install in your
      own applications, which runs in your environment and is described in its own documentation.
    </p>

    <h2>1. Who is responsible</h2>
    <dl>
      <dt>Responsible party</dt>
      <dd><app-detail [value]="business.legalName" label="registered business name" /> (trading as {{ business.tradingName }})</dd>
      <dt>Address</dt>
      <dd><app-detail [value]="business.physicalAddress" label="physical address" /></dd>
      <dt>Email</dt>
      <dd><app-detail [value]="business.email" label="contact email" /></dd>
      <dt>Information Officer</dt>
      <dd>
        <app-detail [value]="business.informationOfficerName" label="Information Officer name" />,
        <app-detail [value]="business.informationOfficerEmail" label="Information Officer email" />
      </dd>
    </dl>

    <h2>2. What we collect and why</h2>
    <p>We only collect what we need to run and improve the website and to provide your account. The website has no contact forms. Creating an account is optional and uses your Microsoft account, so we never see or store a password.</p>
    <table>
      <thead>
        <tr><th>Information</th><th>Why we use it</th><th>When</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Technical data your browser sends: IP address, browser and device type, pages requested, date and time.</td>
          <td>To deliver the website, keep it secure and fix faults. Our hosting provider records this in server logs.</td>
          <td>Every visit.</td>
        </tr>
        <tr>
          <td>Analytics data: pages viewed, approximate location, device and browser type, how you arrived, and a random identifier stored in a cookie.</td>
          <td>To understand how the website is used so we can improve it.</td>
          <td>Only if you accept analytics cookies. You can refuse or change your mind at any time.</td>
        </tr>
        <tr>
          <td>Account information we receive from Microsoft when you sign up or sign in: your name, your email address, the identifiers Microsoft gives us for you (your Microsoft tenant and user ID), and whether it is a work or a personal Microsoft account.</td>
          <td>To create your account, recognise you when you return, and let you sign in to observe your own API with FootLook.</td>
          <td>When you sign up or sign in with Microsoft.</td>
        </tr>
        <tr>
          <td>Sign-in records: the date and time of each sign-up and sign-in, your IP address and browser type, how many times you have signed in, and when you accepted the Terms of Use and this policy.</td>
          <td>To keep accounts secure, detect misuse, and keep a record of your consent.</td>
          <td>Each time you sign up or sign in.</td>
        </tr>
        <tr>
          <td>Anything you choose to send us by email: your name, email address and message.</td>
          <td>To reply to you.</td>
          <td>Only when you email us.</td>
        </tr>
      </tbody>
    </table>
    <p>We do not sell personal information, and we do not use it for advertising or automated decision-making.</p>

    <h2>3. Our lawful basis</h2>
    <ul>
      <li><strong>Consent</strong> for analytics cookies. You may withdraw consent at any time through "Cookie settings".</li>
      <li><strong>Consent</strong> when you create an account: you tick the box accepting the Terms of Use and this policy before signing up, and we record when you did.</li>
      <li><strong>Providing your account</strong>: we need your account information to create the account and let you sign in.</li>
      <li><strong>Legitimate interest</strong> for server logs and sign-in records (security and reliable delivery of the website and your account).</li>
      <li><strong>Steps you ask us to take</strong> when you email us and expect a reply.</li>
    </ul>

    <h2>4. Who we share it with</h2>
    <p>We use these service providers (operators under POPIA) who process information on our behalf:</p>
    <ul>
      <li><strong>Microsoft Azure</strong>, which hosts the website and stores account information and sign-in records in a database. Our hosting and database region is South Africa North.</li>
      <li><strong>Microsoft</strong> (Microsoft Entra ID and Microsoft accounts), which verifies who you are when you sign up or sign in. It tells us your name, email address and the identifiers listed above. Microsoft's own privacy statement applies to your dealings with Microsoft.</li>
      <li><strong>Google Analytics</strong> (Google LLC / Google Ireland Ltd), only if you accept analytics cookies.</li>
      <li><strong>jsDelivr</strong> (cdn.jsdelivr.net), a content delivery network. The documentation page loads a diagram library from it, so jsDelivr and its network providers will see your IP address when you open that page.</li>
    </ul>
    <p>We may also disclose information where the law requires it.</p>

    <h2>5. Transfers outside South Africa</h2>
    <p>
      Google, jsDelivr and Microsoft (for sign-in) may process information in other countries, including the United
      States and the European Union. Where that happens, we rely on those providers' contractual and legal safeguards, as required by section 72
      of POPIA.
    </p>

    <h2>6. How long we keep it</h2>
    <ul>
      <li>Server logs: kept only as long as needed for security and troubleshooting.</li>
      <li>Analytics data: kept in Google Analytics for no longer than 14 months.</li>
      <li>Account information and sign-in records: kept while your account exists. If you ask us to delete your account we delete this information, except what we must keep to meet a legal duty or to protect against misuse.</li>
      <li>Emails: kept while we deal with your request and for as long afterwards as the law or a genuine business need requires.</li>
    </ul>

    <h2>7. Security</h2>
    <p>The website is served over HTTPS, and we use reputable hosting with access controls. No system is perfectly secure, but we take reasonable technical and organisational measures to protect personal information, and we will notify you and the Information Regulator of a security compromise where POPIA requires it.</p>

    <h2>8. Your rights</h2>
    <p>Under POPIA you may ask us to:</p>
    <ul>
      <li>confirm whether we hold personal information about you, and give you a copy;</li>
      <li>correct or delete information that is inaccurate, outdated or unlawfully held;</li>
      <li>stop processing your information (object), or withdraw consent you gave.</li>
    </ul>
    <p>
      To use these rights, email <app-detail [value]="business.informationOfficerEmail" label="Information Officer email" />.
      If you are unhappy with how we handle your request, you may complain to the
      <strong>Information Regulator (South Africa)</strong>: <a href="https://inforegulator.org.za" rel="noopener">inforegulator.org.za</a>,
      complaints email <a href="mailto:complaints.IR@justice.gov.za">complaints.IR&#64;justice.gov.za</a>.
    </p>

    <h2>9. Children</h2>
    <p>The website and accounts are meant for software developers and are not directed at children under 18. We do not knowingly collect information from children, and we will delete an account we learn belongs to one.</p>

    <h2>10. Cookies</h2>
    <p>Our <a routerLink="/cookies">Cookie Policy</a> lists the cookies used and how to control them.</p>

    <h2>11. Changes to this policy</h2>
    <p>We will update this page when our practices change and change the "last updated" date above.</p>
  `,
})
export class PrivacyPolicy {
  protected readonly business = BUSINESS;
  protected readonly updated = LEGAL_LAST_UPDATED;
}

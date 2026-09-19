import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_LAST_UPDATED } from '../../core/config/legal-links';

@Component({
  selector: 'app-cookies-policy',
  imports: [RouterLink],
  template: `
    <h1>Cookie Policy</h1>
    <p class="legal-meta">Last updated: {{ updated }}</p>

    <p>
      Cookies are small text files a website stores in your browser. This page lists what the FootLook website and
      dashboard use, including similar browser storage. Read it together with our <a routerLink="/privacy">Privacy Policy</a>.
    </p>

    <h2>1. Cookies we use</h2>
    <h3>Strictly necessary</h3>
    <p>
      The website does not set any cookies that are strictly necessary for it to work. It does remember your cookie
      choice in your browser's local storage (an entry called <code>footlook-cookie-consent</code>), so we do not ask you again on every visit.
    </p>

    <h3>Signing in and the dashboard (strictly necessary)</h3>
    <p>
      Signing in does not use any cookies of ours, but it does keep a few entries in your browser so that you stay
      signed in. They are needed to provide the account you asked for, so they are not behind the cookie banner.
    </p>
    <table>
      <thead>
        <tr><th>Name</th><th>Where</th><th>Purpose</th><th>Lasts</th></tr>
      </thead>
      <tbody>
        <tr><td>Microsoft sign-in record (kept by Microsoft's sign-in library)</td><td>footlook.co.za, session storage</td><td>Completes your Microsoft sign-in.</td><td>Until you close the tab</td></tr>
        <tr><td><code>footlook_token</code>, <code>footlook_token_expires</code>, <code>footlook_user</code></td><td>The FootLook dashboard, local storage</td><td>Keep you signed in to the dashboard: your session token, when it expires, and your name and email for display.</td><td>Until the session expires or you sign out</td></tr>
        <tr><td><code>footlook_theme</code></td><td>The FootLook dashboard, local storage</td><td>Remembers your light or dark display choice.</td><td>Until you clear it</td></tr>
      </tbody>
    </table>
    <p>
      The Microsoft sign-in window is run by Microsoft at login.microsoftonline.com and may set its own cookies there.
      Those are under Microsoft's control and covered by Microsoft's privacy statement. Our own servers do not set cookies.
    </p>

    <h3>Analytics (only if you accept)</h3>
    <p>
      If you accept analytics, we use Google Analytics 4 to count visits and see which pages are useful. We do not load
      Google Analytics or set these cookies until you accept.
    </p>
    <table>
      <thead>
        <tr><th>Name</th><th>Provider</th><th>Purpose</th><th>Lasts</th></tr>
      </thead>
      <tbody>
        <tr><td><code>_ga</code></td><td>Google</td><td>Distinguishes visitors so visits can be counted.</td><td>Up to 2 years</td></tr>
        <tr><td><code>_ga_&lt;ID&gt;</code></td><td>Google</td><td>Keeps track of the current session.</td><td>Up to 2 years</td></tr>
      </tbody>
    </table>
    <p>We do not use advertising or marketing cookies, and we do not allow Google to use this data for advertising.</p>

    <h2>2. Third-party content</h2>
    <p>
      The documentation page loads a diagram script from <strong>cdn.jsdelivr.net</strong>. That does not set cookies
      for us, but the provider will see your IP address when the page loads.
    </p>

    <h2>3. Changing your mind</h2>
    <ul>
      <li>Use the <strong>Cookie settings</strong> button on the website at any time to accept or withdraw analytics.</li>
      <li>You can also delete cookies or block them in your browser settings.</li>
      <li>Google offers a browser add-on to opt out of Analytics on all websites: <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">tools.google.com/dlpage/gaoptout</a>.</li>
    </ul>

    <h2>4. Changes to this policy</h2>
    <p>If we add or remove cookies we will update this page and its "last updated" date.</p>
  `,
})
export class CookiesPolicy {
  protected readonly updated = LEGAL_LAST_UPDATED;
}

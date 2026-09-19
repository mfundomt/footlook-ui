import { Component } from '@angular/core';

/** The Microsoft four-square logo, drawn inline (official colours) so no image is fetched. */
@Component({
  selector: 'app-microsoft-logo',
  template: `
    <svg viewBox="0 0 21 21" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; }
    svg { display: block; }
  `,
})
export class MicrosoftLogo {}

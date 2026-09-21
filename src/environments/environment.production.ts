// Google Analytics 4 Measurement ID ("G-XXXXXXXXXX"). Leave empty to keep analytics, cookies and the consent banner switched off.
// centralApiUrl is the FootLook central service (accounts, projects, invite codes). No trailing slash.
export const environment = {
  production: true,
  apiUrl: '/api',
  gaMeasurementId: '' as string,
  centralApiUrl: 'https://footlook-auth.azurewebsites.net',
} as const;

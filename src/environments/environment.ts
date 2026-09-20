// Local development build (ng serve). Sign-in talks to a FootLook host running on this PC, e.g. the ECommerce test API on port 5103.
// To sign in against the hosted backend instead, use the Azure addresses from environment.production.ts.
// Google Analytics 4 Measurement ID ("G-XXXXXXXXXX"). Leave empty to keep analytics, cookies and the consent banner switched off.
export const environment = {
  production: false,
  apiUrl: '/api',
  gaMeasurementId: 'G-TEST1234' as string,
  authApiUrl: 'http://localhost:5103/footlook',
  dashboardUrl: 'http://localhost:5103/footlook.html',
} as const;

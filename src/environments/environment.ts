// Local development build (ng serve). Sign-in talks to the FootLook central service running on this PC (FootLook.Central, port 5200).
// To sign in against the hosted service instead, use the Azure address from environment.production.ts.
// Google Analytics 4 Measurement ID ("G-XXXXXXXXXX"). Leave empty to keep analytics, cookies and the consent banner switched off.
export const environment = {
  production: false,
  apiUrl: '/api',
  gaMeasurementId: 'G-TEST1234' as string,
  centralApiUrl: 'http://localhost:5200',
} as const;

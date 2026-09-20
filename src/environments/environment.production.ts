// Google Analytics 4 Measurement ID ("G-XXXXXXXXXX"). Leave empty to keep analytics, cookies and the consent banner switched off.
export const environment = {
  production: true,
  apiUrl: '/api',
  gaMeasurementId: '' as string,
  authApiUrl: 'https://footlook-dashboard.azurewebsites.net/footlook',
  dashboardUrl: 'https://footlook-dashboard.azurewebsites.net/footlook.html',
} as const;

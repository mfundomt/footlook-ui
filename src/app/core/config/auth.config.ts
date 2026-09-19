/**
 * Microsoft sign-in (Entra ID) settings for the login and register screens.
 *
 * MSAL_CLIENT_ID is the "Application (client) ID" of the FootLook app registration
 * (platform: Single-page application). While it is empty the screens show a
 * "Sign-in isn't configured yet" message instead of opening a Microsoft window.
 * It is a public identifier, not a secret.
 */
export const MSAL_CLIENT_ID = '264de9b0-15e7-4887-b686-5b6c18a2f376';

/** "common" accepts both work/school and personal Microsoft accounts. */
export const MSAL_AUTHORITY = 'https://login.microsoftonline.com/common';

/** Scopes requested at sign-in; they yield an ID token the backend verifies. */
export const MSAL_SCOPES = ['openid', 'profile', 'email'];

/**
 * Path (on this site) of the page Microsoft returns to inside the sign-in popup.
 * Register `<origin>/auth/redirect.html` as a Single-page application redirect URI
 * for every origin the site runs on (production domain and http://localhost:4200).
 */
export const MSAL_REDIRECT_PATH = '/auth/redirect.html';

/** Base URL of the FootLook backend. */
export const AUTH_API_URL = 'https://footlook-dashboard.azurewebsites.net/footlook';

/**
 * Where a signed-in developer is sent, with the session in the URL fragment.
 * TODO: unify with DASHBOARD_URL in dashboard.config.ts once that file is committed.
 */
export const DASHBOARD_URL_FOR_HANDOFF = 'https://footlook-dashboard.azurewebsites.net/footlook.html';

export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';

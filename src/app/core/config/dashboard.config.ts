import { environment } from '../../../environments/environment';

/**
 * Where a signed-in developer is sent: the FootLook dashboard. In production this is the FootLook.Demo app
 * hosted in its own Azure web app (footlook-dashboard); local builds use the host in environment.ts.
 * Change the value in the environment files if the dashboard moves to a custom domain such as demo.footlook.co.za.
 */
export const DASHBOARD_URL: string = environment.dashboardUrl;

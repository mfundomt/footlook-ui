import { Component, InjectionToken, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';

/** Sends the browser to another page. Replaced in tests. `replace` keeps this page out of the back-button history. */
export const CONNECT_REDIRECT = new InjectionToken<(url: string) => void>('CONNECT_REDIRECT', {
  providedIn: 'root',
  factory: () => (url) => window.location.replace(url),
});

export type ConnectState = 'working' | 'redirecting' | 'no_access' | 'bad_return' | 'incomplete' | 'unreachable' | 'unexpected';

/** A ProjectId is short and url-safe; anything else is not worth sending to the service. */
const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** True for an absolute http(s) address, the only kind a pass may be handed to. */
function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.hash;
  } catch {
    return false;
  }
}

/**
 * /connect?project=<ProjectId>&return=<url>: the hand-off from a developer's own dashboard. Asks the central service for a
 * short-lived pass for the project, then sends the browser back to the address the SERVICE echoes (never the raw query value)
 * with the pass in the URL fragment, so it is not sent to any server on the way.
 * The route is guarded, so a signed-out visitor is sent to /login?next=<this url> first.
 */
@Component({
  selector: 'app-connect',
  imports: [RouterLink],
  templateUrl: './connect.html',
  styleUrl: './account.css',
})
export class Connect implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly redirect = inject(CONNECT_REDIRECT);

  protected readonly state = signal<ConnectState>('working');
  private readonly projectId = this.route.snapshot.queryParamMap.get('project')?.trim() ?? '';
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('return')?.trim() ?? '';

  ngOnInit(): void {
    void this.connect();
  }

  protected async connect(): Promise<void> {
    if (!PROJECT_ID_PATTERN.test(this.projectId) || !this.returnUrl) {
      this.state.set('incomplete');
      return;
    }
    this.state.set('working');
    try {
      const result = await this.api.connect(this.projectId, this.returnUrl);
      // Only the address the service accepted may be used, and only if it is a plain web address.
      if (typeof result?.pass !== 'string' || !result.pass || !isHttpUrl(result.returnUrl)) {
        this.state.set('unexpected');
        return;
      }
      this.state.set('redirecting');
      this.redirect(`${result.returnUrl}#pass=${encodeURIComponent(result.pass)}`);
    } catch (error) {
      if (!(error instanceof CentralApiError)) this.state.set('unexpected');
      else if (error.code === 'project_not_found') this.state.set('no_access');
      else if (error.code === 'invalid_return_url' || error.code === 'invalid_request') this.state.set('bad_return');
      else if (error.code === 'unauthorized' || error.code === 'invalid_token') this.state.set('working'); // the interceptor is already sending the person to sign in
      else this.state.set(error.isTransient ? 'unreachable' : 'unexpected');
    }
  }
}

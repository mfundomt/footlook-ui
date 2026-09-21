import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { REGISTER_ROUTE } from '../../core/config/auth.config';
import { AuthFailure, AuthService } from '../../core/services/auth.service';
import { safeInternalPath } from '../../core/util/safe-redirect';
import { MicrosoftLogo } from './microsoft-logo';

/** Sign in to an existing FootLook account with a Microsoft account. */
@Component({
  selector: 'app-login',
  imports: [RouterLink, MicrosoftLogo],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  /** Where to go once signed in (from ?next=). Only an internal path is ever used; anything else is ignored. */
  private readonly next = safeInternalPath(this.route.snapshot.queryParamMap.get('next'));

  protected readonly configured = this.auth.configured;
  protected readonly registerRoute = REGISTER_ROUTE;
  protected readonly busy = signal(false);
  protected readonly failure = signal<AuthFailure | null>(null);
  /** True when the visitor came here from a "connect your project" link. */
  protected readonly fromConnect = this.next?.startsWith('/connect') ?? false;

  ngOnInit(): void {
    // Already signed in (for example a second click on Get Started): carry straight on.
    if (this.auth.ensureSession()) void this.auth.goAfterSignIn(this.next);
  }

  protected async signIn(): Promise<void> {
    if (this.busy() || !this.configured) return;
    this.failure.set(null);
    this.busy.set(true);
    const failure = await this.auth.signInWithMicrosoft('login', false, this.next);
    this.failure.set(failure);
    // On success the app is already moving on to the next page, so keep the button busy.
    if (failure) this.busy.set(false);
  }
}

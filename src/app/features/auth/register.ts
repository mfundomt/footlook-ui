import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LOGIN_ROUTE } from '../../core/config/auth.config';
import { AuthFailure, AuthService, authFailure } from '../../core/services/auth.service';
import { safeInternalPath } from '../../core/util/safe-redirect';
import { MicrosoftLogo } from './microsoft-logo';

/** Create a FootLook account with a Microsoft account. Terms and privacy consent must be given first. */
@Component({
  selector: 'app-register',
  imports: [RouterLink, MicrosoftLogo],
  templateUrl: './register.html',
  styleUrl: './auth.css',
})
export class Register implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  /** Where to go once the account exists (from ?next=). Only an internal path is ever used. */
  private readonly next = safeInternalPath(this.route.snapshot.queryParamMap.get('next'));

  protected readonly configured = this.auth.configured;
  protected readonly loginRoute = LOGIN_ROUTE;
  protected readonly accepted = signal(false);
  protected readonly busy = signal(false);
  protected readonly failure = signal<AuthFailure | null>(null);

  ngOnInit(): void {
    if (this.auth.ensureSession()) void this.auth.goAfterSignIn(this.next);
  }

  protected setAccepted(checked: boolean): void {
    this.accepted.set(checked);
    // The reminder about the terms no longer applies once they are ticked.
    if (checked && this.failure()?.code === 'terms_not_accepted') this.failure.set(null);
  }

  protected async signUp(): Promise<void> {
    if (this.busy() || !this.configured) return;
    if (!this.accepted()) {
      this.failure.set(authFailure('terms_not_accepted'));
      return;
    }
    this.failure.set(null);
    this.busy.set(true);
    const failure = await this.auth.signInWithMicrosoft('register', true, this.next);
    this.failure.set(failure);
    // On success the app is already moving on to the next page, so keep the button busy.
    if (failure) this.busy.set(false);
  }
}

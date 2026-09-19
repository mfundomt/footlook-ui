import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LOGIN_ROUTE } from '../../core/config/auth.config';
import { AuthFailure, AuthService, authFailure } from '../../core/services/auth.service';
import { MicrosoftLogo } from './microsoft-logo';

/** Create a FootLook account with a Microsoft account. Terms and privacy consent must be given first. */
@Component({
  selector: 'app-register',
  imports: [RouterLink, MicrosoftLogo],
  templateUrl: './register.html',
  styleUrl: './auth.css',
})
export class Register {
  private readonly auth = inject(AuthService);

  protected readonly configured = this.auth.configured;
  protected readonly loginRoute = LOGIN_ROUTE;
  protected readonly accepted = signal(false);
  protected readonly busy = signal(false);
  protected readonly failure = signal<AuthFailure | null>(null);

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
    const failure = await this.auth.signInWithMicrosoft('register', true);
    this.failure.set(failure);
    // On success the browser is already leaving for the dashboard, so keep the button busy.
    if (failure) this.busy.set(false);
  }
}

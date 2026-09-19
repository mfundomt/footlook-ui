import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REGISTER_ROUTE } from '../../core/config/auth.config';
import { AuthFailure, AuthService } from '../../core/services/auth.service';
import { MicrosoftLogo } from './microsoft-logo';

/** Sign in to an existing FootLook account with a Microsoft account. */
@Component({
  selector: 'app-login',
  imports: [RouterLink, MicrosoftLogo],
  templateUrl: './login.html',
  styleUrl: './auth.css',
})
export class Login {
  private readonly auth = inject(AuthService);

  protected readonly configured = this.auth.configured;
  protected readonly registerRoute = REGISTER_ROUTE;
  protected readonly busy = signal(false);
  protected readonly failure = signal<AuthFailure | null>(null);

  protected async signIn(): Promise<void> {
    if (this.busy() || !this.configured) return;
    this.failure.set(null);
    this.busy.set(true);
    const failure = await this.auth.signInWithMicrosoft('login', false);
    this.failure.set(failure);
    // On success the browser is already leaving for the dashboard, so keep the button busy.
    if (failure) this.busy.set(false);
  }
}

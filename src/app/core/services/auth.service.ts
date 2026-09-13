import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  signOut(): void { this.isAuthenticated.set(false); }
}
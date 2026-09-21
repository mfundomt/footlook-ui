import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Frame for the signed-in pages: a small header (logo, Projects, Join, the person's name, Sign out) above the page. */
@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './account-shell.html',
  styleUrl: './account-shell.css',
})
export class AccountShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected async signOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}

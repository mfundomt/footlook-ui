import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';

/** Enter an invite code (prefilled from ?code=) to become a member of someone's project. */
@Component({
  selector: 'app-join',
  templateUrl: './join.html',
  styleUrl: './account.css',
})
export class Join implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly fieldError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const prefill = this.route.snapshot.queryParamMap.get('code');
    if (prefill) {
      this.code.set(prefill.trim());
      // Do not leave the code sitting in the address bar and the history.
      void this.router.navigate([], { queryParams: { code: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  protected async join(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.error.set(null);
    const code = this.code().trim();
    if (!code) {
      this.fieldError.set('Enter the invite code you were given.');
      return;
    }
    if (code.length > 64) {
      this.fieldError.set("That doesn't look like an invite code. Check it and try again.");
      return;
    }
    this.fieldError.set(null);

    this.busy.set(true);
    try {
      const joined = await this.api.redeemInvite(code);
      await this.router.navigate(['/projects', joined.projectId]);
    } catch (error) {
      this.error.set(error instanceof CentralApiError ? error.message : 'Something went wrong. Please try again.');
      this.busy.set(false);
    }
  }
}

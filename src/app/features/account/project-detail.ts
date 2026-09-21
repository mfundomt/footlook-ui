import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CreatedInvite, InviteSummary, Project, ProjectMember } from '../../core/models/central.model';
import { AuthService } from '../../core/services/auth.service';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { copyToClipboard } from '../../core/util/clipboard';
import { formatDay, formatWhen, parseUtc } from '../../core/util/dates';
import {
  INVITE_MAX_USES_RANGE,
  PROJECT_NAME_MAX,
  RETURN_URLS_MAX,
  validateInviteOptions,
  validateProjectForm,
} from '../../core/util/project-validation';

/** How long an invite stays valid, offered as choices so the value always stays inside the allowed range. */
export const INVITE_EXPIRY_CHOICES = [
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
] as const;

type CopyKey = 'id' | 'code' | 'snippet' | 'config';
type InviteState = 'Active' | 'Revoked' | 'Expired' | 'Used up';

/** One project: its ProjectId and setup snippet, return URLs, members, invite codes, and (for the owner) deletion. */
@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './account.css',
})
export class ProjectDetail implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly nameMax = PROJECT_NAME_MAX;
  protected readonly returnUrlsMax = RETURN_URLS_MAX;
  protected readonly usesRange = INVITE_MAX_USES_RANGE;
  protected readonly expiryChoices = INVITE_EXPIRY_CHOICES;
  protected readonly formatDay = formatDay;
  protected readonly formatWhen = formatWhen;

  protected readonly projectId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly project = signal<Project | null>(null);
  protected readonly members = signal<ProjectMember[]>([]);
  protected readonly invites = signal<InviteSummary[]>([]);
  protected readonly isOwner = computed(() => this.project()?.role === 'owner');
  protected readonly myId = computed(() => (this.auth.user()?.id ?? '').toLowerCase());

  // Copy buttons.
  protected readonly copied = signal<CopyKey | null>(null);
  protected readonly copyFailed = signal(false);

  // Edit form (owner).
  protected readonly editName = signal('');
  protected readonly editUrls = signal('');
  protected readonly editNameError = signal<string | null>(null);
  protected readonly editUrlErrors = signal<string[]>([]);
  protected readonly editSaving = signal(false);
  protected readonly editError = signal<string | null>(null);
  protected readonly editSaved = signal(false);

  // Members.
  protected readonly memberError = signal<string | null>(null);
  protected readonly membersBusy = signal(false);

  // Invites (owner).
  protected readonly inviteMaxUses = signal(1);
  protected readonly inviteExpiry = signal<number>(168);
  protected readonly inviteFormError = signal<string | null>(null);
  protected readonly inviteBusy = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  /** The raw code from the moment of creation. It exists only here, only until it is dismissed or the page is left. */
  protected readonly newInvite = signal<CreatedInvite | null>(null);

  // Delete (owner).
  protected readonly confirmingDelete = signal(false);
  protected readonly deleteConfirmation = signal('');
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly deleteReady = computed(() => {
    const name = this.project()?.name.trim();
    return !!name && this.deleteConfirmation().trim() === name;
  });

  protected readonly codeSnippet = computed(
    () => `builder.Services.AddFootLook(o =>\n{\n    o.Central.ProjectId = "${this.projectId}";\n});`,
  );
  protected readonly configSnippet = computed(
    () => `"FootLook": {\n  "Central": {\n    "ProjectId": "${this.projectId}"\n  }\n}`,
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.loadError.set(null);
    try {
      const [project, members] = await Promise.all([this.api.getProject(this.projectId), this.api.listMembers(this.projectId)]);
      this.project.set(project);
      this.members.set(members);
      this.editName.set(project.name);
      this.editUrls.set(project.allowedReturnUrls.join('\n'));
      if (project.role === 'owner') this.invites.set(await this.api.listInvites(this.projectId));
    } catch (error) {
      if (error instanceof CentralApiError && error.code === 'project_not_found') this.notFound.set(true);
      else this.loadError.set(errorText(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async copy(key: CopyKey, text: string): Promise<void> {
    const ok = await copyToClipboard(text);
    this.copyFailed.set(!ok);
    this.copied.set(ok ? key : null);
  }

  protected async saveProject(event: Event): Promise<void> {
    event.preventDefault();
    if (this.editSaving()) return;
    this.editError.set(null);
    this.editSaved.set(false);
    const result = validateProjectForm(this.editName(), this.editUrls());
    this.editNameError.set(result.nameError);
    this.editUrlErrors.set(result.issues.map((issue) => issue.message));
    if (result.nameError || result.issues.length > 0) return;

    this.editSaving.set(true);
    try {
      const updated = await this.api.updateProject(this.projectId, { name: result.name, allowedReturnUrls: result.allowedReturnUrls });
      // The answer may not repeat every field (for example the member count), so keep what is already known.
      this.project.update((current) => (current ? { ...current, ...updated, role: current.role, memberCount: current.memberCount } : updated));
      this.editName.set(updated.name);
      this.editUrls.set(updated.allowedReturnUrls.join('\n'));
      this.editSaved.set(true);
    } catch (error) {
      this.editError.set(errorText(error));
    } finally {
      this.editSaving.set(false);
    }
  }

  protected isMe(member: ProjectMember): boolean {
    return member.userId.toLowerCase() === this.myId();
  }

  protected canRemove(member: ProjectMember): boolean {
    if (member.role === 'owner') return false;
    return this.isOwner() || this.isMe(member);
  }

  protected async removeMember(member: ProjectMember): Promise<void> {
    if (this.membersBusy()) return;
    this.memberError.set(null);
    this.membersBusy.set(true);
    try {
      await this.api.removeMember(this.projectId, member.userId);
      if (this.isMe(member)) {
        await this.router.navigate(['/projects']);
        return;
      }
      this.members.set(this.members().filter((m) => m.userId !== member.userId));
      this.project.update((current) => (current?.memberCount ? { ...current, memberCount: current.memberCount - 1 } : current));
    } catch (error) {
      this.memberError.set(errorText(error));
    } finally {
      this.membersBusy.set(false);
    }
  }

  protected setMaxUses(value: string): void {
    this.inviteMaxUses.set(value.trim() === '' ? Number.NaN : Number(value));
  }

  protected async createInvite(event: Event): Promise<void> {
    event.preventDefault();
    if (this.inviteBusy()) return;
    this.inviteError.set(null);
    const problem = validateInviteOptions(this.inviteMaxUses(), this.inviteExpiry());
    this.inviteFormError.set(problem);
    if (problem) return;

    this.inviteBusy.set(true);
    try {
      const invite = await this.api.createInvite(this.projectId, { maxUses: this.inviteMaxUses(), expiresInHours: this.inviteExpiry() });
      this.copied.set(null);
      this.copyFailed.set(false);
      this.newInvite.set(invite);
      this.invites.set(await this.api.listInvites(this.projectId));
    } catch (error) {
      this.inviteError.set(errorText(error));
    } finally {
      this.inviteBusy.set(false);
    }
  }

  /** Hides the code for good: the service never returns it again. */
  protected dismissInvite(): void {
    this.newInvite.set(null);
    if (this.copied() === 'code') this.copied.set(null);
  }

  protected inviteState(invite: InviteSummary): InviteState {
    if (invite.revoked) return 'Revoked';
    if (parseUtc(invite.expiresAtUtc) <= Date.now()) return 'Expired';
    if (invite.usedCount >= invite.maxUses) return 'Used up';
    return 'Active';
  }

  protected async revokeInvite(invite: InviteSummary): Promise<void> {
    this.inviteError.set(null);
    try {
      await this.api.revokeInvite(this.projectId, invite.id);
      this.invites.set(this.invites().map((i) => (i.id === invite.id ? { ...i, revoked: true } : i)));
    } catch (error) {
      this.inviteError.set(errorText(error));
    }
  }

  protected startDelete(): void {
    this.deleteError.set(null);
    this.deleteConfirmation.set('');
    this.confirmingDelete.set(true);
  }

  protected cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  protected async deleteProject(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.deleteReady() || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    try {
      await this.api.deleteProject(this.projectId);
      await this.router.navigate(['/projects']);
    } catch (error) {
      this.deleteError.set(errorText(error));
      this.deleting.set(false);
    }
  }
}

function errorText(error: unknown): string {
  return error instanceof CentralApiError ? error.message : 'Something went wrong. Please try again.';
}

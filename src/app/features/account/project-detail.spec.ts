import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CreatedInvite, InviteSummary, Project, ProjectMember } from '../../core/models/central.model';
import { AuthService } from '../../core/services/auth.service';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { ProjectDetail } from './project-detail';

const ID = 'prj_abcdefghijklmnop';
const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const CODE = 'FL-K7M2QX9WTB';

const project = (role: 'owner' | 'member' = 'owner'): Project => ({
  id: ID,
  name: 'Shop API',
  role,
  allowedReturnUrls: ['https://api.example.com/footlook.html'],
  createdAtUtc: '2026-09-01T08:00:00Z',
  memberCount: 2,
});
const members: ProjectMember[] = [
  { userId: ME, email: 'me@example.com', displayName: 'Me Owner', role: 'owner', addedAtUtc: '2026-09-01T08:00:00Z' },
  { userId: OTHER, email: 'tester@example.com', displayName: 'Tess Tester', role: 'member', addedAtUtc: '2026-09-02T08:00:00Z' },
];
const invite = (over: Partial<InviteSummary> = {}): InviteSummary => ({
  id: 1,
  expiresAtUtc: new Date(Date.now() + 86_400_000).toISOString(),
  maxUses: 2,
  usedCount: 0,
  revoked: false,
  ...over,
});

async function render(options: { role?: 'owner' | 'member'; me?: string; invites?: InviteSummary[]; getProject?: () => Promise<Project> } = {}) {
  const role = options.role ?? 'owner';
  const api = {
    getProject: vi.fn(options.getProject ?? (async () => project(role))),
    listMembers: vi.fn(async () => members),
    listInvites: vi.fn(async () => options.invites ?? []),
    updateProject: vi.fn(async (_id: string, body: { name?: string; allowedReturnUrls?: string[] }) => ({ ...project(role), ...body })),
    createInvite: vi.fn(async (): Promise<CreatedInvite> => ({ id: 9, code: CODE, expiresAtUtc: '2026-10-01T00:00:00Z', maxUses: 1 })),
    revokeInvite: vi.fn(async () => undefined),
    removeMember: vi.fn(async () => undefined),
    deleteProject: vi.fn(async () => undefined),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ProjectDetail],
    providers: [
      provideRouter([]),
      { provide: CentralApiService, useValue: api },
      { provide: AuthService, useValue: { user: signal({ id: options.me ?? ME, email: 'me@example.com', displayName: 'Me' }) } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: ID }) } } },
    ],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ProjectDetail);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  // The page loads with plain promises, so wait for the loading state to go away.
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Loading the project');
  });
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const click = async (label: string) => {
    const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(label));
    if (!button) throw new Error(`No button "${label}"`);
    button.click();
    await settle();
  };
  const type = async (selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const submit = async (formIndex: number) => {
    el.querySelectorAll('form')[formIndex].dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  };
  return { fixture, el, api, navigate, click, type, submit, settle, text: () => el.textContent ?? '' };
}

describe('ProjectDetail', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => undefined) }, configurable: true });
  });

  it('shows the ProjectId with a copy button, both setup snippets and the no-secret statement', async () => {
    const { el, text, click } = await render();
    expect(el.querySelector('#project-id')?.textContent).toBe(ID);
    expect(text()).toContain('No secret is needed');
    const snippets = Array.from(el.querySelectorAll('pre.snippet')).map((p) => p.textContent);
    expect(snippets[0]).toContain('builder.Services.AddFootLook(o =>');
    expect(snippets[0]).toContain(`o.Central.ProjectId = "${ID}";`);
    expect(snippets[1]).toContain('"FootLook": {');
    expect(snippets[1]).toContain(`"ProjectId": "${ID}"`);

    await click('Copy ProjectId');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ID);
    expect(text()).toContain('ProjectId copied to the clipboard');
  });

  it('shows the invite code once, highlighted, with a copy button and a warning, and never again', async () => {
    const { el, api, click, submit, text } = await render();
    expect(el.querySelector('.reveal')).toBeNull();

    await submit(1);
    expect(api.createInvite).toHaveBeenCalledExactlyOnceWith(ID, { maxUses: 1, expiresInHours: 168 });
    expect(el.querySelector('.reveal .code')?.textContent).toBe(CODE);
    expect(el.querySelector('.reveal .warning')?.textContent).toContain('shown only once');

    await click('Copy code invite code');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CODE);

    await click('hide the code');
    expect(el.querySelector('.reveal')).toBeNull();
    expect(text()).not.toContain(CODE);
  });

  it('never shows a code in the invite list', async () => {
    const { el, click, text } = await render({
      invites: [invite({ id: 1 }), invite({ id: 2, revoked: true }), invite({ id: 3, usedCount: 2 }), invite({ id: 4, expiresAtUtc: '2020-01-01T00:00:00Z' })],
    });
    const rows = Array.from(el.querySelectorAll('.rows li')).map((li) => li.textContent ?? '');
    expect(text()).not.toContain('FL-');
    expect(rows.some((r) => r.includes('Invite 2') && r.includes('Revoked'))).toBe(true);
    expect(rows.some((r) => r.includes('Invite 3') && r.includes('Used up'))).toBe(true);
    expect(rows.some((r) => r.includes('Invite 4') && r.includes('Expired'))).toBe(true);
    // Only the active invite offers Revoke.
    expect(Array.from(el.querySelectorAll('button')).filter((b) => b.textContent?.includes('Revoke'))).toHaveLength(1);
    await click('Revoke');
    expect(text()).not.toContain('FL-');
  });

  it('revokes an active invite', async () => {
    const { api, click, text } = await render({ invites: [invite({ id: 1 })] });
    await click('Revoke');
    expect(api.revokeInvite).toHaveBeenCalledExactlyOnceWith(ID, 1);
    expect(text()).toContain('Revoked');
  });

  it('validates invite uses before sending', async () => {
    const { api, type, submit, text } = await render();
    await type('#invite-uses', '26');
    await submit(1);
    expect(api.createInvite).not.toHaveBeenCalled();
    expect(text()).toContain('whole number from 1 to 25');
  });

  it('lets the owner edit the name and return URLs, and validates them first', async () => {
    const { api, type, submit, text } = await render();
    await type('#edit-urls', 'http://insecure.example/x');
    await submit(0);
    expect(api.updateProject).not.toHaveBeenCalled();
    expect(text()).toContain('must use https://');

    await type('#edit-name', 'Renamed');
    await type('#edit-urls', 'https://a.example/x\nhttps://b.example/y');
    await submit(0);
    expect(api.updateProject).toHaveBeenCalledExactlyOnceWith(ID, { name: 'Renamed', allowedReturnUrls: ['https://a.example/x', 'https://b.example/y'] });
    expect(text()).toContain('Saved.');
  });

  it('lets the owner remove a member but not the owner', async () => {
    const { api, click, el } = await render();
    const removeButtons = Array.from(el.querySelectorAll('button')).filter((b) => b.textContent?.includes('Remove'));
    expect(removeButtons).toHaveLength(1);
    await click('Remove');
    expect(api.removeMember).toHaveBeenCalledExactlyOnceWith(ID, OTHER);
  });

  it('gives a member read-only access: no edit, invites or delete, and they can leave', async () => {
    const { el, api, text, click, navigate } = await render({ role: 'member', me: OTHER });
    expect(el.querySelector('#edit-name')).toBeNull();
    expect(text()).not.toContain('Invite codes');
    expect(text()).not.toContain('Delete project');
    expect(api.listInvites).not.toHaveBeenCalled();
    expect(text()).toContain('https://api.example.com/footlook.html');

    await click('Leave project');
    expect(api.removeMember).toHaveBeenCalledExactlyOnceWith(ID, OTHER);
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('asks for the project name before deleting, then deletes and goes back to the list', async () => {
    const { api, click, type, submit, navigate, el } = await render();
    await click('Delete this project');
    const confirm = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Permanently delete')) as HTMLButtonElement;
    expect(confirm.getAttribute('aria-disabled')).toBe('true');

    await submit(2);
    expect(api.deleteProject).not.toHaveBeenCalled();

    await type('#delete-confirm', 'wrong name');
    await submit(2);
    expect(api.deleteProject).not.toHaveBeenCalled();

    await type('#delete-confirm', 'Shop API');
    expect(confirm.getAttribute('aria-disabled')).toBe('false');
    await submit(2);
    expect(api.deleteProject).toHaveBeenCalledExactlyOnceWith(ID);
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('can cancel the delete confirmation', async () => {
    const { click, el } = await render();
    await click('Delete this project');
    await click('Cancel');
    expect(el.querySelector('#delete-confirm')).toBeNull();
  });

  it('shows a not-found state (never a 403) with links onward', async () => {
    const { text, el } = await render({
      getProject: async () => {
        throw new CentralApiError(404, 'project_not_found');
      },
    });
    expect(text()).toContain('Project not found');
    expect(el.querySelector('a[href="/join"]')).toBeTruthy();
  });

  it('shows a retry when the service cannot be reached', async () => {
    const { text, el } = await render({
      getProject: async () => {
        throw new CentralApiError(0, 'network');
      },
    });
    expect(text()).toContain("couldn't reach FootLook");
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Try again'))).toBe(true);
  });
});

/** JSON shapes of the FootLook central service (see the central HTTP API contract). */

export type ProjectRole = 'owner' | 'member';

/** GET /projects (one entry). */
export interface ProjectSummary {
  id: string;
  name: string;
  role: ProjectRole;
  memberCount: number;
  createdAtUtc: string;
}

/** GET /projects/{id}, and the project returned by POST and PATCH. */
export interface Project {
  id: string;
  name: string;
  role: ProjectRole;
  allowedReturnUrls: string[];
  createdAtUtc: string;
  /** Not sent by POST /projects. */
  memberCount?: number;
}

export interface CreateProjectRequest {
  name: string;
  allowedReturnUrls: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  allowedReturnUrls?: string[];
}

/** GET /projects/{id}/members (one entry). */
export interface ProjectMember {
  userId: string;
  email: string;
  displayName: string;
  role: ProjectRole;
  addedAtUtc: string;
}

export interface CreateInviteRequest {
  maxUses?: number;
  expiresInHours?: number;
}

/** POST /projects/{id}/invites: the only response that ever carries the raw code. */
export interface CreatedInvite {
  id: number;
  code: string;
  expiresAtUtc: string;
  maxUses: number;
}

/** GET /projects/{id}/invites (one entry): never carries the code. */
export interface InviteSummary {
  id: number;
  expiresAtUtc: string;
  maxUses: number;
  usedCount: number;
  revoked: boolean;
}

/** POST /invites/redeem. */
export interface RedeemedInvite {
  projectId: string;
  name: string;
  role: 'member';
}

/** POST /projects/{id}/connect. `returnUrl` is the address the server accepted; only it may be redirected to. */
export interface ConnectResult {
  pass: string;
  expiresAtUtc: string;
  returnUrl: string;
}

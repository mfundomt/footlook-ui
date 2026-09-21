import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CENTRAL_API_URL } from '../config/auth.config';
import {
  ConnectResult,
  CreateInviteRequest,
  CreateProjectRequest,
  CreatedInvite,
  InviteSummary,
  Project,
  ProjectMember,
  ProjectSummary,
  RedeemedInvite,
  UpdateProjectRequest,
} from '../models/central.model';

/** Codes the central service returns as `{ "error": "<code>" }`, plus a few this client adds for failures without one. */
export type ApiErrorCode =
  | 'invalid_request'
  | 'invalid_token'
  | 'unauthorized'
  | 'forbidden'
  | 'project_not_found'
  | 'project_limit'
  | 'project_full'
  | 'invite_limit'
  | 'cannot_remove_owner'
  | 'member_not_found'
  | 'invite_not_found'
  | 'invalid_return_url'
  | 'invalid_invite'
  | 'too_many_attempts'
  | 'too_many_requests'
  | 'unavailable'
  | 'network'
  | 'unknown';

const API_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_request: 'Something in that request was not accepted. Check what you entered and try again.',
  invalid_token: 'Your sign-in could not be verified. Please sign in again.',
  unauthorized: 'Your session has ended. Please sign in again.',
  forbidden: 'Only the project owner can do that.',
  project_not_found: "We couldn't find that project, or you're not a member of it.",
  project_limit: "You've reached the limit of 10 projects. Delete one you no longer use to create another.",
  project_full: 'That project already has the maximum number of members (25).',
  invite_limit: 'This project already has the maximum number of active invite codes (20). Revoke one you no longer need first.',
  cannot_remove_owner: "The project owner can't be removed. Delete the project instead if you no longer need it.",
  member_not_found: "That person isn't a member of this project any more.",
  invite_not_found: "That invite code no longer exists. It may already have been revoked.",
  invalid_return_url: "That address isn't one this project allows. Ask the project owner to add it to the project's return URLs.",
  invalid_invite: "That code isn't valid. It may have expired, been revoked or already been used up.",
  too_many_attempts: 'Too many wrong codes. Please wait a few minutes before trying again.',
  too_many_requests: 'Too many requests. Please wait a moment and try again.',
  unavailable: 'FootLook is temporarily unavailable. Please try again in a few minutes.',
  network: "We couldn't reach FootLook. Check your connection and try again.",
  unknown: 'Something went wrong. Please try again.',
};

/** Codes that may arrive in a response body (the two client-side ones never do). */
const BODY_CODES = new Set<string>(Object.keys(API_MESSAGES).filter((code) => code !== 'network' && code !== 'unknown'));

/** A failed call to the central service, already worded for the person reading it. Never carries tokens or codes. */
export class CentralApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
  ) {
    super(API_MESSAGES[code]);
    this.name = 'CentralApiError';
  }

  /** True when there is no answer to show (offline, or the service is down) and trying again may help. */
  get isTransient(): boolean {
    return this.code === 'network' || this.code === 'unavailable';
  }
}

/** Maps an HTTP failure from the central service to a CentralApiError. */
export function mapApiError(error: unknown): CentralApiError {
  if (error instanceof CentralApiError) return error;
  if (!(error instanceof HttpErrorResponse)) return new CentralApiError(0, 'unknown');
  const body = error.error as { error?: unknown } | null;
  const apiCode = typeof body === 'object' && body !== null && typeof body.error === 'string' ? body.error : undefined;
  if (error.status === 0) return new CentralApiError(0, 'network');
  // The service's own names for three of the situations this client already words for the reader.
  const codeAliases: Record<string, ApiErrorCode> = {
    rate_limited: 'too_many_requests',
    service_unavailable: 'unavailable',
    server_error: 'unknown',
  };
  if (apiCode && codeAliases[apiCode]) return new CentralApiError(error.status, codeAliases[apiCode]);
  if (apiCode && BODY_CODES.has(apiCode)) return new CentralApiError(error.status, apiCode as ApiErrorCode);
  switch (error.status) {
    case 401:
      return new CentralApiError(401, 'unauthorized');
    case 403:
      return new CentralApiError(403, 'forbidden');
    case 404:
      return new CentralApiError(404, 'project_not_found');
    case 429:
      return new CentralApiError(429, 'too_many_requests');
    case 502:
    case 503:
    case 504:
      return new CentralApiError(error.status, 'unavailable');
    default:
      return new CentralApiError(error.status, 'unknown');
  }
}

/**
 * Typed client for the FootLook central service. The session token is added by authInterceptor, and only for
 * this service's address. Every method throws a CentralApiError with a friendly message.
 */
@Injectable({ providedIn: 'root' })
export class CentralApiService {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    return `${CENTRAL_API_URL}${path}`;
  }

  private projectPath(projectId: string, suffix = ''): string {
    return `/projects/${encodeURIComponent(projectId)}${suffix}`;
  }

  private async call<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      throw mapApiError(error);
    }
  }

  listProjects(): Promise<ProjectSummary[]> {
    return this.call(firstValueFrom(this.http.get<ProjectSummary[]>(this.url('/projects'))));
  }

  createProject(request: CreateProjectRequest): Promise<Project> {
    return this.call(firstValueFrom(this.http.post<Project>(this.url('/projects'), request)));
  }

  getProject(projectId: string): Promise<Project> {
    return this.call(firstValueFrom(this.http.get<Project>(this.url(this.projectPath(projectId)))));
  }

  updateProject(projectId: string, request: UpdateProjectRequest): Promise<Project> {
    return this.call(firstValueFrom(this.http.patch<Project>(this.url(this.projectPath(projectId)), request)));
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.call(firstValueFrom(this.http.delete<void>(this.url(this.projectPath(projectId)))));
  }

  listMembers(projectId: string): Promise<ProjectMember[]> {
    return this.call(firstValueFrom(this.http.get<ProjectMember[]>(this.url(this.projectPath(projectId, '/members')))));
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.call(
      firstValueFrom(this.http.delete<void>(this.url(this.projectPath(projectId, `/members/${encodeURIComponent(userId)}`)))),
    );
  }

  /** Creates an invite. The response holds the raw code, which the service will never return again. */
  createInvite(projectId: string, request: CreateInviteRequest): Promise<CreatedInvite> {
    return this.call(firstValueFrom(this.http.post<CreatedInvite>(this.url(this.projectPath(projectId, '/invites')), request)));
  }

  listInvites(projectId: string): Promise<InviteSummary[]> {
    return this.call(firstValueFrom(this.http.get<InviteSummary[]>(this.url(this.projectPath(projectId, '/invites')))));
  }

  async revokeInvite(projectId: string, inviteId: number): Promise<void> {
    await this.call(
      firstValueFrom(this.http.delete<void>(this.url(this.projectPath(projectId, `/invites/${encodeURIComponent(String(inviteId))}`)))),
    );
  }

  redeemInvite(code: string): Promise<RedeemedInvite> {
    return this.call(firstValueFrom(this.http.post<RedeemedInvite>(this.url('/invites/redeem'), { code })));
  }

  /** Asks for a pass for the project. Redirect only to the `returnUrl` in the answer, never to the value that was sent. */
  connect(projectId: string, returnUrl: string): Promise<ConnectResult> {
    return this.call(firstValueFrom(this.http.post<ConnectResult>(this.url(this.projectPath(projectId, '/connect')), { returnUrl })));
  }
}

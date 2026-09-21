/** Client-side checks that mirror the central service rules, so mistakes are caught before a request is sent. */

export const PROJECT_NAME_MAX = 100;
export const RETURN_URLS_MAX = 5;
export const RETURN_URL_MAX_LENGTH = 300;
export const INVITE_MAX_USES_RANGE = { min: 1, max: 25 } as const;
export const INVITE_EXPIRY_HOURS_RANGE = { min: 1, max: 720 } as const;

export interface ReturnUrlIssue {
  /** 1-based line number in the text box (0 for problems that concern the list as a whole). */
  line: number;
  message: string;
}

export interface ProjectFormResult {
  name: string;
  allowedReturnUrls: string[];
  issues: ReturnUrlIssue[];
  nameError: string | null;
}

/** Splits the "one per line" text into trimmed, non-empty, de-duplicated (exact repeats) lines (keeping their line numbers). */
export function parseReturnUrlLines(text: string): { line: number; value: string }[] {
  const seen = new Set<string>();
  const result: { line: number; value: string }[] = [];
  text.split(/\r\n|\r|\n/).forEach((raw, index) => {
    const value = raw.trim();
    if (!value) return;
    const key = value;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ line: index + 1, value });
  });
  return result;
}

/** Returns a message when the value is not an allowed return URL, otherwise null. */
export function returnUrlProblem(value: string): string | null {
  if (value.length > RETURN_URL_MAX_LENGTH) return `is longer than ${RETURN_URL_MAX_LENGTH} characters.`;
  if (value.includes('*')) return 'must not contain wildcards (*).';
  if (value.includes('#')) return 'must not contain a fragment (#).';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'must be a full address such as https://api.example.com/footlook.html.';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'must start with https://.';
  if (url.username || url.password) return 'must not contain a user name or password.';
  if (url.protocol === 'http:' && !isLocalHost(url.hostname)) return 'must use https:// (http:// is only allowed for localhost).';
  return null;
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function validateProjectName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a name for the project.';
  if (trimmed.length > PROJECT_NAME_MAX) return `The name can be at most ${PROJECT_NAME_MAX} characters.`;
  return null;
}

/** Validates the create/edit project form. `allowedReturnUrls` is what to send when there are no issues. */
export function validateProjectForm(nameText: string, returnUrlsText: string): ProjectFormResult {
  const lines = parseReturnUrlLines(returnUrlsText);
  const issues: ReturnUrlIssue[] = [];
  if (lines.length > RETURN_URLS_MAX) {
    issues.push({ line: 0, message: `You can add at most ${RETURN_URLS_MAX} return URLs.` });
  }
  for (const { line, value } of lines) {
    const problem = returnUrlProblem(value);
    if (problem) issues.push({ line, message: `Line ${line} ${problem}` });
  }
  return {
    name: nameText.trim(),
    allowedReturnUrls: lines.map((l) => l.value),
    issues,
    nameError: validateProjectName(nameText),
  };
}

export function validateInviteOptions(maxUses: number, expiresInHours: number): string | null {
  if (!Number.isInteger(maxUses) || maxUses < INVITE_MAX_USES_RANGE.min || maxUses > INVITE_MAX_USES_RANGE.max) {
    return `Uses must be a whole number from ${INVITE_MAX_USES_RANGE.min} to ${INVITE_MAX_USES_RANGE.max}.`;
  }
  if (!Number.isInteger(expiresInHours) || expiresInHours < INVITE_EXPIRY_HOURS_RANGE.min || expiresInHours > INVITE_EXPIRY_HOURS_RANGE.max) {
    return `Expiry must be from ${INVITE_EXPIRY_HOURS_RANGE.min} to ${INVITE_EXPIRY_HOURS_RANGE.max} hours.`;
  }
  return null;
}

/**
 * Accepts a "where to go after sign-in" value only when it is a path inside this site, so a crafted
 * `?next=` link cannot send someone to another site (open redirect). Returns the path (with its query)
 * to navigate to, or null when the value is missing or not safe.
 *
 * Rejected: anything not starting with a single "/", "//host" and "/\host" (browsers read both as another
 * site), backslashes and control or whitespace characters (browsers strip or convert them), and any of
 * those hidden behind percent-encoding in the path part.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (hasUnsafeCharacters(value)) return null;

  const pathEnd = value.search(/[?#]/);
  let path = pathEnd === -1 ? value : value.slice(0, pathEnd);
  // Decode a few times so double-encoded tricks such as /%252F/evil cannot get through either.
  for (let i = 0; i < 3; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      return null;
    }
    if (decoded === path) break;
    path = decoded;
    if (path.startsWith('//') || path.startsWith('/\\') || hasUnsafeCharacters(path)) return null;
  }
  if (!path.startsWith('/')) return null;
  return value;
}

function hasUnsafeCharacters(text: string): boolean {
  // A backslash, or any control or whitespace character (including the Unicode line separators).
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (char === String.fromCharCode(92) || code <= 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029) return true;
  }
  return false;
}

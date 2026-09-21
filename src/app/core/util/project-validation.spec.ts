import { returnUrlProblem, validateInviteOptions, validateProjectForm, validateProjectName } from './project-validation';

describe('validateProjectName', () => {
  it('requires 1 to 100 characters after trimming', () => {
    expect(validateProjectName('')).toBeTruthy();
    expect(validateProjectName('   ')).toBeTruthy();
    expect(validateProjectName('a')).toBeNull();
    expect(validateProjectName('x'.repeat(100))).toBeNull();
    expect(validateProjectName('x'.repeat(101))).toBeTruthy();
  });
});

describe('returnUrlProblem', () => {
  it('accepts https URLs and http only for localhost and 127.0.0.1', () => {
    for (const ok of [
      'https://api.example.com/footlook.html',
      'https://API.Example.com/footlook.html',
      'https://api.example.com:8443/a/b?x=1',
      'http://localhost:5103/footlook.html',
      'http://127.0.0.1:5103/footlook.html',
      'https://localhost/footlook.html',
    ]) {
      expect(returnUrlProblem(ok), ok).toBeNull();
    }
  });

  it('rejects everything the contract forbids', () => {
    for (const bad of [
      'api.example.com/footlook.html',
      '/footlook.html',
      'http://api.example.com/footlook.html',
      'ftp://api.example.com/x',
      'javascript:alert(1)',
      'https://user@api.example.com/x',
      'https://user:pass@api.example.com/x',
      'https://api.example.com/x#frag',
      'https://api.example.com/x#',
      'https://*.example.com/x',
      'https://api.example.com/*',
      'https://api.example.com/' + 'a'.repeat(300),
    ]) {
      expect(returnUrlProblem(bad), bad).toBeTruthy();
    }
  });

  it('allows exactly 300 characters', () => {
    const url = 'https://a.example/' + 'a'.repeat(300 - 'https://a.example/'.length);
    expect(url.length).toBe(300);
    expect(returnUrlProblem(url)).toBeNull();
  });
});

describe('validateProjectForm', () => {
  it('trims, skips blank lines, de-duplicates and keeps the order', () => {
    const result = validateProjectForm('  Shop  ', ' https://a.example/x \r\n\r\nhttps://b.example/y\nhttps://a.example/x\n');
    expect(result.name).toBe('Shop');
    expect(result.allowedReturnUrls).toEqual(['https://a.example/x', 'https://b.example/y']);
    expect(result.issues).toEqual([]);
    expect(result.nameError).toBeNull();
  });

  it('accepts an empty list of return URLs', () => {
    expect(validateProjectForm('Shop', '').issues).toEqual([]);
  });

  it('allows at most 5 return URLs', () => {
    const five = Array.from({ length: 5 }, (_, i) => `https://a${i}.example/x`).join('\n');
    expect(validateProjectForm('Shop', five).issues).toEqual([]);
    const six = `${five}\nhttps://a6.example/x`;
    expect(validateProjectForm('Shop', six).issues[0].message).toContain('at most 5');
  });

  it('points at the line with the problem', () => {
    const result = validateProjectForm('Shop', 'https://ok.example/x\nhttp://nope.example/x');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].line).toBe(2);
    expect(result.issues[0].message).toContain('Line 2');
  });

  it('reports a missing name', () => {
    expect(validateProjectForm('', 'https://ok.example/x').nameError).toBeTruthy();
  });
});

describe('validateInviteOptions', () => {
  it('keeps uses within 1 to 25 and expiry within 1 to 720 hours', () => {
    expect(validateInviteOptions(1, 168)).toBeNull();
    expect(validateInviteOptions(25, 720)).toBeNull();
    expect(validateInviteOptions(1, 1)).toBeNull();
    expect(validateInviteOptions(0, 168)).toBeTruthy();
    expect(validateInviteOptions(26, 168)).toBeTruthy();
    expect(validateInviteOptions(1.5, 168)).toBeTruthy();
    expect(validateInviteOptions(Number.NaN, 168)).toBeTruthy();
    expect(validateInviteOptions(1, 0)).toBeTruthy();
    expect(validateInviteOptions(1, 721)).toBeTruthy();
  });
});

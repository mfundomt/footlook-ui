import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ProjectSummary } from '../../core/models/central.model';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { Projects } from './projects';

const summary = (over: Partial<ProjectSummary> = {}): ProjectSummary => ({
  id: 'prj_abc',
  name: 'Shop API',
  role: 'owner',
  memberCount: 3,
  createdAtUtc: '2026-09-01T08:00:00Z',
  ...over,
});

async function render(list: () => Promise<ProjectSummary[]>) {
  const api = {
    listProjects: vi.fn(list),
    createProject: vi.fn(async (_body: unknown) => ({ id: 'prj_new', name: 'x', role: 'owner' as const, allowedReturnUrls: [] as string[], createdAtUtc: '' })),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Projects], providers: [provideRouter([]), { provide: CentralApiService, useValue: api }] });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Projects);
  fixture.detectChanges();
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await settle();
  const el = fixture.nativeElement as HTMLElement;
  const type = async (selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  };
  return { fixture, el, api, navigate, type, submit, text: () => el.textContent ?? '' };
}

describe('Projects page', () => {
  it('shows a loading state first', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Projects],
      providers: [provideRouter([]), { provide: CentralApiService, useValue: { listProjects: () => new Promise(() => undefined) } }],
    });
    const fixture = TestBed.createComponent(Projects);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading your projects');
  });

  it('lists projects with role badges and links to each', async () => {
    const { el } = await render(async () => [summary(), summary({ id: 'prj_two', name: 'Other', role: 'member', memberCount: 1 })]);
    const rows = Array.from(el.querySelectorAll('.rows li'));
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Shop API');
    expect(rows[0].querySelector('.badge')?.textContent).toBe('Owner');
    expect(rows[0].textContent).toContain('3 members');
    expect(rows[1].querySelector('.badge')?.textContent).toBe('Member');
    expect(rows[1].textContent).toContain('1 member');
    expect(rows[1].querySelector('a')?.getAttribute('href')).toBe('/projects/prj_two');
  });

  it('shows an empty state', async () => {
    const { text } = await render(async () => []);
    expect(text()).toContain('No projects yet');
  });

  it('shows a load failure with a retry', async () => {
    const { text, el } = await render(async () => {
      throw new CentralApiError(0, 'network');
    });
    expect(text()).toContain("couldn't reach FootLook");
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Try again'))).toBe(true);
  });

  it('validates the form before sending anything', async () => {
    const { api, submit, text, type } = await render(async () => []);
    await submit();
    expect(text()).toContain('Enter a name for the project');
    expect(api.createProject).not.toHaveBeenCalled();

    await type('#project-name', 'Shop');
    await type('#return-urls', 'https://ok.example/x\nhttp://bad.example/y\nhttps://a.example/*');
    await submit();
    expect(text()).toContain('Line 2 must use https://');
    expect(text()).toContain('Line 3 must not contain wildcards');
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it('rejects more than 5 return URLs', async () => {
    const { api, submit, text, type } = await render(async () => []);
    await type('#project-name', 'Shop');
    await type('#return-urls', Array.from({ length: 6 }, (_, i) => `https://a${i}.example/x`).join('\n'));
    await submit();
    expect(text()).toContain('at most 5');
    expect(api.createProject).not.toHaveBeenCalled();
  });

  it('creates the project with a trimmed name and one URL per line, then opens it', async () => {
    const { api, submit, navigate, type } = await render(async () => []);
    await type('#project-name', '  Shop  ');
    await type('#return-urls', ' https://a.example/x \n\nhttps://b.example/y ');
    await submit();
    expect(api.createProject).toHaveBeenCalledExactlyOnceWith({ name: 'Shop', allowedReturnUrls: ['https://a.example/x', 'https://b.example/y'] });
    expect(navigate).toHaveBeenCalledWith(['/projects', 'prj_new']);
  });

  it('shows the project limit message from the service', async () => {
    const { api, submit, text, type, navigate } = await render(async () => []);
    api.createProject.mockRejectedValueOnce(new CentralApiError(409, 'project_limit'));
    await type('#project-name', 'Shop');
    await submit();
    expect(text()).toContain('limit of 10 projects');
    expect(navigate).not.toHaveBeenCalled();
  });
});

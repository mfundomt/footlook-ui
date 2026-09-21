import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectSummary } from '../../core/models/central.model';
import { CentralApiError, CentralApiService } from '../../core/services/central-api.service';
import { formatDay } from '../../core/util/dates';
import { PROJECT_NAME_MAX, RETURN_URLS_MAX, validateProjectForm } from '../../core/util/project-validation';

/** The person's projects (owned or joined) and a form to register a new one. */
@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  templateUrl: './projects.html',
  styleUrl: './account.css',
})
export class Projects implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly router = inject(Router);

  protected readonly nameMax = PROJECT_NAME_MAX;
  protected readonly returnUrlsMax = RETURN_URLS_MAX;
  protected readonly formatDay = formatDay;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly projects = signal<ProjectSummary[]>([]);

  protected readonly name = signal('');
  protected readonly returnUrls = signal('');
  protected readonly nameError = signal<string | null>(null);
  protected readonly urlErrors = signal<string[]>([]);
  protected readonly saving = signal(false);
  protected readonly createError = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.projects.set(await this.api.listProjects());
    } catch (error) {
      this.loadError.set(errorText(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async create(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) return;
    this.createError.set(null);

    const result = validateProjectForm(this.name(), this.returnUrls());
    this.nameError.set(result.nameError);
    this.urlErrors.set(result.issues.map((issue) => issue.message));
    if (result.nameError || result.issues.length > 0) return;

    this.saving.set(true);
    try {
      const project = await this.api.createProject({ name: result.name, allowedReturnUrls: result.allowedReturnUrls });
      await this.router.navigate(['/projects', project.id]);
    } catch (error) {
      this.createError.set(errorText(error));
      this.saving.set(false);
    }
  }
}

function errorText(error: unknown): string {
  return error instanceof CentralApiError ? error.message : 'Something went wrong. Please try again.';
}

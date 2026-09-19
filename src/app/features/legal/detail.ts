import { Component, computed, input } from '@angular/core';

/** Shows a business detail, or a highlighted marker when it has not been filled in yet. */
@Component({
  selector: 'app-detail',
  template: `<span [class.todo]="missing()">{{ text() }}</span>`,
})
export class Detail {
  readonly value = input.required<string>();
  readonly label = input.required<string>();

  protected readonly missing = computed(() => !this.value().trim());
  protected readonly text = computed(() => (this.missing() ? `[Add: ${this.label()}]` : this.value()));
}

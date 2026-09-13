import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<'light' | 'dark'>('light');
  toggle(): void { this.mode.update(mode => mode === 'light' ? 'dark' : 'light'); }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;
  get<T>(path: string) { return this.http.get<T>(`${this.baseUrl}${path}`); }
}
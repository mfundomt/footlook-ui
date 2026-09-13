import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Capture } from '../models/capture.model';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  readonly captures$ = new Subject<Capture>();
  connect(): void { /* SignalR transport is configured when the API endpoint is available. */ }
  disconnect(): void { this.captures$.complete(); }
}
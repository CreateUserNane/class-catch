import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

/**
 * Real-time updates are disabled. Pages continue to refresh through their
 * normal API load actions without opening a persistent websocket connection.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  watchClass(_classId: number): Observable<void> {
    return EMPTY;
  }
}

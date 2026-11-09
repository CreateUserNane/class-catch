import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private echo: Echo<'reverb'> | null = null;

  watchClass(classId: number): Observable<void> {
    return new Observable<void>((subscriber) => {
      const channelName = `class.${classId}`;
      this.connection().private(channelName).listen('.class.updated', () => subscriber.next());

      return () => {
        this.connection().leave(channelName);
      };
    });
  }

  private connection(): Echo<'reverb'> {
    if (!this.echo) {
      this.echo = new Echo({
        broadcaster: 'reverb',
        client: new Pusher(environment.reverbKey, {
          cluster: 'mt1',
          wsHost: environment.reverbHost,
          wsPort: environment.reverbPort,
          wssPort: environment.reverbPort,
          forceTLS: environment.reverbScheme === 'https',
          enabledTransports: ['ws', 'wss'],
          authorizer: (channel) => ({
            authorize: (socketId, callback) => {
              const token = localStorage.getItem('classcatch_token');
              fetch(`${environment.apiUrl}/broadcasting/auth`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: new URLSearchParams({ socket_id: socketId, channel_name: channel.name }),
              })
                .then(async (response) => {
                  if (!response.ok) throw new Error('Could not authorize the real-time channel.');
                  callback(null, await response.json());
                })
                .catch((error: Error) => callback(error, null));
            },
          }),
        }),
      });
    }

    return this.echo;
  }
}

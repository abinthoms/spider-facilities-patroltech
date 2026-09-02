import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiAuthService } from '../../auth/infrastructure/ApiAuthService';

export interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

const RECONNECT_DELAY_MS = 3000;

@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private readonly events$ = new Subject<RealtimeEvent>();

  constructor(private authService: ApiAuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    const wsUrl = environment.apiServer.replace(/^http/, 'ws') + `/?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (message) => {
      try {
        this.events$.next(JSON.parse(message.data));
      } catch {
        // ignore malformed frames
      }
    };

    this.socket.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  get events() {
    return this.events$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

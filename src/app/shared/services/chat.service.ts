import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Comment } from '../../entities/podium/comment/model/comment';
import { baseUrl } from '../../app.constants';
import { AuthSessionService } from './auth-session.service';
import { SystemNotificationEvent } from '../../entities/podium/chat/model/system-notification-event';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private stompClient: Client | undefined;
  private baseUrl = `${baseUrl}/ws`;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;
  /** Срабатывает при каждом успешном onConnect после первого (переподключение WS). */
  private readonly reconnectSubject = new Subject<void>();
  readonly reconnect$ = this.reconnectSubject.asObservable();
  private hasHadFirstConnect = false;

  constructor(private authSessionService: AuthSessionService) {}

  connect(): Promise<void> {
    if (this.isConnected && this.stompClient) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    const token = this.authSessionService.getAccessToken();
    const wsUrl = `${this.baseUrl}?token=${token}`;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
    });

    this.connectPromise = new Promise<void>((resolve, reject) => {
      let settled = false;

      this.stompClient!.onConnect = () => {
        this.isConnected = true;
        if (this.hasHadFirstConnect) {
          this.reconnectSubject.next();
        }
        this.hasHadFirstConnect = true;
        settled = true;
        resolve();
      };

      this.stompClient!.onStompError = (error) => {
        this.isConnected = false;
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      this.stompClient!.onWebSocketClose = () => {
        this.isConnected = false;
      };

      this.stompClient!.activate();
    }).finally(() => {
      if (!this.isConnected) {
        this.connectPromise = null;
      }
    });

    return this.connectPromise;
  }

  subscribeToJob(jobId: string, callback: (message: Comment) => void): StompSubscription | null {
    if (this.stompClient && this.isConnected) {
      return this.stompClient.subscribe(`/topic/job/${jobId}`, (message) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  }

  subscribeToNotifications(callback: (notification: SystemNotificationEvent) => void): StompSubscription | null {
    if (this.stompClient && this.isConnected) {
      return this.stompClient.subscribe(`/user/queue/notifications`, (message) => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  }

  sendMessage(jobId: string, message: string): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination: '/app/send',
        body: JSON.stringify({ jobId, message }),
      });
    }
  }

  sendRead(jobId: string, lastReadCommentId?: string | number | bigint | null): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination: '/app/read',
        body: JSON.stringify({
          jobId,
          ...(lastReadCommentId != null ? { lastReadCommentId } : {}),
        }),
      });
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      void this.stompClient.deactivate();
      this.isConnected = false;
    }
  }
}

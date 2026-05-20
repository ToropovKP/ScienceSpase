import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';
import { SystemNotification } from '../../entities/podium/chat/model/system-notification';
import { SystemNotificationEvent } from '../../entities/podium/chat/model/system-notification-event';
import { ChatService } from './chat.service';
import { ChatActivityService } from './chat-activity.service';
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class SystemNotificationService {
  private readonly notificationsSubject = new BehaviorSubject<SystemNotification[]>([]);
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly notifications$ = this.notificationsSubject.asObservable().pipe(distinctUntilChanged());
  readonly unreadCount$ = this.unreadCountSubject.asObservable().pipe(distinctUntilChanged());
  readonly loading$ = this.loadingSubject.asObservable().pipe(distinctUntilChanged());

  private notificationsSubscription: StompSubscription | null = null;
  private initialized = false;
  private panelOpen = false;
  private notificationsLoaded = false;

  constructor(
    private httpService: HttpService,
    private chatService: ChatService,
    private chatActivityService: ChatActivityService,
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.refreshUnreadCount();
    await this.chatService.connect();
    this.notificationsSubscription = this.chatService.subscribeToNotifications((notification) => {
      void this.handleIncomingNotification(notification);
    });
    this.initialized = true;
  }

  async openPanel(): Promise<void> {
    this.panelOpen = true;
    await this.loadNotifications(true);
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  async loadNotifications(force = false): Promise<void> {
    if (this.loadingSubject.value) {
      return;
    }
    if (this.notificationsLoaded && !force) {
      return;
    }
    this.loadingSubject.next(true);
    try {
      const notifications = await this.httpService.getNotifications();
      this.notificationsSubject.next(notifications);
      this.notificationsLoaded = true;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async refreshUnreadCount(): Promise<void> {
    const unreadCount = await this.httpService.getNotificationsUnreadCount();
    this.unreadCountSubject.next(unreadCount);
  }

  async load(): Promise<void> {
    const [notifications, unreadCount] = await Promise.all([
      this.httpService.getNotifications(),
      this.httpService.getNotificationsUnreadCount(),
    ]);
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(unreadCount);
    this.notificationsLoaded = true;
  }

  clear(): void {
    this.notificationsSubscription?.unsubscribe();
    this.notificationsSubscription = null;
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.loadingSubject.next(false);
    this.initialized = false;
    this.panelOpen = false;
    this.notificationsLoaded = false;
  }

  async markRead(id: number): Promise<void> {
    await this.httpService.markNotificationRead(id);
    const updated = this.notificationsSubject.value.map((notification) =>
      notification.id === id ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() } : notification,
    );
    this.notificationsSubject.next(updated);
    await this.refreshUnreadCount();
  }

  async markAllRead(): Promise<void> {
    await this.httpService.markAllNotificationsRead();
    const updated = this.notificationsSubject.value.map((notification) => ({
      ...notification,
      readAt: notification.readAt ?? new Date().toISOString(),
    }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
  }

  private async handleIncomingNotification(notification: SystemNotificationEvent): Promise<void> {
    const activeJobId = this.chatActivityService.getActiveJobId();
    const isActiveReading = this.chatActivityService.isActivelyReading(activeJobId);

    if (activeJobId && isActiveReading && notification.type === 'JOB_CHAT_MESSAGE') {
      try {
        const notifications = await this.httpService.getNotifications();
        const fullNotification = notifications.find((item) => item.id === notification.id);
        if (fullNotification?.jobId != null && String(fullNotification.jobId) === activeJobId) {
          await this.httpService.markNotificationRead(fullNotification.id);
          if (this.panelOpen) {
            this.notificationsSubject.next(
              notifications.map((item) =>
                item.id === fullNotification.id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
              ),
            );
            this.notificationsLoaded = true;
          }
          await this.refreshUnreadCount();
          return;
        }
        if (this.panelOpen) {
          this.notificationsSubject.next(notifications);
          this.notificationsLoaded = true;
        }
      } catch {
        /* ignore and fall back to unread refresh */
      }
    }

    await this.refreshUnreadCount();
    if (this.panelOpen) {
      await this.loadNotifications(true);
    }
  }
}

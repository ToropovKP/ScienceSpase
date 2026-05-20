import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { User } from '../../../entities/shared/user/model/user';
import { HttpService } from '../../../shared/services/http.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AuthSessionService } from '../../../shared/services/auth-session.service';
import { SystemNotificationService } from '../../../shared/services/system-notification.service';
import {
  SystemContextService,
  SystemKey,
  SystemNavItem,
} from '../../../shared/services/system-context.service';
import { ToastContainerComponent } from '../../../shared/ui/toast-container.component';
import { SystemNotification } from '../../../entities/podium/chat/model/system-notification';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  imports: [CommonModule, RouterModule, ToastContainerComponent],
})
export class HeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly httpService = inject(HttpService);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly systemNotificationService = inject(SystemNotificationService);
  private readonly systemContext = inject(SystemContextService);

  readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly currentSystem = toSignal(this.systemContext.current$, {
    initialValue: this.systemContext.current,
  });
  readonly notifications = toSignal(this.systemNotificationService.notifications$, { initialValue: [] });
  readonly unreadNotifications = toSignal(this.systemNotificationService.unreadCount$, { initialValue: 0 });
  readonly notificationsLoading = toSignal(this.systemNotificationService.loading$, { initialValue: false });

  readonly isMobileMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);
  readonly isNotificationsOpen = signal(false);

  readonly isLogged = computed(() => this.currentUser() != null);
  readonly isAdmin = computed(() => this.authService.hasRole('ADMIN'));

  readonly systemTitle = computed(() => this.systemContext.getDescriptor(this.currentSystem()).title);

  readonly navItems = computed<SystemNavItem[]>(() => {
    const items = this.systemContext.getDescriptor(this.currentSystem()).nav;
    const logged = this.isLogged();
    const admin = this.isAdmin();
    return items.filter((item) => {
      if (item.requiresAuth && !logged) return false;
      if (item.visibleFor === 'admin' && !admin) return false;
      if (item.visibleFor === 'member' && admin) return false;
      return true;
    });
  });

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const f = (user.firstName || '').trim();
    const l = (user.lastName || '').trim();
    return ((f.charAt(0) || '') + (l.charAt(0) || '')).toUpperCase();
  });

  readonly fullName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const parts = [user.lastName, user.firstName].filter((p) => !!p && p.trim().length > 0);
    return parts.join(' ');
  });

  readonly avatarPalette = computed(() => {
    const user = this.currentUser();
    if (!user) return { bg: '#e5e7eb', fg: '#6b7280' };
    const seed = String(user.id ?? '0') + (user.email || '');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    return {
      bg: `hsl(${hue} 70% 88%)`,
      fg: `hsl(${hue} 55% 35%)`,
    };
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        void this.systemNotificationService.initialize().catch((error) => {
          console.error('Failed to initialize notifications', error);
        });
      } else {
        this.systemNotificationService.clear();
      }
    });
  }

  ngOnInit() {
    this.authService.getCurrentUser().catch((error) => {
      console.error('Failed to load user data', error);
    });
  }

  toggleSystem(): void {
    const next: SystemKey = this.currentSystem() === 'forum' ? 'podium' : 'forum';
    this.setSystem(next);
  }

  setSystem(key: SystemKey): void {
    this.systemContext.setCurrent(key);
    this.closeMobileMenu();
    this.closeUserMenu();
    this.router.navigate([this.systemContext.getRootPath(key)]);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.closeNotificationsMenu();
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  async toggleNotificationsMenu(): Promise<void> {
    this.closeUserMenu();
    const next = !this.isNotificationsOpen();
    this.isNotificationsOpen.set(next);
    if (next) {
      await this.systemNotificationService.openPanel();
    } else {
      this.systemNotificationService.closePanel();
    }
  }

  closeNotificationsMenu(): void {
    this.isNotificationsOpen.set(false);
    this.systemNotificationService.closePanel();
  }

  goTo(link: string): void {
    this.closeMobileMenu();
    this.closeUserMenu();
    this.closeNotificationsMenu();
    this.router.navigate([link]);
  }

  async openNotification(notification: SystemNotification): Promise<void> {
    this.closeNotificationsMenu();
    if (!notification.readAt) {
      await this.systemNotificationService.markRead(notification.id);
    }
    if (notification.jobId) {
      await this.router.navigate([`/podium/job/${notification.jobId}`]);
      return;
    }
    if (notification.conferenceId) {
      await this.router.navigate([`/podium/conference/${notification.conferenceId}`]);
    }
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.systemNotificationService.markAllRead();
  }

  logout(): void {
    this.closeUserMenu();
    this.closeNotificationsMenu();
    this.httpService.logout().then(() => {
      this.authSessionService.clearSession();
      this.authService.clearData();
      this.systemNotificationService.clear();
      this.router.navigate(['/auth']);
    });
  }
}

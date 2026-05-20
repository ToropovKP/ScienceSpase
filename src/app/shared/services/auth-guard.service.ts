import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { User } from '../../entities/shared/user/model/user';

export interface AuthCheckResult {
  canProceed: boolean;
  reason?: 'not_logged_in';
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  canProceedWithAction(user: User | null | undefined): AuthCheckResult {
    if (!user) {
      this.notificationService.showLoginRequired();
      return { canProceed: false, reason: 'not_logged_in' };
    }

    return { canProceed: true };
  }

  executeIfAuthorized(user: User | null | undefined, action: () => void): boolean {
    const result = this.canProceedWithAction(user);
    if (result.canProceed) {
      action();
      return true;
    }
    return false;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER');
  }

  isLoggedIn(): boolean {
    return this.authService.getUserInfo() != null;
  }

  getCurrentUser(): User | null {
    return this.authService.getUserInfo();
  }
}

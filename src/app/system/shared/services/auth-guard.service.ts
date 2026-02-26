import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { User } from '../model/user';

export interface AuthCheckResult {
  canProceed: boolean;
  reason?: 'not_logged_in' | 'not_verified';
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

  /**
   * Проверяет, может ли пользователь выполнить действие, требующее авторизации и верификации
   * @param user Текущий пользователь
   * @returns Результат проверки
   */
  canProceedWithAction(user: User | null | undefined): AuthCheckResult {
    if (!user) {
      this.notificationService.showLoginRequired();
      return { canProceed: false, reason: 'not_logged_in' };
    }

    if (!user.verified) {
      this.notificationService.showAccountNotVerified();
      return { canProceed: false, reason: 'not_verified' };
    }

    return { canProceed: true };
  }

  /**
   * Проверяет и выполняет действие, если пользователь авторизован и верифицирован
   * @param user Текущий пользователь
   * @param action Действие для выполнения
   * @returns true, если действие выполнено, false - если нет
   */
  executeIfAuthorized(user: User | null | undefined, action: () => void): boolean {
    const result = this.canProceedWithAction(user);
    if (result.canProceed) {
      action();
      return true;
    }
    return false;
  }

  /**
   * Проверяет, является ли пользователь администратором
   */
  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  /**
   * Проверяет, является ли пользователь модератором
   */
  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  /**
   * Проверяет, является ли пользователь рецензентом
   */
  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER');
  }

  /**
   * Проверяет, авторизован ли пользователь
   */
  isLoggedIn(): boolean {
    return this.authService.getUserInfo() != null;
  }

  /**
   * Получает текущего пользователя
   */
  getCurrentUser(): User | null {
    return this.authService.getUserInfo();
  }
}


import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private messageService: MessageService) { }

  showError(detail?: string, summary: string = 'Возникла непредвиденная ошибка') {
    this.messageService.add({
      severity: 'error',
      summary,
      detail: detail || 'Ошибка на стороне сервера',
      life: 3000
    });
  }

  showWarning(summary: string, detail: string) {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: 3000
    });
  }

  showSuccess(summary: string, detail: string) {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: 3000
    });
  }

  showInfo(summary: string, detail: string) {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: 3000
    });
  }

  showServerError() {
    this.showError('Ошибка на стороне сервера');
  }

  showLoginRequired() {
    this.showWarning('Отклонено', 'Необходимо выполнить вход в аккаунт');
  }

  showAccountNotVerified() {
    this.showWarning('Подтвердите аккаунт', 'Проверьте почту и подтвердите свой аккаунт');
  }

  showRegistrationSuccess() {
    this.showSuccess('Регистрация прошла успешно', 'На вашу почту отправлено письмо с подтверждением');
  }

  showRestorePasswordSuccess() {
    this.showSuccess('Успешно', 'Письмо с инструкцией отправлено на почту');
  }

  showRestorePasswordTooManyRequests() {
    this.showError('Отклонено', 'Слишком много запросов на сброс пароля. Попробуйте позже');
  }

  showRestorePasswordFailed() {
    this.showError('Возникла непредвиденная ошибка', 'Не удалось отправить письмо');
  }

  showFileDownloadError() {
    this.showError('Возникла непредвиденная ошибка', 'Не удалось скачать файл');
  }
}

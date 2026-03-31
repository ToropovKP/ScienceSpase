import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { User } from '../../../entities/user/model/user';

@Component({
  selector: 'app-resend-verification-banner',
  templateUrl: './resend-verification-banner.component.html',
  styleUrls: ['./resend-verification-banner.component.css'],
  imports: [CommonModule]
})
export class ResendVerificationBannerComponent {
  @Input() currentUser!: User;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  sendRepeatLink() {
    this.httpService.sendRepeatLink().then((data) => {
      if (data) {
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Письмо отправлено',
          life: 3000
        });
        return null;
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Ошибка',
          detail: 'Ваш аккаунт уже подтвержден',
          life: 3000
        });
        return this.authService.getCurrentUser();
      }
    }).then((user) => {
      if (user) {
        this.currentUser = user;
      }
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось отправить письмо',
        life: 3000
      });
    });
  }
}

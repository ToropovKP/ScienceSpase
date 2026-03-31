import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { User } from '../../../entities/user/model/user';
import { HttpService } from '../../../shared/services/http.service';

@Component({
  selector: 'app-manage-user-access-actions',
  templateUrl: './manage-user-access-actions.component.html',
  styleUrls: ['./manage-user-access-actions.component.css'],
  imports: [CommonModule]
})
export class ManageUserAccessActionsComponent {
  @Input({ required: true }) profileUser!: User;

  constructor(
    private confirmationService: ConfirmationService,
    private httpService: HttpService,
    private messageService: MessageService
  ) {}

  confirmRole(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить роль?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        const role = this.profileUser.role === 'MEMBER' ? 'MODERATOR' : 'MEMBER';
        this.httpService.changeUserRole(String(this.profileUser.id), role).then((data) => {
          if (data) {
            this.profileUser.role = role;
            this.messageService.add({ severity: 'success', summary: 'Успешно', detail: 'Роль изменена', life: 3000 });
          }
        }).catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось изменить роль',
            life: 3000
          });
        });
      },
      reject: () => {
        this.messageService.add({ severity: 'secondary', summary: 'Отменено', detail: 'Действие отменено', life: 3000 });
      }
    });
  }

  confirmStatus(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить статус?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        const status = this.profileUser.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        this.httpService.changeUserStatus(String(this.profileUser.id), status).then((data) => {
          if (data) {
            this.profileUser.status = status;
            this.messageService.add({ severity: 'success', summary: 'Успешно', detail: 'Статус изменен', life: 3000 });
          }
        }).catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось изменить статус',
            life: 3000
          });
        });
      },
      reject: () => {
        this.messageService.add({ severity: 'secondary', summary: 'Отменено', detail: 'Действие отменено', life: 3000 });
      }
    });
  }
}

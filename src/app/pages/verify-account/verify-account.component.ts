import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpService } from '../../shared/services/http.service';
import { AuthService } from '../../shared/services/auth.service';

/** Ссылка из письма `/verify-email?token=…` — подтверждение и переход в каталог. */
@Component({
  selector: 'app-verify',
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.css',
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
})
export class VerifyAccountComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private messageService: MessageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      void this.router.navigate(['/conferences']);
      return;
    }

    this.httpService
      .verifyAccount(token)
      .then(() => this.authService.getCurrentUser())
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Готово',
          detail: 'Почта подтверждена.',
          life: 4000,
        });
        void this.router.navigate(['/conferences']);
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось подтвердить почту. Ссылка могла устареть.',
          life: 5000,
        });
        void this.router.navigate(['/conferences']);
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../../shared/services/http.service';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { passwordMatchValidator } from '../../shared/validators/password.match.validator';
import { Button } from 'primeng/button';
import { IftaLabel } from 'primeng/iftalabel';
import { Password } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-restore-password',
  templateUrl: './restore-password.component.html',
  styleUrls: ['./restore-password.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Button, IftaLabel, Password, ToastModule],
  providers: [MessageService],
})
export class RestorePasswordComponent implements OnInit {
  formRestore!: FormGroup;
  /** Есть `sessionId` после проверки кода на `/auth/recover`. */
  sessionId: string | null = null;
  loading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    const sid = this.route.snapshot.queryParamMap.get('sessionId');
    this.sessionId = sid && sid.length > 0 ? sid : null;
    this.route.queryParams.pipe(map((e) => e['sessionId'] ?? null)).subscribe((q) => {
      const next = typeof q === 'string' && q.length > 0 ? q : null;
      this.sessionId = next;
    });
  }

  initializeForms(): void {
    this.formRestore = this.formBuilder.group(
      {
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  sendNewPassword(): void {
    if (!this.sessionId || this.formRestore.invalid) {
      return;
    }
    this.loading = true;
    const password = this.formRestore.value.password as string;
    this.httpService
      .restorePasswordWithSession(this.sessionId, password)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пароль успешно изменён. Войдите с новым паролем.',
          life: 4000,
        });
        void this.router.navigate(['/auth']);
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось сменить пароль. Запросите код заново.',
          life: 4000,
        });
      })
      .finally(() => {
        this.loading = false;
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { passwordMatchValidator } from '../../shared/validators/password.match.validator';
import { HttpService } from '../../shared/services/http.service';
import { ButtonModule } from 'primeng/button';
import {
  PasswordWithConfirmFormComponent,
  PASSWORD_HINT_RECOVERY,
  PASSWORD_MISMATCH_RECOVERY,
  REGISTRATION_PASSWORD_PATTERN,
} from '../../features/auth';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

/** Новый пароль после кода восстановления (`/auth/set-password?sessionId=`). */
@Component({
  selector: 'app-auth-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, PasswordWithConfirmFormComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './auth-set-password.component.html',
  styleUrls: ['./auth.component.css', './auth-set-password.component.css'],
})
export class AuthSetPasswordComponent implements OnInit {
  form!: FormGroup;
  sessionId: string | null = null;
  loading = false;

  readonly passwordHintRecovery = PASSWORD_HINT_RECOVERY;
  readonly passwordMismatchRecovery = PASSWORD_MISMATCH_RECOVERY;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private httpService: HttpService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(REGISTRATION_PASSWORD_PATTERN),
        ]),
        confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      },
      { validators: passwordMatchValidator },
    );
    this.sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    this.route.queryParamMap.subscribe((m) => {
      const s = m.get('sessionId');
      this.sessionId = s && s.length > 0 ? s : null;
    });
  }

  get passwordControl(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmedPasswordControl(): FormControl {
    return this.form.get('confirmedPassword') as FormControl;
  }

  submit(): void {
    if (!this.sessionId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const password = this.form.value.password as string;
    this.httpService
      .restorePasswordWithSession(this.sessionId, password)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Готово',
          detail: 'Пароль изменён. Войдите с новым паролем.',
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

import { Component, DestroyRef, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputOtpModule } from 'primeng/inputotp';
import { MessageModule } from 'primeng/message';
import { EmailFieldComponent } from '../../features/auth/ui/forms/email-field.component';
import { HttpService } from '../../shared/services/http.service';
import { NotificationService } from '../../shared/services/notification.service';

type RecoverStep = 'login' | 'code';

@Component({
  selector: 'app-auth-recover-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    EmailFieldComponent,
    InputOtpModule,
    MessageModule,
  ],
  templateUrl: './auth-recover-password.component.html',
  styleUrl: './auth-recover-password.component.css',
})
export class AuthRecoverPasswordComponent implements OnDestroy {
  @ViewChild('recoverOtpWrap', { read: ElementRef }) private recoverOtpWrap?: ElementRef<HTMLElement>;

  private messageService = inject(MessageService);
  form: FormGroup;
  verificationCodeForm: FormGroup;
  loading = false;
  otpServerInvalid = false;
  /** Письмо уже запрошено — таймер повтора и шаг «назад» с экрана кода */
  emailSent = false;
  /** Шаг макета: логин → ввод кода из письма */
  recoverStep: RecoverStep = 'login';
  formSubmitted = false;
  /** Сессия с бэкенда (`send-restore-code`). */
  private restoreSessionId: string | null = null;

  resendSecondsRemaining = 0;
  private resendIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private httpService: HttpService,
    private notificationService: NotificationService,
  ) {
    this.form = this.formBuilder.group({
      email: new FormControl('', { validators: [Validators.required, Validators.email], updateOn: 'blur' }),
    });
    this.verificationCodeForm = this.formBuilder.group({
      value: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });

    this.verificationCodeForm
      .get('value')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => queueMicrotask(() => this.syncRecoverOtpFilledCellClasses()));
  }

  ngOnDestroy(): void {
    this.clearResendCooldown();
  }

  get resendCountdownLabel(): string {
    const s = Math.max(0, this.resendSecondsRemaining);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  onEnter(): void {
    if (this.recoverStep === 'code') {
      void this.submitContinue();
      return;
    }
    void this.requestLetter();
  }

  cancel(): void {
    void this.router.navigate(['/auth']);
  }

  backFromCode(): void {
    this.otpServerInvalid = false;
    this.restoreSessionId = null;
    this.recoverStep = 'login';
    this.formSubmitted = false;
    this.verificationCodeForm.reset({ value: '' });
  }

  isInvalid(controlName: string): boolean {
    const control = this.verificationCodeForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted));
  }

  otpInvalidVisual(): boolean {
    return this.otpServerInvalid || this.isInvalid('value');
  }

  private syncRecoverOtpFilledCellClasses(): void {
    const root = this.recoverOtpWrap?.nativeElement;
    if (!root) {
      return;
    }
    const otpHost = root.querySelector<HTMLElement>('.p-inputotp, p-inputotp');
    if (!otpHost) {
      return;
    }
    const inputs = otpHost.querySelectorAll<HTMLInputElement>('input');
    const raw = String(this.verificationCodeForm.get('value')?.value ?? '');
    inputs.forEach((el, i) => {
      const ch = raw[i];
      const filled = !!ch && ch.trim() !== '';
      el.classList.toggle('auth__otp-cell--filled', filled);
    });
  }

  showRecoverEmailError(): boolean {
    return this.recoverStep === 'login' && this.emailControl.invalid && this.emailControl.touched;
  }

  recoverEmailErrorMessage(): string {
    if (this.emailControl.hasError('required')) {
      return 'Введите почту';
    }
    if (this.emailControl.hasError('email')) {
      return 'Укажите корректную почту: нужен символ «@», например alex_fedorov@gmail.com';
    }
    return '';
  }

  async requestLetter(): Promise<void> {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched({ onlySelf: true });
      return;
    }

    const isResend = this.emailSent;
    if (!isResend) {
      this.loading = true;
    }

    try {
      const email = String(this.emailControl.value ?? '').trim();
      const res = await this.httpService.sendRestoreCode(email, isResend ? this.restoreSessionId : null);
      if (res.sessionId) {
        this.restoreSessionId = res.sessionId;
      }
      this.emailSent = true;
      this.startResendCooldown();
      if (this.recoverStep === 'login') {
        this.otpServerInvalid = false;
        this.recoverStep = 'code';
        this.verificationCodeForm.reset({ value: '' });
        this.formSubmitted = false;
        queueMicrotask(() => this.syncRecoverOtpFilledCellClasses());
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Письмо отправлено',
        detail: 'Проверьте почту для подтверждения смены пароля.',
        life: 5000,
      });
    } catch (error: unknown) {
      const err = error as { status?: number; error?: { code?: string } };
      if (err?.status === 429) {
        this.notificationService.showRestorePasswordTooManyRequests();
      } else if (err?.status === 404 || err?.error?.code === 'NOT_FOUND') {
        this.messageService.add({
          severity: 'error',
          summary: 'Восстановление',
          detail: 'Пользователь с таким email не найден.',
          life: 5000,
        });
      } else if (err?.status === 403 || err?.error?.code === 'BANNED') {
        this.messageService.add({
          severity: 'error',
          summary: 'Восстановление',
          detail: 'Учётная запись заблокирована.',
          life: 5000,
        });
      } else {
        this.notificationService.showServerError();
      }
    } finally {
      this.loading = false;
    }
  }

  onResendClick(event: Event): void {
    event.preventDefault();
    if (this.resendSecondsRemaining > 0 || this.loading) {
      return;
    }
    void this.requestLetter();
  }

  async submitContinue(): Promise<void> {
    this.formSubmitted = true;
    const otp = this.verificationCodeForm.get('value');
    if (this.verificationCodeForm.invalid) {
      otp?.markAsTouched();
      return;
    }
    if (!this.restoreSessionId) {
      this.notificationService.showServerError();
      return;
    }
    const code = String(otp?.value ?? '').trim();
    this.loading = true;
    this.otpServerInvalid = false;
    try {
      await this.httpService.verifyRestoreCode(this.restoreSessionId, code);
      await this.router.navigate(['/auth/set-password'], {
        queryParams: { sessionId: this.restoreSessionId },
      });
    } catch {
      this.otpServerInvalid = true;
    } finally {
      this.loading = false;
    }
  }

  private startResendCooldown(): void {
    this.clearResendCooldown();
    this.resendSecondsRemaining = 65;
    this.resendIntervalId = setInterval(() => {
      this.resendSecondsRemaining -= 1;
      if (this.resendSecondsRemaining <= 0) {
        this.clearResendCooldown();
        this.resendSecondsRemaining = 0;
      }
    }, 1000);
  }

  private clearResendCooldown(): void {
    if (this.resendIntervalId) {
      clearInterval(this.resendIntervalId);
      this.resendIntervalId = null;
    }
  }
}

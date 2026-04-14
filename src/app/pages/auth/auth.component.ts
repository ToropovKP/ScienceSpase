import { Component, DestroyRef, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { HttpService } from '../../shared/services/http.service';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { EmailFieldComponent } from '../../features/auth/ui/forms/email-field.component';
import { PasswordFieldComponent } from '../../features/auth/ui/forms/password-field.component';
import { PhoneFieldComponent } from '../../features/auth/ui/forms/phone-field.component';
import { InputOtpModule } from 'primeng/inputotp';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { nationalPhoneValidator, PhoneCountryId } from '../../shared/lib/phone-country';
import { accessTokenFromAuthResponse } from '../../shared/lib/auth-token';

type AuthSystem = 'podium' | 'forum';
type RegistrationStep = 'email' | 'code' | 'password' | 'profile';
type LoginPhase = 'credentials' | 'twoFactor';

/** Не менее 8 символов, верхний и нижний регистр, спецсимвол (макет). */
const REGISTRATION_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    EmailFieldComponent,
    PasswordFieldComponent,
    PhoneFieldComponent,
    InputOtpModule,
    FormsModule,
    MessageModule,
    ToastModule,
    InputTextModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnDestroy {
  @ViewChild('authOtpWrap', { read: ElementRef }) private authOtpWrap?: ElementRef<HTMLElement>;

  selectedSystem: AuthSystem = 'forum';
  loginForm!: FormGroup;
  verificationCodeForm!: FormGroup;

  /** После проверки кода на бэкенде: подсветка ошибки и текст из макета. */
  otpServerInvalid = false;

  invalidLogin = false;
  userBlockedLogin = false;
  /** После логина/пароля — ввод кода из приложения 2FA. */
  loginPhase: LoginPhase = 'credentials';
  /** Временный JWT для `POST .../auth/2fa/verify`. */
  private twoFactorTempToken: string | null = null;
  loading = false;
  isRegistration = false;
  /** Поток регистрации: email → код (отправка через API) → пароль → профиль */
  registrationStep: RegistrationStep = 'email';
  /** Сессия OTP с бэкенда (нужна для повторной отправки кода). */
  private registrationSessionId: string | null = null;
  formSubmitted = false;
  messageService = inject(MessageService);

  resendSecondsRemaining = 0;
  private resendIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly destroyRef = inject(DestroyRef);

  private readonly passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const pass = parent.get('password')?.value;
    if (!control.value || pass === undefined) {
      return null;
    }
    return control.value === pass ? null : { mismatch: true };
  };

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', { validators: [Validators.required, Validators.email], updateOn: 'blur' }),
      password: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], updateOn: 'blur' }),
      code: new FormControl(''),
      passwordConfirm: new FormControl('', { updateOn: 'blur' }),
      acceptTerms: new FormControl(false),
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      middleName: new FormControl(''),
      countryCode: new FormControl<PhoneCountryId>('RU', { nonNullable: true }),
      phoneNumber: new FormControl(''),
    });

    this.verificationCodeForm = this.formBuilder.group({
      value: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });

    this.verificationCodeForm
      .get('value')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => queueMicrotask(() => this.syncAuthOtpFilledCellClasses()));

    this.phoneCountryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.phoneControl.updateValueAndValidity({ emitEvent: false });
      });

    this.passwordControl.valueChanges.subscribe(() => {
      this.passwordConfirmControl.updateValueAndValidity({ emitEvent: false });
      if (!this.isRegistration) {
        this.invalidLogin = false;
      }
    });

    this.emailControl.valueChanges.subscribe(() => {
      if (!this.isRegistration) {
        this.invalidLogin = false;
      }
    });
  }

  onLoginCredentialFocus(): void {
    if (!this.isRegistration) {
      this.invalidLogin = false;
    }
  }

  onAuthEnter(): void {
    if (!this.isRegistration) {
      if (this.loginPhase === 'twoFactor') {
        void this.submitTwoFactor();
        return;
      }
      void this.login();
      return;
    }
    switch (this.registrationStep) {
      case 'email':
        void this.requestEmail();
        break;
      case 'code':
        this.submitCode();
        break;
      case 'password':
        this.submitPasswordStep();
        break;
      case 'profile':
        void this.submitRegistration();
        break;
    }
  }

  /** Отмена: с шага кода — назад к email; иначе выход на экран входа. */
  cancelRegistration(): void {
    if (this.registrationStep === 'code') {
      this.backToEmailStep();
      return;
    }
    this.switchRegistration();
  }

  switchRegistration(): void {
    this.isRegistration = !this.isRegistration;
    this.registrationStep = 'email';
    this.loginPhase = 'credentials';
    this.twoFactorTempToken = null;
    this.verificationCodeForm.reset({ value: '' });
    this.otpServerInvalid = false;
    this.invalidLogin = false;
    this.userBlockedLogin = false;
    this.loading = false;
    this.formSubmitted = false;
    this.clearResendCooldown();
    this.resendSecondsRemaining = 0;
    this.verificationCodeForm.reset({ value: '' });
    this.clearRegistrationPasswordFields();
    this.clearRegistrationProfileFields();
    this.registrationSessionId = null;

    if (this.isRegistration) {
      this.passwordControl.clearValidators();
      this.passwordControl.setValue('');
      this.codeControl.clearValidators();
      this.codeControl.setValue('');
    } else {
      this.passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      this.codeControl.clearValidators();
      this.codeControl.setValue('');
    }

    this.passwordControl.updateValueAndValidity();
    this.codeControl.updateValueAndValidity();
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

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.emailControl.markAsTouched();
      this.passwordControl.markAsTouched();
      return;
    }

    this.loading = true;
    try {
      const data = await this.httpService.login({
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      });
      this.invalidLogin = false;
      this.userBlockedLogin = false;
      if (data.status === 'two_factor_required') {
        const temp = accessTokenFromAuthResponse(data);
        if (!temp) {
          this.notificationService.showServerError();
          return;
        }
        this.twoFactorTempToken = temp;
        this.loginPhase = 'twoFactor';
        this.verificationCodeForm.reset({ value: '' });
        this.formSubmitted = false;
        queueMicrotask(() => this.syncAuthOtpFilledCellClasses());
        return;
      }
      const token = accessTokenFromAuthResponse(data);
      if (data.status === 'authenticated' && token) {
        localStorage.setItem('token', token);
        await this.authService.getCurrentUser();
        this.loginForm.reset();
        await this.router.navigate(['/conferences']);
        return;
      }
      this.notificationService.showServerError();
    } catch (error: unknown) {
      const err = error as { error?: { code?: string } };
      if (err?.error?.['code'] === 'USER_DOES_NOT_EXISTS') {
        this.invalidLogin = true;
        this.userBlockedLogin = false;
      } else if (err?.error?.['code'] === 'BANNED') {
        this.invalidLogin = false;
        this.userBlockedLogin = true;
      } else {
        this.notificationService.showServerError();
      }
    } finally {
      this.loading = false;
    }
  }

  async submitTwoFactor(): Promise<void> {
    if (!this.twoFactorTempToken) {
      return;
    }
    this.formSubmitted = true;
    const otp = this.verificationCodeForm.get('value');
    if (this.verificationCodeForm.invalid) {
      otp?.markAsTouched();
      return;
    }
    const code = String(otp?.value ?? '').trim();
    this.loading = true;
    try {
      const data = await this.httpService.verifyTwoFactor(code, this.twoFactorTempToken);
      const token = accessTokenFromAuthResponse(data);
      if (data.status === 'authenticated' && token) {
        localStorage.setItem('token', token);
        this.twoFactorTempToken = null;
        this.loginPhase = 'credentials';
        await this.authService.getCurrentUser();
        this.loginForm.reset();
        this.verificationCodeForm.reset({ value: '' });
        await this.router.navigate(['/conferences']);
      } else {
        this.notificationService.showServerError();
      }
    } catch {
      this.notificationService.showError('Проверьте код и попробуйте снова.', 'Неверный код 2FA');
    } finally {
      this.loading = false;
    }
  }

  backFromTwoFactor(): void {
    this.loginPhase = 'credentials';
    this.twoFactorTempToken = null;
    this.verificationCodeForm.reset({ value: '' });
    this.formSubmitted = false;
  }

  /** Отправка кода на email при регистрации (`POST .../auth/send-verify-code`). */
  async requestEmail(): Promise<void> {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    const email = String(this.emailControl.value ?? '').trim();
    const isResend = this.registrationStep === 'code';

    if (!isResend) {
      this.loading = true;
    }

    try {
      const response = await this.httpService.sendRegistrationVerificationCode(
        email,
        isResend ? this.registrationSessionId : null,
      );
      if (response.sessionId) {
        this.registrationSessionId = response.sessionId;
      }

      this.registrationStep = 'code';
      this.otpServerInvalid = false;
      this.verificationCodeForm.reset({ value: '' });
      this.formSubmitted = false;
      this.codeControl.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
      ]);
      this.codeControl.updateValueAndValidity();
      this.startResendCooldown();
      queueMicrotask(() => this.syncAuthOtpFilledCellClasses());

      if (isResend) {
        this.messageService.add({
          severity: 'success',
          summary: 'Письмо отправлено',
          detail: 'Проверьте почту для ввода кода.',
          life: 5000,
        });
      }
    } catch (error: unknown) {
      this.handleSendRegistrationCodeError(error);
    } finally {
      this.loading = false;
    }
  }

  private handleSendRegistrationCodeError(error: unknown): void {
    const err = error as { status?: number; error?: { code?: string } };
    if (err?.status === 429) {
      this.notificationService.showError('Попробуйте позже.', 'Слишком много запросов');
      return;
    }
    const code = err?.error?.code;
    if (code === 'USER_EXISTS') {
      this.messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Пользователь с таким email уже зарегистрирован.',
        life: 5000,
      });
      return;
    }
    if (code === 'BANNED') {
      this.messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Регистрация невозможна: учётная запись заблокирована.',
        life: 5000,
      });
      return;
    }
    this.notificationService.showServerError();
  }

  /** Проверка кода регистрации на бэкенде, затем шаг пароля. */
  async submitCode(): Promise<void> {
    this.formSubmitted = true;
    const otp = this.verificationCodeForm.get('value');
    if (this.verificationCodeForm.invalid) {
      otp?.markAsTouched();
      return;
    }
    if (!this.registrationSessionId) {
      this.notificationService.showServerError();
      return;
    }
    const code = String(otp?.value ?? '').trim();
    this.loading = true;
    try {
      await this.httpService.verifySignupCode(this.registrationSessionId, code);
      this.otpServerInvalid = false;
      this.codeControl.setValue(code);
      this.registrationStep = 'password';
      this.applyRegistrationPasswordValidators();
    } catch {
      this.otpServerInvalid = true;
    } finally {
      this.loading = false;
    }
  }

  submitPasswordStep(): void {
    this.passwordControl.markAsTouched();
    this.passwordConfirmControl.markAsTouched();
    this.acceptTermsControl.markAsTouched();
    if (this.passwordControl.invalid || this.passwordConfirmControl.invalid || this.acceptTermsControl.invalid) {
      return;
    }
    this.registrationStep = 'profile';
    this.applyRegistrationProfileValidators();
  }

  async submitRegistration(): Promise<void> {
    this.lastNameControl.markAsTouched();
    this.firstNameControl.markAsTouched();
    this.phoneControl.markAsTouched();

    if (this.lastNameControl.invalid || this.firstNameControl.invalid || this.phoneControl.invalid) {
      return;
    }
    await this.registerOnServer();
  }

  /** Выход из мастера регистрации без создания учётной записи (бэкенд требует ФИО и телефон). */
  skipRegistrationProfile(): void {
    this.switchRegistration();
    this.notificationService.showInfo(
      'Регистрация не завершена',
      'Вы можете создать аккаунт позже.',
    );
  }

  private async registerOnServer(): Promise<void> {
    this.loading = true;
    try {
      const email = String(this.emailControl.value ?? '').trim();
      const password = this.passwordControl.value as string;
      if (!this.registrationSessionId) {
        this.notificationService.showServerError();
        return;
      }

      const signupRes = await this.httpService.signup({
        sessionId: this.registrationSessionId,
        password,
      });
      const token = accessTokenFromAuthResponse(signupRes);
      if (!token) {
        this.notificationService.showServerError();
        return;
      }
      localStorage.setItem('token', token);
      await this.authService.getCurrentUser();

      try {
        await this.httpService.updateUserInfo({
          firstName: String(this.firstNameControl.value ?? '').trim(),
          lastName: String(this.lastNameControl.value ?? '').trim(),
          middleName: String(this.middleNameControl.value ?? '').trim(),
          countryCode: this.phoneCountryControl.value,
          phoneNumber: String(this.phoneControl.value ?? '').replace(/\D/g, ''),
          organization: '',
          academicDegree: '',
          academicTitle: '',
          orcId: '',
          rincId: '',
        });
        await this.authService.getCurrentUser();
        this.notificationService.showSuccess('Регистрация', 'Аккаунт создан, данные профиля сохранены.');
      } catch {
        this.notificationService.showWarning(
          'Профиль',
          'Аккаунт создан. Заполните ФИО и телефон в разделе профиля.',
        );
      }
      await this.router.navigate(['/conferences']);
      this.resetAfterSuccessfulRegistration();
    } catch (error: unknown) {
      this.handleRegistrationError(error);
    } finally {
      this.loading = false;
    }
  }

  private resetAfterSuccessfulRegistration(): void {
    this.isRegistration = false;
    this.registrationSessionId = null;
    this.loginPhase = 'credentials';
    this.twoFactorTempToken = null;
    this.registrationStep = 'email';
    this.otpServerInvalid = false;
    this.invalidLogin = false;
    this.userBlockedLogin = false;
    this.formSubmitted = false;
    this.clearResendCooldown();
    this.resendSecondsRemaining = 0;
    this.verificationCodeForm.reset({ value: '' });
    this.clearRegistrationPasswordFields();
    this.clearRegistrationProfileFields();
    this.codeControl.clearValidators();
    this.codeControl.setValue('');
    this.passwordControl.clearValidators();
    this.passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
    this.passwordControl.updateValueAndValidity();
    this.codeControl.updateValueAndValidity();
    this.loginForm.reset();
  }

  private handleRegistrationError(error: unknown): void {
    const err = error as { error?: { code?: string }; status?: number; message?: string };
    const code = err?.error?.code;
    if (code === 'USER_EXISTS') {
      this.messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Пользователь с таким email уже зарегистрирован.',
        life: 5000,
      });
      return;
    }
    if (code === 'BANNED') {
      this.messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Регистрация невозможна: учётная запись заблокирована.',
        life: 5000,
      });
      return;
    }
    this.notificationService.showServerError();
  }

  onResendCode(event: Event): void {
    event.preventDefault();
    if (this.resendSecondsRemaining > 0 || this.loading) {
      return;
    }
    this.requestEmail();
  }

  private applyRegistrationPasswordValidators(): void {
    this.passwordControl.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(REGISTRATION_PASSWORD_PATTERN),
    ]);
    this.passwordConfirmControl.setValidators([Validators.required, this.passwordMatchValidator]);
    this.acceptTermsControl.setValidators([Validators.requiredTrue]);
    this.passwordControl.updateValueAndValidity();
    this.passwordConfirmControl.updateValueAndValidity();
    this.acceptTermsControl.updateValueAndValidity();
  }

  private clearRegistrationPasswordFields(): void {
    this.passwordConfirmControl.clearValidators();
    this.acceptTermsControl.clearValidators();
    this.passwordConfirmControl.setValue('');
    this.acceptTermsControl.setValue(false);
    this.passwordConfirmControl.updateValueAndValidity();
    this.acceptTermsControl.updateValueAndValidity();
  }

  private applyRegistrationProfileValidators(): void {
    this.lastNameControl.setValidators([Validators.required, Validators.minLength(2)]);
    this.firstNameControl.setValidators([Validators.required, Validators.minLength(2)]);
    this.middleNameControl.clearValidators();
    this.phoneControl.setValidators([
      Validators.required,
      nationalPhoneValidator(() => this.phoneCountryControl.value),
    ]);
    this.lastNameControl.updateValueAndValidity();
    this.firstNameControl.updateValueAndValidity();
    this.middleNameControl.updateValueAndValidity();
    this.phoneControl.updateValueAndValidity();
  }

  private clearRegistrationProfileFields(): void {
    this.lastNameControl.clearValidators();
    this.firstNameControl.clearValidators();
    this.middleNameControl.clearValidators();
    this.phoneControl.clearValidators();
    this.lastNameControl.setValue('');
    this.firstNameControl.setValue('');
    this.middleNameControl.setValue('');
    this.phoneControl.setValue('');
    this.phoneCountryControl.setValue('RU');
    this.lastNameControl.updateValueAndValidity();
    this.firstNameControl.updateValueAndValidity();
    this.middleNameControl.updateValueAndValidity();
    this.phoneControl.updateValueAndValidity();
    this.phoneCountryControl.updateValueAndValidity();
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

  isInvalid(controlName: string): boolean {
    const control = this.verificationCodeForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted));
  }

  otpInvalidVisual(): boolean {
    return this.otpServerInvalid || this.isInvalid('value');
  }

  private syncAuthOtpFilledCellClasses(): void {
    const root = this.authOtpWrap?.nativeElement;
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

  backToEmailStep(): void {
    this.otpServerInvalid = false;
    this.registrationSessionId = null;
    this.registrationStep = 'email';
    this.clearResendCooldown();
    this.resendSecondsRemaining = 0;
    this.verificationCodeForm.reset({ value: '' });
    this.formSubmitted = false;
    this.codeControl.clearValidators();
    this.codeControl.setValue('');
    this.codeControl.updateValueAndValidity();
  }

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  get passwordConfirmControl(): FormControl {
    return this.loginForm.get('passwordConfirm') as FormControl;
  }

  get acceptTermsControl(): FormControl {
    return this.loginForm.get('acceptTerms') as FormControl;
  }

  get codeControl(): FormControl {
    return this.loginForm.get('code') as FormControl;
  }

  get firstNameControl(): FormControl {
    return this.loginForm.get('firstName') as FormControl;
  }

  get lastNameControl(): FormControl {
    return this.loginForm.get('lastName') as FormControl;
  }

  get middleNameControl(): FormControl {
    return this.loginForm.get('middleName') as FormControl;
  }

  get phoneCountryControl(): FormControl<PhoneCountryId> {
    return this.loginForm.get('countryCode') as FormControl<PhoneCountryId>;
  }

  get phoneControl(): FormControl {
    return this.loginForm.get('phoneNumber') as FormControl;
  }

  showPasswordHintError(): boolean {
    const c = this.passwordControl;
    return !!(c.invalid && c.touched);
  }

  showPasswordConfirmError(): boolean {
    const c = this.passwordConfirmControl;
    return !!(c.invalid && c.touched);
  }

  showAcceptTermsError(): boolean {
    const c = this.acceptTermsControl;
    return !!(c.invalid && c.touched);
  }

  /** Ошибки логина (клиент): после blur, без подсветки при ошибке сервера «неверный пароль». */
  showAuthEmailClientError(): boolean {
    const c = this.emailControl;
    if (!c.touched || !c.invalid) {
      return false;
    }
    if (!this.isRegistration && this.invalidLogin) {
      return false;
    }
    if (this.isRegistration && this.registrationStep !== 'email') {
      return false;
    }
    return true;
  }

  authEmailErrorMessage(): string {
    const c = this.emailControl;
    if (c.hasError('required')) {
      return 'Введите логин';
    }
    if (c.hasError('email')) {
      return 'Введен некорректный логин: логин должен содержать символ «@», например alex_fedorov@gmail.com';
    }
    return '';
  }

  /** Ошибки пароля на входе (клиент), после blur. */
  showAuthPasswordClientError(): boolean {
    if (this.isRegistration || this.invalidLogin || this.loginPhase === 'twoFactor') {
      return false;
    }
    const c = this.passwordControl;
    return !!(c.touched && c.invalid);
  }

  authPasswordErrorMessage(): string {
    const c = this.passwordControl;
    if (c.hasError('required')) {
      return 'Введите пароль';
    }
    if (c.hasError('minlength')) {
      return 'Минимум 8 символов';
    }
    return '';
  }

  showProfileFieldError(control: FormControl): boolean {
    return control.invalid && control.touched;
  }
}

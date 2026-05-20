import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { EmailFieldComponent } from '../../../features/shared/auth/ui/forms/email-field.component';
import { PhoneFieldComponent } from '../../../features/shared/auth/ui/forms/phone-field.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PhoneCountryId } from '../../../shared/lib/phone-country';
import { passwordMatchValidator } from '../../../shared/validators/password.match.validator';
import { PasswordPairFormComponent, PASSWORD_COMPLEXITY_PATTERN } from '../../../features/shared/password-pair';
import { PasswordFieldComponent } from '../../../features/shared/password-field';
import { OtpCodeInputComponent } from '../../../features/shared/otp-code';
import { AuthOtpFlowService } from '../../../features/shared/auth-flow/model/auth-otp-flow.service';
import { AuthLoginFlowService } from '../../../features/shared/auth-flow/model/auth-login-flow.service';
import { AuthRecoverFlowService } from '../../../features/shared/auth-flow/model/auth-recover-flow.service';
import { AuthRegistrationFlowService } from '../../../features/shared/auth-flow/model/auth-registration-flow.service';
import { AuthPageStateFacadeService } from '../../../features/shared/auth-flow/model/auth-page-state-facade.service';
import { AuthResendBlockComponent } from '../../../features/shared/auth-resend';
import { AuthSessionService } from '../../../shared/services/auth-session.service';

type AuthSystem = 'podium' | 'forum';
type AuthView = 'auth' | 'recover' | 'setPassword';
type RegistrationStep = 'email' | 'code' | 'password' | 'profile';
type LoginPhase = 'credentials' | 'twoFactor';
type RecoverStep = 'login' | 'code';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    EmailFieldComponent,
    PasswordFieldComponent,
    PasswordPairFormComponent,
    OtpCodeInputComponent,
    AuthResendBlockComponent,
    PhoneFieldComponent,
    FormsModule,
    ToastModule,
    InputTextModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit, OnDestroy {
  /** Выбор на экране входа; после успешной аутентификации сохраняется в `localStorage` (ключ `authPreferredSystem`). */
  selectedSystem: AuthSystem = 'forum';
  authView: AuthView = 'auth';
  loginForm!: FormGroup;
  verificationCodeForm!: FormGroup;
  recoverForm!: FormGroup;
  recoverCodeForm!: FormGroup;
  setPasswordForm!: FormGroup;
  emailControl!: FormControl;
  passwordControl!: FormControl;
  passwordConfirmControl!: FormControl;
  acceptTermsControl!: FormControl;
  codeControl!: FormControl;
  verificationOtpControl!: FormControl;
  recoverEmailControl!: FormControl;
  recoverOtpControl!: FormControl;
  setPasswordControl!: FormControl;
  setPasswordConfirmControl!: FormControl;
  firstNameControl!: FormControl;
  lastNameControl!: FormControl;
  middleNameControl!: FormControl;
  phoneCountryControl!: FormControl<PhoneCountryId>;
  phoneControl!: FormControl;
  recoverStep: RecoverStep = 'login';
  emailSent = false;
  private restoreSessionId: string | null = null;
  setPasswordSessionId: string | null = null;

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
  /** Регистрация: email → код → пароль → signup → опционально профиль */
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
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private authOtpFlowService: AuthOtpFlowService,
    private authLoginFlowService: AuthLoginFlowService,
    private authRecoverFlowService: AuthRecoverFlowService,
    private authRegistrationFlowService: AuthRegistrationFlowService,
    private authPageStateFacadeService: AuthPageStateFacadeService,
    private authSessionService: AuthSessionService,
  ) {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', { validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { validators: [Validators.required, Validators.minLength(8)] }),
      code: new FormControl(''),
      passwordConfirm: new FormControl(''),
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
    this.recoverForm = this.formBuilder.group({
      email: new FormControl('', { validators: [Validators.required, Validators.email] }),
    });
    this.recoverCodeForm = this.formBuilder.group({
      value: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
    this.setPasswordForm = this.formBuilder.group(
      {
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PASSWORD_COMPLEXITY_PATTERN),
        ]),
        confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      },
      { validators: passwordMatchValidator },
    );
    this.emailControl = this.loginForm.get('email') as FormControl;
    this.passwordControl = this.loginForm.get('password') as FormControl;
    this.passwordConfirmControl = this.loginForm.get('passwordConfirm') as FormControl;
    this.acceptTermsControl = this.loginForm.get('acceptTerms') as FormControl;
    this.codeControl = this.loginForm.get('code') as FormControl;
    this.verificationOtpControl = this.verificationCodeForm.get('value') as FormControl;
    this.recoverEmailControl = this.recoverForm.get('email') as FormControl;
    this.recoverOtpControl = this.recoverCodeForm.get('value') as FormControl;
    this.setPasswordControl = this.setPasswordForm.get('password') as FormControl;
    this.setPasswordConfirmControl = this.setPasswordForm.get('confirmedPassword') as FormControl;
    this.firstNameControl = this.loginForm.get('firstName') as FormControl;
    this.lastNameControl = this.loginForm.get('lastName') as FormControl;
    this.middleNameControl = this.loginForm.get('middleName') as FormControl;
    this.phoneCountryControl = this.loginForm.get('countryCode') as FormControl<PhoneCountryId>;
    this.phoneControl = this.loginForm.get('phoneNumber') as FormControl;

    this.phoneCountryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.phoneControl.updateValueAndValidity({ emitEvent: false });
      });

    this.passwordControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.passwordConfirmControl.updateValueAndValidity({ emitEvent: false });
        if (!this.isRegistration) {
          this.invalidLogin = false;
        }
      });

    this.emailControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isRegistration) {
          this.invalidLogin = false;
        }
      });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const routePath = this.route.snapshot.routeConfig?.path;
      const reg = params['register'];
      const mode = params['mode'];
      const sessionId = params['sessionId'];

      if (routePath === 'recover') {
        this.openRecover();
        return;
      }
      if (routePath === 'set-password') {
        this.openSetPassword(typeof sessionId === 'string' ? sessionId : null);
        return;
      }

      if (mode === 'recover') {
        this.openRecover();
        return;
      }
      if (mode === 'set-password') {
        this.openSetPassword(typeof sessionId === 'string' ? sessionId : null);
        return;
      }

      if (reg === '1' || reg === 'true') {
        if (!this.isRegistration) {
          this.switchRegistration();
        }
        void this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParams: {} });
      }
    });
  }

  onLoginCredentialFocus(): void {
    if (!this.isRegistration) {
      this.invalidLogin = false;
    }
  }

  onAuthEnter(): void {
    if (this.authView === 'recover') {
      if (this.recoverStep === 'code') {
        void this.submitRecoverCode();
      } else {
        void this.requestRecoverLetter();
      }
      return;
    }
    if (this.authView === 'setPassword') {
      this.submitSetPassword();
      return;
    }
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
        void this.submitCode();
        break;
      case 'password':
        void this.completePasswordAndSignup();
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
    this.authView = 'auth';
    if (this.isRegistration && this.registrationStep === 'profile' && this.authSessionService.hasAccessToken()) {
      void this.router.navigate(['/podium/conferences']);
      this.resetAfterSuccessfulRegistration();
      return;
    }
    this.isRegistration = !this.isRegistration;
    this.registrationStep = 'email';
    this.loginPhase = 'credentials';
    this.twoFactorTempToken = null;
    this.resetRegistrationOtpState();
    this.otpServerInvalid = false;
    this.invalidLogin = false;
    this.userBlockedLogin = false;
    this.loading = false;
    this.formSubmitted = false;
    this.clearRegistrationPasswordFields();
    this.clearRegistrationProfileFields();
    this.registrationSessionId = null;

    if (this.isRegistration) {
      this.passwordControl.clearValidators();
      this.passwordControl.setValue('');
    } else {
      this.passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
    }

    this.passwordControl.updateValueAndValidity();
    this.codeControl.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.clearResendCooldown();
  }

  get resendCountdownLabel(): string {
    return this.authPageStateFacadeService.getResendCountdownLabel(this.resendSecondsRemaining);
  }

  get showSocialAuthOptions(): boolean {
    return !(this.isRegistration && this.registrationStep === 'profile') && (!this.isRegistration ? this.loginPhase === 'credentials' : true);
  }

  async login(): Promise<void> {
    await this.authLoginFlowService.login({
      loginForm: this.loginForm,
      emailControl: this.emailControl,
      passwordControl: this.passwordControl,
      setLoading: (value) => {
        this.loading = value;
      },
      setInvalidLogin: (value) => {
        this.invalidLogin = value;
      },
      setUserBlockedLogin: (value) => {
        this.userBlockedLogin = value;
      },
      setTwoFactorTempToken: (value) => {
        this.twoFactorTempToken = value;
      },
      setLoginPhase: (value) => {
        this.loginPhase = value;
      },
      verificationCodeForm: this.verificationCodeForm,
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      onPersistPreferredSystem: () => this.persistPreferredSystem(),
    });
  }

  async submitTwoFactor(): Promise<void> {
    await this.authLoginFlowService.submitTwoFactor({
      twoFactorTempToken: this.twoFactorTempToken,
      verificationCodeForm: this.verificationCodeForm,
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      setLoading: (value) => {
        this.loading = value;
      },
      setLoginPhase: (value) => {
        this.loginPhase = value;
      },
      setTwoFactorTempToken: (value) => {
        this.twoFactorTempToken = value;
      },
      loginForm: this.loginForm,
      onPersistPreferredSystem: () => this.persistPreferredSystem(),
    });
  }

  backFromTwoFactor(): void {
    this.authLoginFlowService.backFromTwoFactor({
      setLoginPhase: (value) => {
        this.loginPhase = value;
      },
      setTwoFactorTempToken: (value) => {
        this.twoFactorTempToken = value;
      },
      verificationCodeForm: this.verificationCodeForm,
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
    });
  }

  /** Отправка кода на email при регистрации (`POST .../auth/send-verify-code`). */
  async requestEmail(): Promise<void> {
    const isResend = this.registrationStep === 'code';
    await this.authOtpFlowService.requestCode({
      emailControl: this.emailControl,
      isResend,
      sessionId: this.registrationSessionId,
      setLoading: (value) => {
        this.loading = value;
      },
      sendCode: (email, sessionId) => this.httpService.sendRegistrationVerificationCode(email, sessionId),
      onSessionId: (sessionId) => {
        this.registrationSessionId = sessionId;
      },
      onCodeStepEntered: () => {
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
      },
      onSuccess: () => {
        if (!isResend) {
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Письмо отправлено',
          detail: 'Проверьте почту для ввода кода.',
          life: 5000,
        });
      },
      onError: (error) => this.handleSendRegistrationCodeError(error),
      startCooldown: () => this.startResendCooldown(),
    });
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
    await this.authOtpFlowService.verifyCode({
      form: this.verificationCodeForm,
      sessionId: this.registrationSessionId,
      setLoading: (value) => {
        this.loading = value;
      },
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      setServerInvalid: (value) => {
        this.otpServerInvalid = value;
      },
      onMissingSession: () => this.notificationService.showServerError(),
      verifyCode: (sessionId, code) => this.httpService.verifySignupCode(sessionId, code),
      onSuccess: async (code) => {
        this.codeControl.setValue(code);
        this.registrationStep = 'password';
        this.applyRegistrationPasswordValidators();
      },
    });
  }

  /** После паролей — создание учётной записи (signup), затем опциональный шаг профиля. */
  async completePasswordAndSignup(): Promise<void> {
    await this.authRegistrationFlowService.completePasswordAndSignup({
      registrationSessionId: this.registrationSessionId,
      passwordControl: this.passwordControl,
      passwordConfirmControl: this.passwordConfirmControl,
      acceptTermsControl: this.acceptTermsControl,
      setLoading: (value) => {
        this.loading = value;
      },
      setRegistrationSessionId: (value) => {
        this.registrationSessionId = value;
      },
      setRegistrationStep: (value) => {
        this.registrationStep = value;
      },
      afterSignup: () =>
        this.authRegistrationFlowService.applyProfileValidators({
          lastNameControl: this.lastNameControl,
          firstNameControl: this.firstNameControl,
          middleNameControl: this.middleNameControl,
          phoneControl: this.phoneControl,
          phoneCountryControl: this.phoneCountryControl,
        }),
      onError: (error) => this.handleRegistrationError(error),
    });
  }

  async submitRegistration(): Promise<void> {
    this.formSubmitted = true;
    await this.authRegistrationFlowService.submitRegistration({
      firstNameControl: this.firstNameControl,
      lastNameControl: this.lastNameControl,
      middleNameControl: this.middleNameControl,
      phoneControl: this.phoneControl,
      phoneCountryControl: this.phoneCountryControl,
      setLoading: (value) => {
        this.loading = value;
      },
      resetAfterSuccess: () => this.resetAfterSuccessfulRegistration(),
      messageService: this.messageService,
    });
  }

  /** Пропуск опционального шага — пользователь уже зарегистрирован. */
  skipRegistrationProfile(): void {
    void this.router.navigate(['/podium/conferences']);
    this.resetAfterSuccessfulRegistration();
    this.notificationService.showInfo('Профиль', 'Данные можно заполнить позже в разделе «Профиль».');
  }

  /** Кнопка «Начать работу»: пустой профиль или валидные поля. */
  profileStepDisabled(): boolean {
    return this.authRegistrationFlowService.profileStepDisabled({
      loading: this.loading,
      firstNameControl: this.firstNameControl,
      lastNameControl: this.lastNameControl,
      phoneControl: this.phoneControl,
    });
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
    this.resetRegistrationOtpState();
    this.clearRegistrationPasswordFields();
    this.clearRegistrationProfileFields();
    this.passwordControl.clearValidators();
    this.passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
    this.passwordControl.updateValueAndValidity();
    this.codeControl.updateValueAndValidity();
    this.loginForm.reset();
  }

  private handleRegistrationError(error: unknown): void {
    this.authRegistrationFlowService.handleRegistrationError(error, this.messageService);
  }

  onResendCode(event: Event): void {
    this.onResendClick(event, () => this.requestEmail());
  }

  private applyRegistrationPasswordValidators(): void {
    this.authRegistrationFlowService.applyPasswordValidators({
      passwordControl: this.passwordControl,
      passwordConfirmControl: this.passwordConfirmControl,
      acceptTermsControl: this.acceptTermsControl,
      passwordMatchValidator: this.passwordMatchValidator,
    });
  }

  private clearRegistrationPasswordFields(): void {
    this.authRegistrationFlowService.clearPasswordFields({
      passwordConfirmControl: this.passwordConfirmControl,
      acceptTermsControl: this.acceptTermsControl,
    });
  }

  private applyRegistrationProfileValidators(): void {
    this.authRegistrationFlowService.applyProfileValidators({
      lastNameControl: this.lastNameControl,
      firstNameControl: this.firstNameControl,
      middleNameControl: this.middleNameControl,
      phoneControl: this.phoneControl,
      phoneCountryControl: this.phoneCountryControl,
    });
  }

  private clearRegistrationProfileFields(): void {
    this.authRegistrationFlowService.clearProfileFields({
      lastNameControl: this.lastNameControl,
      firstNameControl: this.firstNameControl,
      middleNameControl: this.middleNameControl,
      phoneControl: this.phoneControl,
      phoneCountryControl: this.phoneCountryControl,
    });
  }

  private startResendCooldown(): void {
    this.authPageStateFacadeService.startResendCooldown({
      resendIntervalId: this.resendIntervalId,
      setResendIntervalId: (value) => {
        this.resendIntervalId = value;
      },
      setResendSecondsRemaining: (value) => {
        this.resendSecondsRemaining = value;
      },
      onTick: () =>
        this.authPageStateFacadeService.tickResendCooldown({
          resendIntervalId: this.resendIntervalId,
          resendSecondsRemaining: this.resendSecondsRemaining,
          setResendIntervalId: (value) => {
            this.resendIntervalId = value;
          },
          setResendSecondsRemaining: (value) => {
            this.resendSecondsRemaining = value;
          },
        }),
    });
  }

  private clearResendCooldown(): void {
    this.authPageStateFacadeService.clearResendCooldown({
      resendIntervalId: this.resendIntervalId,
      setResendIntervalId: (value) => {
        this.resendIntervalId = value;
      },
    });
  }

  isInvalid(controlName: string): boolean {
    return this.authOtpFlowService.isOtpControlInvalid(this.verificationCodeForm, controlName, this.formSubmitted);
  }

  otpInvalidVisual(): boolean {
    return this.otpServerInvalid || this.isInvalid('value');
  }

  /** Сохраняет выбранную на экране входа систему для клиентской логики (бэкенд login принимает только email/password). */
  private persistPreferredSystem(): void {
    try {
      localStorage.setItem('authPreferredSystem', this.selectedSystem);
    } catch {
      /* ignore quota / private mode */
    }
  }

  backToEmailStep(): void {
    this.authPageStateFacadeService.resetRegistrationOtpState({
      verificationCodeForm: this.verificationCodeForm,
      codeControl: this.codeControl,
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      clearCooldown: () => this.clearResendCooldown(),
      setResendSecondsRemaining: (value) => {
        this.resendSecondsRemaining = value;
      },
    });
    this.otpServerInvalid = false;
    this.registrationSessionId = null;
    this.registrationStep = 'email';
  }

  openRecover(): void {
    this.authView = 'recover';
    this.resetRecoverState();
    void this.router.navigate(['/auth'], {
      replaceUrl: true,
      queryParams: { mode: 'recover' },
    });
  }

  cancelRecover(): void {
    this.authView = 'auth';
    this.resetRecoverState();
    void this.router.navigate(['/auth'], { replaceUrl: true, queryParams: {} });
  }

  backFromRecoverCode(): void {
    this.resetRecoverCodeStepState();
  }

  showRecoverEmailError(): boolean {
    return this.authView === 'recover' && this.recoverStep === 'login' && this.recoverEmailControl.invalid && this.recoverEmailControl.touched;
  }

  recoverEmailErrorMessage(): string {
    return this.authOtpFlowService.getEmailErrorMessage(this.recoverEmailControl);
  }

  async requestRecoverLetter(): Promise<void> {
    const isResend = this.emailSent;
    await this.authRecoverFlowService.requestRecoverLetter({
      recoverEmailControl: this.recoverEmailControl,
      isResend,
      restoreSessionId: this.restoreSessionId,
      setLoading: (value) => {
        this.loading = value;
      },
      setRestoreSessionId: (sessionId) => {
        this.restoreSessionId = sessionId;
      },
      onCodeStepEntered: () => {
        this.emailSent = true;
        this.recoverStep = 'code';
        this.recoverCodeForm.reset({ value: '' });
        this.formSubmitted = false;
        this.otpServerInvalid = false;
      },
      onSuccess: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Письмо отправлено',
          detail: 'Проверьте почту для подтверждения смены пароля.',
          life: 5000,
        });
      },
      onError: (error) => this.handleRecoverSendCodeError(error),
      startCooldown: () => this.startResendCooldown(),
    });
  }

  onRecoverResendClick(event: Event): void {
    this.onResendClick(event, () => this.requestRecoverLetter());
  }

  isRecoverCodeInvalid(controlName: string): boolean {
    return this.authOtpFlowService.isOtpControlInvalid(this.recoverCodeForm, controlName, this.formSubmitted);
  }

  recoverOtpInvalidVisual(): boolean {
    return this.otpServerInvalid || this.isRecoverCodeInvalid('value');
  }

  async submitRecoverCode(): Promise<void> {
    await this.authRecoverFlowService.submitRecoverCode({
      recoverCodeForm: this.recoverCodeForm,
      restoreSessionId: this.restoreSessionId,
      setLoading: (value) => {
        this.loading = value;
      },
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      setOtpServerInvalid: (value) => {
        this.otpServerInvalid = value;
      },
      onSuccess: async (sessionId) => this.openSetPassword(sessionId),
    });
  }

  openSetPassword(sessionId: string | null): void {
    this.authView = 'setPassword';
    this.setPasswordSessionId = sessionId && sessionId.trim().length > 0 ? sessionId : null;
    this.setPasswordForm.reset();
    this.formSubmitted = false;
    const queryParams = this.setPasswordSessionId
      ? { mode: 'set-password', sessionId: this.setPasswordSessionId }
      : { mode: 'set-password' };
    void this.router.navigate(['/auth'], { replaceUrl: true, queryParams });
  }

  submitSetPassword(): void {
    this.authRecoverFlowService.submitSetPassword({
      setPasswordForm: this.setPasswordForm,
      setPasswordSessionId: this.setPasswordSessionId,
      setLoading: (value) => {
        this.loading = value;
      },
      onSuccess: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Готово',
          detail: 'Пароль изменён. Войдите с новым паролем.',
          life: 4000,
        });
        this.cancelRecover();
      },
      onError: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: 'Не удалось сменить пароль. Запросите код заново.',
          life: 4000,
        });
      },
    });
  }

  private onResendClick(event: Event, action: () => Promise<void>): void {
    event.preventDefault();
    if (this.resendSecondsRemaining > 0 || this.loading) {
      return;
    }
    void action();
  }

  private resetRegistrationOtpState(): void {
    this.authPageStateFacadeService.resetRegistrationOtpState({
      verificationCodeForm: this.verificationCodeForm,
      codeControl: this.codeControl,
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      clearCooldown: () => this.clearResendCooldown(),
      setResendSecondsRemaining: (value) => {
        this.resendSecondsRemaining = value;
      },
    });
  }

  private resetRecoverState(): void {
    this.authPageStateFacadeService.resetRecoverState({
      recoverCodeForm: this.recoverCodeForm,
      setRecoverStep: (value) => {
        this.recoverStep = value;
      },
      setEmailSent: (value) => {
        this.emailSent = value;
      },
      setRestoreSessionId: (value) => {
        this.restoreSessionId = value;
      },
      setOtpServerInvalid: (value) => {
        this.otpServerInvalid = value;
      },
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
      clearCooldown: () => this.clearResendCooldown(),
      setResendSecondsRemaining: (value) => {
        this.resendSecondsRemaining = value;
      },
    });
  }

  private resetRecoverCodeStepState(): void {
    this.authPageStateFacadeService.resetRecoverCodeStepState({
      recoverCodeForm: this.recoverCodeForm,
      setRestoreSessionId: (value) => {
        this.restoreSessionId = value;
      },
      setOtpServerInvalid: (value) => {
        this.otpServerInvalid = value;
      },
      setRecoverStep: (value) => {
        this.recoverStep = value;
      },
      setFormSubmitted: (value) => {
        this.formSubmitted = value;
      },
    });
  }

  private handleRecoverSendCodeError(error: unknown): void {
    this.authRecoverFlowService.handleRecoverSendCodeError(error, this.messageService);
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
    return this.authOtpFlowService.getEmailErrorMessage(this.emailControl);
  }

  onAuthFormKeydownEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter') {
      return;
    }
    const target = ke.target as HTMLElement | null;
    if (target?.closest('a[href], textarea')) {
      return;
    }
    ke.preventDefault();
    void this.onAuthEnter();
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

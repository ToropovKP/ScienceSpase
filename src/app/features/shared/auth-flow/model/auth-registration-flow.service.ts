import { Injectable } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { accessTokenFromAuthResponse } from '../../../../shared/lib/auth-token';
import { PhoneCountryId, nationalPhoneValidator } from '../../../../shared/lib/phone-country';
import { AuthService } from '../../../../shared/services/auth.service';
import { AuthSessionService } from '../../../../shared/services/auth-session.service';
import { HttpService } from '../../../../shared/services/http.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PASSWORD_COMPLEXITY_PATTERN } from '../../password-pair';

function optionalMinLength(min: number): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null;
    }
    return value.length < min ? { minlength: { requiredLength: min, actualLength: value.length } } : null;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthRegistrationFlowService {
  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private authSessionService: AuthSessionService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  applyPasswordValidators(options: {
    passwordControl: FormControl;
    passwordConfirmControl: FormControl;
    acceptTermsControl: FormControl;
    passwordMatchValidator: ValidatorFn;
  }): void {
    const { passwordControl, passwordConfirmControl, acceptTermsControl, passwordMatchValidator } = options;
    passwordControl.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(PASSWORD_COMPLEXITY_PATTERN),
    ]);
    passwordConfirmControl.setValidators([Validators.required, passwordMatchValidator]);
    acceptTermsControl.setValidators([Validators.requiredTrue]);
    passwordControl.updateValueAndValidity();
    passwordConfirmControl.updateValueAndValidity();
    acceptTermsControl.updateValueAndValidity();
  }

  clearPasswordFields(options: {
    passwordConfirmControl: FormControl;
    acceptTermsControl: FormControl;
  }): void {
    const { passwordConfirmControl, acceptTermsControl } = options;
    passwordConfirmControl.clearValidators();
    acceptTermsControl.clearValidators();
    passwordConfirmControl.setValue('');
    acceptTermsControl.setValue(false);
    passwordConfirmControl.updateValueAndValidity();
    acceptTermsControl.updateValueAndValidity();
  }

  applyProfileValidators(options: {
    lastNameControl: FormControl;
    firstNameControl: FormControl;
    middleNameControl: FormControl;
    phoneControl: FormControl;
    phoneCountryControl: FormControl<PhoneCountryId>;
  }): void {
    const { lastNameControl, firstNameControl, middleNameControl, phoneControl, phoneCountryControl } = options;
    lastNameControl.setValidators([optionalMinLength(2)]);
    firstNameControl.setValidators([optionalMinLength(2)]);
    middleNameControl.clearValidators();
    phoneControl.setValidators([nationalPhoneValidator(() => phoneCountryControl.value)]);
    lastNameControl.updateValueAndValidity();
    firstNameControl.updateValueAndValidity();
    middleNameControl.updateValueAndValidity();
    phoneControl.updateValueAndValidity();
  }

  clearProfileFields(options: {
    lastNameControl: FormControl;
    firstNameControl: FormControl;
    middleNameControl: FormControl;
    phoneControl: FormControl;
    phoneCountryControl: FormControl<PhoneCountryId>;
  }): void {
    const { lastNameControl, firstNameControl, middleNameControl, phoneControl, phoneCountryControl } = options;
    lastNameControl.clearValidators();
    firstNameControl.clearValidators();
    middleNameControl.clearValidators();
    phoneControl.clearValidators();
    lastNameControl.setValue('');
    firstNameControl.setValue('');
    middleNameControl.setValue('');
    phoneControl.setValue('');
    phoneCountryControl.setValue('RU');
    lastNameControl.updateValueAndValidity();
    firstNameControl.updateValueAndValidity();
    middleNameControl.updateValueAndValidity();
    phoneControl.updateValueAndValidity();
    phoneCountryControl.updateValueAndValidity();
  }

  profileStepDisabled(options: {
    loading: boolean;
    firstNameControl: FormControl;
    lastNameControl: FormControl;
    phoneControl: FormControl;
  }): boolean {
    const { loading, firstNameControl, lastNameControl, phoneControl } = options;
    if (loading) {
      return true;
    }
    const firstName = String(firstNameControl.value ?? '').trim();
    const lastName = String(lastNameControl.value ?? '').trim();
    if ((firstName && !lastName) || (!firstName && lastName)) {
      return true;
    }
    return firstNameControl.invalid || lastNameControl.invalid || phoneControl.invalid;
  }

  async completePasswordAndSignup(options: {
    registrationSessionId: string | null;
    passwordControl: FormControl;
    passwordConfirmControl: FormControl;
    acceptTermsControl: FormControl;
    setLoading: (value: boolean) => void;
    setRegistrationSessionId: (value: string | null) => void;
    setRegistrationStep: (value: 'email' | 'code' | 'password' | 'profile') => void;
    afterSignup: () => void;
    onError: (error: unknown) => void;
  }): Promise<void> {
    const {
      registrationSessionId,
      passwordControl,
      passwordConfirmControl,
      acceptTermsControl,
      setLoading,
      setRegistrationSessionId,
      setRegistrationStep,
      afterSignup,
      onError,
    } = options;

    passwordControl.markAsTouched();
    passwordConfirmControl.markAsTouched();
    acceptTermsControl.markAsTouched();
    if (passwordControl.invalid || passwordConfirmControl.invalid || acceptTermsControl.invalid) {
      return;
    }
    if (!registrationSessionId) {
      this.notificationService.showServerError();
      return;
    }

    setLoading(true);
    try {
      const signupRes = await this.httpService.signup({
        sessionId: registrationSessionId,
        password: passwordControl.value as string,
      });
      const token = accessTokenFromAuthResponse(signupRes);
      if (!token) {
        this.notificationService.showServerError();
        return;
      }
      this.authSessionService.updateFromAuthResponse(signupRes);
      await this.authService.getCurrentUser();
      setRegistrationSessionId(null);
      setRegistrationStep('profile');
      afterSignup();
      this.notificationService.showSuccess(
        'Регистрация',
        'Аккаунт создан. При желании заполните данные ниже или нажмите «Пропустить».',
      );
    } catch (error: unknown) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }

  async submitRegistration(options: {
    firstNameControl: FormControl;
    lastNameControl: FormControl;
    middleNameControl: FormControl;
    phoneControl: FormControl;
    phoneCountryControl: FormControl<PhoneCountryId>;
    setLoading: (value: boolean) => void;
    resetAfterSuccess: () => void;
    messageService: MessageService;
  }): Promise<void> {
    const {
      firstNameControl,
      lastNameControl,
      middleNameControl,
      phoneControl,
      phoneCountryControl,
      setLoading,
      resetAfterSuccess,
      messageService,
    } = options;

    firstNameControl.markAsTouched();
    lastNameControl.markAsTouched();
    phoneControl.markAsTouched();

    const firstName = String(firstNameControl.value ?? '').trim();
    const lastName = String(lastNameControl.value ?? '').trim();
    const middleName = String(middleNameControl.value ?? '').trim();
    const phoneDigits = String(phoneControl.value ?? '').replace(/\D/g, '');

    if ((firstName && !lastName) || (!firstName && lastName)) {
      messageService.add({
        severity: 'error',
        summary: 'Профиль',
        detail: 'Укажите и имя, и фамилию (или оставьте оба поля пустыми).',
        life: 5000,
      });
      return;
    }
    if (firstNameControl.invalid || lastNameControl.invalid || phoneControl.invalid) {
      return;
    }

    const hasProfileData = !!(firstName || lastName || middleName || phoneDigits);
    if (!hasProfileData) {
      await this.router.navigate(['/podium/conferences']);
      resetAfterSuccess();
      return;
    }

    setLoading(true);
    try {
      await this.httpService.updateUserInfo({
        firstName,
        lastName,
        middleName,
        countryCode: phoneCountryControl.value,
        phoneNumber: phoneDigits,
        organization: '',
        academicDegree: '',
        academicTitle: '',
        orcId: '',
        rincId: '',
      });
      await this.authService.getCurrentUser();
      this.notificationService.showSuccess('Профиль', 'Данные сохранены.');
      await this.router.navigate(['/podium/conferences']);
      resetAfterSuccess();
    } catch {
      this.notificationService.showWarning(
        'Профиль',
        'Не удалось сохранить данные. Вы можете заполнить профиль позже.',
      );
      await this.router.navigate(['/podium/conferences']);
      resetAfterSuccess();
    } finally {
      setLoading(false);
    }
  }

  handleRegistrationError(error: unknown, messageService: MessageService): void {
    const err = error as { error?: { code?: string } };
    const code = err?.error?.code;
    if (code === 'USER_EXISTS') {
      messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Пользователь с таким email уже зарегистрирован.',
        life: 5000,
      });
      return;
    }
    if (code === 'BANNED') {
      messageService.add({
        severity: 'error',
        summary: 'Регистрация',
        detail: 'Регистрация невозможна: учётная запись заблокирована.',
        life: 5000,
      });
      return;
    }
    this.notificationService.showServerError();
  }
}

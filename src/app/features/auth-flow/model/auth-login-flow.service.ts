import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { accessTokenFromAuthResponse } from '../../../shared/lib/auth-token';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Injectable({ providedIn: 'root' })
export class AuthLoginFlowService {
  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  async login(options: {
    loginForm: FormGroup;
    emailControl: FormControl;
    passwordControl: FormControl;
    setLoading: (value: boolean) => void;
    setInvalidLogin: (value: boolean) => void;
    setUserBlockedLogin: (value: boolean) => void;
    setTwoFactorTempToken: (value: string | null) => void;
    setLoginPhase: (value: 'credentials' | 'twoFactor') => void;
    verificationCodeForm: FormGroup;
    setFormSubmitted: (value: boolean) => void;
    onPersistPreferredSystem: () => void;
  }): Promise<void> {
    const {
      loginForm,
      emailControl,
      passwordControl,
      setLoading,
      setInvalidLogin,
      setUserBlockedLogin,
      setTwoFactorTempToken,
      setLoginPhase,
      verificationCodeForm,
      setFormSubmitted,
      onPersistPreferredSystem,
    } = options;

    if (loginForm.invalid) {
      emailControl.markAsTouched();
      passwordControl.markAsTouched();
      return;
    }

    setLoading(true);
    try {
      const data = await this.httpService.login({
        email: loginForm.value.email,
        password: loginForm.value.password,
      });
      setInvalidLogin(false);
      setUserBlockedLogin(false);

      if (data.status === 'two_factor_required') {
        const temp = accessTokenFromAuthResponse(data);
        if (!temp) {
          this.notificationService.showServerError();
          return;
        }
        setTwoFactorTempToken(temp);
        setLoginPhase('twoFactor');
        verificationCodeForm.reset({ value: '' });
        setFormSubmitted(false);
        return;
      }

      const token = accessTokenFromAuthResponse(data);
      if (data.status === 'authenticated' && token) {
        localStorage.setItem('token', token);
        onPersistPreferredSystem();
        await this.authService.getCurrentUser();
        loginForm.reset();
        await this.router.navigate(['/conferences']);
        return;
      }

      this.notificationService.showServerError();
    } catch (error: unknown) {
      const err = error as { error?: { code?: string } };
      if (err?.error?.code === 'USER_DOES_NOT_EXISTS') {
        setInvalidLogin(true);
        setUserBlockedLogin(false);
      } else if (err?.error?.code === 'BANNED') {
        setInvalidLogin(false);
        setUserBlockedLogin(true);
      } else {
        this.notificationService.showServerError();
      }
    } finally {
      setLoading(false);
    }
  }

  async submitTwoFactor(options: {
    twoFactorTempToken: string | null;
    verificationCodeForm: FormGroup;
    setFormSubmitted: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    setLoginPhase: (value: 'credentials' | 'twoFactor') => void;
    setTwoFactorTempToken: (value: string | null) => void;
    loginForm: FormGroup;
    onPersistPreferredSystem: () => void;
  }): Promise<void> {
    const {
      twoFactorTempToken,
      verificationCodeForm,
      setFormSubmitted,
      setLoading,
      setLoginPhase,
      setTwoFactorTempToken,
      loginForm,
      onPersistPreferredSystem,
    } = options;

    if (!twoFactorTempToken) {
      return;
    }
    setFormSubmitted(true);
    const otp = verificationCodeForm.get('value');
    if (verificationCodeForm.invalid) {
      otp?.markAsTouched();
      return;
    }

    const code = String(otp?.value ?? '').trim();
    setLoading(true);
    try {
      const data = await this.httpService.verifyTwoFactor(code, twoFactorTempToken);
      const token = accessTokenFromAuthResponse(data);
      if (data.status === 'authenticated' && token) {
        localStorage.setItem('token', token);
        onPersistPreferredSystem();
        setTwoFactorTempToken(null);
        setLoginPhase('credentials');
        await this.authService.getCurrentUser();
        loginForm.reset();
        verificationCodeForm.reset({ value: '' });
        await this.router.navigate(['/conferences']);
      } else {
        this.notificationService.showServerError();
      }
    } catch {
      this.notificationService.showError('Проверьте код и попробуйте снова.', 'Неверный код 2FA');
    } finally {
      setLoading(false);
    }
  }

  backFromTwoFactor(options: {
    setLoginPhase: (value: 'credentials' | 'twoFactor') => void;
    setTwoFactorTempToken: (value: string | null) => void;
    verificationCodeForm: FormGroup;
    setFormSubmitted: (value: boolean) => void;
  }): void {
    const { setLoginPhase, setTwoFactorTempToken, verificationCodeForm, setFormSubmitted } = options;
    setLoginPhase('credentials');
    setTwoFactorTempToken(null);
    verificationCodeForm.reset({ value: '' });
    setFormSubmitted(false);
  }
}

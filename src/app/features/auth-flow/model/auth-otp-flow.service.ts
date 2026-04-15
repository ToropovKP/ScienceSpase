import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class AuthOtpFlowService {
  getEmailErrorMessage(control: FormControl): string {
    if (control.hasError('required')) {
      return 'Введите почту';
    }
    if (control.hasError('email')) {
      return 'Укажите корректную почту: нужен символ «@», например alex_fedorov@gmail.com';
    }
    return '';
  }

  isOtpControlInvalid(form: FormGroup, controlName: string, formSubmitted: boolean): boolean {
    const control = form.get(controlName);
    return !!(control && control.invalid && (control.touched || formSubmitted));
  }

  async requestCode(options: {
    emailControl: FormControl;
    isResend: boolean;
    sessionId: string | null;
    setLoading: (value: boolean) => void;
    sendCode: (email: string, sessionId: string | null) => Promise<{ sessionId?: string | null }>;
    onSessionId: (sessionId: string) => void;
    onCodeStepEntered: () => void;
    onSuccess: () => void;
    onError: (error: unknown) => void;
    startCooldown: () => void;
  }): Promise<void> {
    const {
      emailControl,
      isResend,
      sessionId,
      setLoading,
      sendCode,
      onSessionId,
      onCodeStepEntered,
      onSuccess,
      onError,
      startCooldown,
    } = options;

    if (emailControl.invalid) {
      emailControl.markAsTouched({ onlySelf: true });
      return;
    }
    if (!isResend) {
      setLoading(true);
    }

    try {
      const email = String(emailControl.value ?? '').trim();
      const response = await sendCode(email, isResend ? sessionId : null);
      if (response.sessionId) {
        onSessionId(response.sessionId);
      }
      startCooldown();
      onCodeStepEntered();
      onSuccess();
    } catch (error: unknown) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }

  async verifyCode(options: {
    form: FormGroup;
    sessionId: string | null;
    setLoading: (value: boolean) => void;
    setFormSubmitted: (value: boolean) => void;
    setServerInvalid: (value: boolean) => void;
    onMissingSession: () => void;
    verifyCode: (sessionId: string, code: string) => Promise<unknown>;
    onSuccess: (code: string, sessionId: string) => Promise<void> | void;
  }): Promise<void> {
    const {
      form,
      sessionId,
      setLoading,
      setFormSubmitted,
      setServerInvalid,
      onMissingSession,
      verifyCode,
      onSuccess,
    } = options;

    setFormSubmitted(true);
    const otpControl = form.get('value');
    if (form.invalid) {
      otpControl?.markAsTouched();
      return;
    }
    if (!sessionId) {
      onMissingSession();
      return;
    }

    const code = String(otpControl?.value ?? '').trim();
    setLoading(true);
    setServerInvalid(false);
    try {
      await verifyCode(sessionId, code);
      await onSuccess(code, sessionId);
    } catch {
      setServerInvalid(true);
    } finally {
      setLoading(false);
    }
  }
}

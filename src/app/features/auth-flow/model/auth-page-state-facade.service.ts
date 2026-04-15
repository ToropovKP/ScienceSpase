import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class AuthPageStateFacadeService {
  getResendCountdownLabel(seconds: number): string {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const restSeconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
  }

  startResendCooldown(options: {
    resendIntervalId: ReturnType<typeof setInterval> | null;
    setResendIntervalId: (value: ReturnType<typeof setInterval> | null) => void;
    setResendSecondsRemaining: (value: number) => void;
    onTick: () => void;
  }): void {
    const { resendIntervalId, setResendIntervalId, setResendSecondsRemaining, onTick } = options;
    this.clearResendCooldown({ resendIntervalId, setResendIntervalId });
    setResendSecondsRemaining(65);
    const id = setInterval(onTick, 1000);
    setResendIntervalId(id);
  }

  tickResendCooldown(options: {
    resendIntervalId: ReturnType<typeof setInterval> | null;
    resendSecondsRemaining: number;
    setResendIntervalId: (value: ReturnType<typeof setInterval> | null) => void;
    setResendSecondsRemaining: (value: number) => void;
  }): void {
    const { resendIntervalId, resendSecondsRemaining, setResendIntervalId, setResendSecondsRemaining } = options;
    const next = resendSecondsRemaining - 1;
    if (next <= 0) {
      this.clearResendCooldown({ resendIntervalId, setResendIntervalId });
      setResendSecondsRemaining(0);
      return;
    }
    setResendSecondsRemaining(next);
  }

  clearResendCooldown(options: {
    resendIntervalId: ReturnType<typeof setInterval> | null;
    setResendIntervalId: (value: ReturnType<typeof setInterval> | null) => void;
  }): void {
    const { resendIntervalId, setResendIntervalId } = options;
    if (!resendIntervalId) {
      return;
    }
    clearInterval(resendIntervalId);
    setResendIntervalId(null);
  }

  resetRegistrationOtpState(options: {
    verificationCodeForm: FormGroup;
    codeControl: FormControl;
    setFormSubmitted: (value: boolean) => void;
    clearCooldown: () => void;
    setResendSecondsRemaining: (value: number) => void;
  }): void {
    const { verificationCodeForm, codeControl, setFormSubmitted, clearCooldown, setResendSecondsRemaining } = options;
    clearCooldown();
    setResendSecondsRemaining(0);
    verificationCodeForm.reset({ value: '' });
    setFormSubmitted(false);
    codeControl.clearValidators();
    codeControl.setValue('');
    codeControl.updateValueAndValidity();
  }

  resetRecoverState(options: {
    recoverCodeForm: FormGroup;
    setRecoverStep: (value: 'login' | 'code') => void;
    setEmailSent: (value: boolean) => void;
    setRestoreSessionId: (value: string | null) => void;
    setOtpServerInvalid: (value: boolean) => void;
    setFormSubmitted: (value: boolean) => void;
    clearCooldown: () => void;
    setResendSecondsRemaining: (value: number) => void;
  }): void {
    const {
      recoverCodeForm,
      setRecoverStep,
      setEmailSent,
      setRestoreSessionId,
      setOtpServerInvalid,
      setFormSubmitted,
      clearCooldown,
      setResendSecondsRemaining,
    } = options;
    setRecoverStep('login');
    setEmailSent(false);
    setRestoreSessionId(null);
    setOtpServerInvalid(false);
    setFormSubmitted(false);
    recoverCodeForm.reset({ value: '' });
    clearCooldown();
    setResendSecondsRemaining(0);
  }

  resetRecoverCodeStepState(options: {
    recoverCodeForm: FormGroup;
    setRestoreSessionId: (value: string | null) => void;
    setOtpServerInvalid: (value: boolean) => void;
    setRecoverStep: (value: 'login' | 'code') => void;
    setFormSubmitted: (value: boolean) => void;
  }): void {
    const { recoverCodeForm, setRestoreSessionId, setOtpServerInvalid, setRecoverStep, setFormSubmitted } = options;
    setOtpServerInvalid(false);
    setRestoreSessionId(null);
    setRecoverStep('login');
    setFormSubmitted(false);
    recoverCodeForm.reset({ value: '' });
  }
}

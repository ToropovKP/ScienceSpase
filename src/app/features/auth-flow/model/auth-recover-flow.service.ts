import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthOtpFlowService } from './auth-otp-flow.service';

@Injectable({ providedIn: 'root' })
export class AuthRecoverFlowService {
  constructor(
    private authOtpFlowService: AuthOtpFlowService,
    private httpService: HttpService,
    private notificationService: NotificationService,
  ) {}

  async requestRecoverLetter(options: {
    recoverEmailControl: FormControl;
    isResend: boolean;
    restoreSessionId: string | null;
    setLoading: (value: boolean) => void;
    setRestoreSessionId: (value: string | null) => void;
    onCodeStepEntered: () => void;
    onSuccess: () => void;
    startCooldown: () => void;
    onError: (error: unknown) => void;
  }): Promise<void> {
    const {
      recoverEmailControl,
      isResend,
      restoreSessionId,
      setLoading,
      setRestoreSessionId,
      onCodeStepEntered,
      onSuccess,
      startCooldown,
      onError,
    } = options;
    await this.authOtpFlowService.requestCode({
      emailControl: recoverEmailControl,
      isResend,
      sessionId: restoreSessionId,
      setLoading,
      sendCode: (email, sessionId) => this.httpService.sendRestoreCode(email, sessionId),
      onSessionId: (sessionId) => {
        setRestoreSessionId(sessionId);
      },
      onCodeStepEntered,
      onSuccess,
      onError,
      startCooldown,
    });
  }

  async submitRecoverCode(options: {
    recoverCodeForm: FormGroup;
    restoreSessionId: string | null;
    setLoading: (value: boolean) => void;
    setFormSubmitted: (value: boolean) => void;
    setOtpServerInvalid: (value: boolean) => void;
    onSuccess: (sessionId: string) => Promise<void> | void;
  }): Promise<void> {
    const {
      recoverCodeForm,
      restoreSessionId,
      setLoading,
      setFormSubmitted,
      setOtpServerInvalid,
      onSuccess,
    } = options;
    await this.authOtpFlowService.verifyCode({
      form: recoverCodeForm,
      sessionId: restoreSessionId,
      setLoading,
      setFormSubmitted,
      setServerInvalid: setOtpServerInvalid,
      onMissingSession: () => this.notificationService.showServerError(),
      verifyCode: (sessionId, code) => this.httpService.verifyRestoreCode(sessionId, code),
      onSuccess: async (_, sessionId) => onSuccess(sessionId),
    });
  }

  submitSetPassword(options: {
    setPasswordForm: FormGroup;
    setPasswordSessionId: string | null;
    setLoading: (value: boolean) => void;
    onSuccess: () => void;
    onError: () => void;
  }): void {
    const { setPasswordForm, setPasswordSessionId, setLoading, onSuccess, onError } = options;
    if (!setPasswordSessionId || setPasswordForm.invalid) {
      setPasswordForm.markAllAsTouched();
      return;
    }
    setLoading(true);
    const password = setPasswordForm.get('password')?.value as string;
    this.httpService
      .restorePasswordWithSession(setPasswordSessionId, password)
      .then(() => onSuccess())
      .catch(() => onError())
      .finally(() => setLoading(false));
  }

  handleRecoverSendCodeError(error: unknown, messageService: MessageService): void {
    const err = error as { status?: number; error?: { code?: string } };
    if (err?.status === 429) {
      this.notificationService.showRestorePasswordTooManyRequests();
      return;
    }
    if (err?.status === 404 || err?.error?.code === 'NOT_FOUND') {
      messageService.add({
        severity: 'error',
        summary: 'Восстановление',
        detail: 'Пользователь с таким email не найден.',
        life: 5000,
      });
      return;
    }
    if (err?.status === 403 || err?.error?.code === 'BANNED') {
      messageService.add({
        severity: 'error',
        summary: 'Восстановление',
        detail: 'Учётная запись заблокирована.',
        life: 5000,
      });
      return;
    }
    this.notificationService.showServerError();
  }
}

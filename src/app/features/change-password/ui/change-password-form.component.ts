import { CommonModule } from '@angular/common';
import { Component, SecurityContext } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { HttpService } from '../../../shared/services/http.service';
import { passwordMatchValidator } from '../../../shared/validators/password.match.validator';

@Component({
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule, PopoverModule]
})
export class ChangePasswordFormComponent {
  securityForm: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isUpdating = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer
  ) {
    this.securityForm = this.formBuilder.group({
      currentPassword: new FormControl('', Validators.required),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      confirmedPassword: new FormControl('', Validators.required)
    }, {
      validators: passwordMatchValidator
    });
  }

  checkPasswordStrength() {
    if (this.securityForm.get('password')?.value) {
      this.getPasswordStrength();
    }
  }

  getPasswordStrength(): number {
    const password = this.securityForm.get('password')?.value || '';
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];

    const strength = requirements.filter(Boolean).length * 25;
    return Math.min(strength, 100);
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'Слабый';
    if (strength < 75) return 'Средний';
    return 'Сильный';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'bg-danger';
    if (strength < 75) return 'bg-warning';
    return 'bg-success';
  }

  async handlePasswordChange() {
    if (this.securityForm.invalid) return;

    this.isUpdating = true;

    try {
      const currentPassword = this.sanitizer.sanitize(SecurityContext.HTML, this.securityForm.value.currentPassword);
      const isCurrentValid = await this.httpService.verifyCurrentPassword({ password: currentPassword });

      if (!isCurrentValid) {
        this.securityForm.get('currentPassword')?.setErrors({ incorrect: true });
        this.isUpdating = false;
        return;
      }

      const newPassword = this.sanitizer.sanitize(SecurityContext.HTML, this.securityForm.value.password);
      await this.httpService.updatePassword({ password: newPassword });

      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Пароль успешно изменен',
        life: 3000
      });

      this.securityForm.reset();
    } catch (error: any) {
      this.handlePasswordError(error);
    } finally {
      this.isUpdating = false;
    }
  }

  private handlePasswordError(error: any) {
    if (error.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000
      });
    } else if (error.status === 401) {
      this.securityForm.get('currentPassword')?.setErrors({ incorrect: true });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось изменить пароль. Попробуйте позже',
        life: 3000
      });
    }
  }

  resetPasswordForm() {
    this.securityForm.reset();
    this.securityForm.get('currentPassword')?.enable();
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }
}

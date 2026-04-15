import { CommonModule } from '@angular/common';
import { Component, SecurityContext } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { HttpService } from '../../shared/services/http.service';
import { passwordMatchValidator } from '../../shared/validators/password.match.validator';
import { PasswordFieldComponent } from '../../features/password-field';
import { PasswordPairFormComponent, PASSWORD_COMPLEXITY_PATTERN } from '../../features/password-pair';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    ToastModule,
    PasswordFieldComponent,
    PasswordPairFormComponent,
  ],
  providers: [MessageService],
  templateUrl: './change-password.component.html',
  styleUrls: ['../auth/auth.component.css', './change-password.component.css'],
})
export class ChangePasswordComponent {
  securityForm: FormGroup;
  isUpdating = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {
    this.securityForm = this.formBuilder.group(
      {
        currentPassword: new FormControl('', Validators.required),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(PASSWORD_COMPLEXITY_PATTERN),
        ]),
        confirmedPassword: new FormControl('', Validators.required),
      },
      {
        validators: passwordMatchValidator,
      },
    );
    if (!localStorage.getItem('token')) {
      void this.router.navigate(['/auth']);
    }
  }

  get currentPasswordControl(): FormControl {
    return this.securityForm.get('currentPassword') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.securityForm.get('password') as FormControl;
  }

  get confirmedPasswordControl(): FormControl {
    return this.securityForm.get('confirmedPassword') as FormControl;
  }

  async handlePasswordChange(): Promise<void> {
    if (this.securityForm.invalid) {
      return;
    }

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
        detail: 'Пароль успешно изменён',
        life: 3000,
      });

      this.securityForm.reset();
      void this.router.navigate(['/profile']);
    } catch (error: unknown) {
      this.handlePasswordError(error);
    } finally {
      this.isUpdating = false;
    }
  }

  private handlePasswordError(error: unknown): void {
    const err = error as { status?: number };
    if (err.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000,
      });
    } else if (err.status === 401) {
      this.securityForm.get('currentPassword')?.setErrors({ incorrect: true });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось изменить пароль. Попробуйте позже',
        life: 3000,
      });
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PasswordFieldComponent } from '../../password-field';
import { PASSWORD_HINT_TEXT, PASSWORD_MISMATCH_TEXT } from '../model/password-policy';

export type PasswordPairVariant = 'registration' | 'account';

@Component({
  selector: 'app-password-with-confirm-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordFieldComponent],
  templateUrl: './password-pair-form.component.html',
  styleUrls: ['../../../pages/auth/auth.component.css', './password-pair-form.component.css'],
})
export class PasswordPairFormComponent {
  @Input({ required: true }) passwordControl!: FormControl;
  @Input({ required: true }) confirmPasswordControl!: FormControl;
  @Input() variant: PasswordPairVariant = 'registration';
  @Input() idPrefix = 'password-pair';
  @Input() hostForm?: FormGroup | null;
  @Input() acceptTermsControl?: FormControl;
  @Input() hintTextOverride: string | null = null;
  @Input() mismatchText = PASSWORD_MISMATCH_TEXT;

  readonly hintText = PASSWORD_HINT_TEXT;

  get displayHint(): string {
    return this.hintTextOverride ?? this.hintText;
  }

  get firstLabel(): string {
    return this.variant === 'registration' ? 'Пароль' : 'Новый пароль';
  }

  get passwordInputId(): string {
    return `${this.idPrefix}-password`;
  }

  get passwordInputInnerId(): string {
    return `${this.idPrefix}-password-input`;
  }

  get confirmInputId(): string {
    return `${this.idPrefix}-confirm`;
  }

  get confirmInputInnerId(): string {
    return `${this.idPrefix}-confirm-input`;
  }

  showPasswordHintError(): boolean {
    const control = this.passwordControl;
    return !!(control.invalid && control.touched);
  }

  showPasswordConfirmError(): boolean {
    const control = this.confirmPasswordControl;
    return !!(control.invalid && control.touched);
  }

  showAcceptTermsError(): boolean {
    const control = this.acceptTermsControl;
    return !!(control?.invalid && control.touched);
  }

  showFormMismatchError(): boolean {
    const form = this.hostForm;
    return !!(form && form.touched && form.hasError('passwordMismatch'));
  }
}

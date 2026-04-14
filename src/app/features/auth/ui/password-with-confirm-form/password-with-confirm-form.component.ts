import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PasswordFieldComponent } from '../forms/password-field.component';
import { PASSWORD_HINT_TEXT } from '../../model/password-policy';

/**
 * Вариант формы:
 * - `registration` — шаг «Пароль + повтор» при регистрации (чекбокс согласия опционально).
 * - `account` — новый пароль + повтор при входе в аккаунт/смене пароля (восстановление, смена в профиле).
 */
export type AuthPasswordPairVariant = 'registration' | 'account';

@Component({
  selector: 'app-password-with-confirm-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordFieldComponent],
  templateUrl: './password-with-confirm-form.component.html',
  styleUrls: ['../../../../pages/auth/auth.component.css', './password-with-confirm-form.component.css'],
})
export class PasswordWithConfirmFormComponent {
  @Input({ required: true }) passwordControl!: FormControl;
  @Input({ required: true }) confirmPasswordControl!: FormControl;
  @Input() variant: AuthPasswordPairVariant = 'registration';
  /** Префикс id для полей (уникальность на странице). */
  @Input() idPrefix = 'auth-pair';
  /** Родительская форма с групповым `passwordMismatch` (восстановление / смена пароля). */
  @Input() hostForm?: FormGroup | null;
  /** Только для `registration`: согласие с политикой. */
  @Input() acceptTermsControl?: FormControl;
  /** Переопределить текст подсказки (например, экран восстановления пароля). */
  @Input() hintTextOverride: string | null = null;
  /** Текст при несовпадении паролей (поле или форма). */
  @Input() mismatchText = 'Пароли не совпадают';

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
    const c = this.passwordControl;
    return !!(c.invalid && c.touched);
  }

  showPasswordConfirmError(): boolean {
    const c = this.confirmPasswordControl;
    return !!(c.invalid && c.touched);
  }

  showAcceptTermsError(): boolean {
    const c = this.acceptTermsControl;
    return !!(c?.invalid && c.touched);
  }

  showFormMismatchError(): boolean {
    const fg = this.hostForm;
    return !!(fg && fg.touched && fg.hasError('passwordMismatch'));
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordModule],
  templateUrl: './password-field.component.html',
  styleUrls: ['./password-field.component.css']
})
export class PasswordFieldComponent {
  @Input() label: string = 'Пароль';
  @Input() id: string = '';
  @Input() inputId: string = '';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() feedback: boolean = false;
  @Input() toggleMask: boolean = true;
  /** Без плавающей подписи (например, своя строка с ссылкой рядом с заголовком поля). */
  @Input() hideLabel: boolean = false;
  @Input() placeholder: string = '';
  @Input() highlightError = false;

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }

  showErrorVisual(): boolean {
    return this.hasError() || this.highlightError;
  }

  get ariaLabel(): string {
    const base = this.label?.trim() || 'Пароль';
    return this.required ? `${base}, обязательное поле` : base;
  }
}


import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordModule],
  templateUrl: './password-field.component.html',
  styleUrls: ['./password-field.component.css'],
})
export class PasswordFieldComponent {
  @Input() label = 'Пароль';
  @Input() id = '';
  @Input() inputId = '';
  @Input() required = false;
  @Input() control!: FormControl;
  @Input() feedback = false;
  @Input() toggleMask = true;
  @Input() hideLabel = false;
  @Input() placeholder = '';
  @Input() highlightError = false;

  hasError(): boolean {
    return this.control ? this.control.invalid && this.control.touched : false;
  }

  showErrorVisual(): boolean {
    return this.hasError() || this.highlightError;
  }

  get ariaLabel(): string {
    const base = this.label?.trim() || 'Пароль';
    return this.required ? `${base}, обязательное поле` : base;
  }

  onPasswordAutofillAnimation(event: AnimationEvent): void {
    if (event.animationName === 'onAutoFillStart' || event.animationName === 'mui-auto-fill') {
      queueMicrotask(() => {
        const input = event.target as HTMLInputElement | null;
        const autofilledValue = input?.value ?? '';
        if (this.control.value !== autofilledValue) {
          this.control.setValue(autofilledValue);
          return;
        }
        this.control.updateValueAndValidity();
      });
    }
  }
}

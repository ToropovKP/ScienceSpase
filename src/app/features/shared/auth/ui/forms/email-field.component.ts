import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-email-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule],
  templateUrl: './email-field.component.html',
  styleUrls: ['./email-field.component.css']
})
export class EmailFieldComponent {
  @Input() label: string = 'Почта';
  @Input() id: string = '';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() placeholder: string = '';
  /** Подсветка ошибки без невалидного контрола (например, ответ сервера «неверный логин/пароль»). */
  @Input() highlightError = false;

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }

  showErrorVisual(): boolean {
    return this.hasError() || this.highlightError;
  }

  /** Chrome подставляет почту без события input — ловим по анимации :-webkit-autofill. */
  onEmailAutofillAnimation(event: AnimationEvent): void {
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


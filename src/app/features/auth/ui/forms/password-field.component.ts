import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IftaLabelModule, PasswordModule],
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

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }
}


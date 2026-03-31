import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-email-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IftaLabelModule, InputTextModule],
  templateUrl: './email-field.component.html',
  styleUrls: ['./email-field.component.css']
})
export class EmailFieldComponent {
  @Input() label: string = 'Почта';
  @Input() id: string = '';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() placeholder: string = '';

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }
}


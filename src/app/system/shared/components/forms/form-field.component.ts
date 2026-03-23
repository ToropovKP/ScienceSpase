import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IftaLabelModule, InputTextModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() id: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() placeholder: string = '';
  @Input() autocomplete: string = 'off';
  @Input() maxlength?: number;

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }
}


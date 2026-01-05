import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-phone-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IftaLabelModule, InputTextModule, NgxMaskDirective],
  templateUrl: './phone-field.component.html',
  styleUrls: ['./phone-field.component.css']
})
export class PhoneFieldComponent {
  @Input() label: string = 'Номер телефона';
  @Input() id: string = '';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() placeholder: string = '';

  hasError(): boolean {
    return this.control ? (this.control.invalid && this.control.touched) : false;
  }
}


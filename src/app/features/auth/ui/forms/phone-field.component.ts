import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { NgxMaskDirective } from 'ngx-mask';
import { DropdownModule } from 'primeng/dropdown';
import { PrimeTemplate } from 'primeng/api';
import {
  PHONE_COUNTRIES,
  PhoneCountryId,
  getPhoneCountry
} from '../../../../shared/lib/phone-country';

@Component({
  selector: 'app-phone-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    NgxMaskDirective,
    DropdownModule,
    PrimeTemplate
  ],
  templateUrl: './phone-field.component.html',
  styleUrls: ['./phone-field.component.css']
})
export class PhoneFieldComponent {
  @Input() label: string = 'Номер телефона';
  @Input() id: string = '';
  @Input() required: boolean = false;
  @Input() control!: FormControl;
  @Input() countryControl!: FormControl<PhoneCountryId>;
  @Input() placeholder: string = '';
  /** Селектор страны только в регистрации; в ЛК и формах работы — только маска по стране из данных */
  @Input() showCountrySelector = false;
  @Input() readonly = false;
  /** Лейбл над полем (как у «Почта»), классы задаёт родитель — Tailwind или Bootstrap */
  @Input() labelClass = '';
  @Input() inputClass = '';

  readonly countries = PHONE_COUNTRIES;

  get maskStr(): string {
    return getPhoneCountry(this.countryControl.value).mask;
  }

  get prefixStr(): string {
    return getPhoneCountry(this.countryControl.value).prefix;
  }

  get isInteractionDisabled(): boolean {
    return this.readonly || !!this.control?.disabled;
  }

  hasError(): boolean {
    return this.control ? this.control.invalid && this.control.touched : false;
  }

  get dropdownDisabled(): boolean {
    return this.readonly || !!this.countryControl?.disabled;
  }
}

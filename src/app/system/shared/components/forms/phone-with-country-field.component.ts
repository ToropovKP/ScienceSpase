import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRIES,
  PHONE_COUNTRY_MAP,
  PhoneCountryCode,
  PhoneCountryConfig
} from './phone-country.config';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-phone-with-country-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  templateUrl: './phone-with-country-field.component.html',
  styleUrls: ['./phone-with-country-field.component.css']
})
export class PhoneWithCountryFieldComponent implements OnInit, OnChanges, OnDestroy {
  @Input() id: string = '';
  @Input() label: string = 'Номер телефона';
  @Input() required: boolean = false;
  @Input() mode: 'register' | 'readonly' = 'register';
  @Input() phoneControl?: FormControl;
  @Input() countryControl?: FormControl;
  @Input() phoneNumber: string | null | undefined = '';
  @Input() countryCode: string | null | undefined = DEFAULT_PHONE_COUNTRY_CODE;
  @Input() placeholder: string = '';

  readonly countries = PHONE_COUNTRIES;
  selectedCountry: PhoneCountryConfig = PHONE_COUNTRY_MAP[DEFAULT_PHONE_COUNTRY_CODE];

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.syncCountry();
    this.bindCountryControl();
    this.syncPhoneValidators();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.syncCountry();
    this.syncPhoneValidators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasError(): boolean {
    if (!this.phoneControl) {
      return false;
    }
    return this.phoneControl.invalid && this.phoneControl.touched;
  }

  get readonlyPhoneDisplay(): string {
    const digits = (this.phoneNumber ?? '').replace(/\D/g, '');
    return this.applyMask(this.selectedCountry.mask, digits);
  }

  private bindCountryControl(): void {
    if (!this.countryControl) {
      return;
    }
    this.countryControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncCountry();
        this.syncPhoneValidators();
      });
  }

  private syncCountry(): void {
    const resolvedCode = this.resolveCountryCode();
    this.selectedCountry = PHONE_COUNTRY_MAP[resolvedCode];

    if (this.countryControl && this.countryControl.value !== resolvedCode) {
      this.countryControl.setValue(resolvedCode, { emitEvent: false });
    }
  }

  private resolveCountryCode(): PhoneCountryCode {
    const controlCode = this.countryControl?.value;
    const inputCode = this.countryCode;
    const code = (controlCode ?? inputCode ?? DEFAULT_PHONE_COUNTRY_CODE) as PhoneCountryCode;
    return PHONE_COUNTRY_MAP[code] ? code : DEFAULT_PHONE_COUNTRY_CODE;
  }

  private syncPhoneValidators(): void {
    if (!this.phoneControl || this.mode !== 'register') {
      return;
    }

    const validators: ValidatorFn[] = [
      Validators.required,
      Validators.minLength(this.selectedCountry.numberLength),
      Validators.maxLength(this.selectedCountry.numberLength),
      Validators.pattern(/^\d+$/)
    ];

    this.phoneControl.setValidators(validators);
    this.phoneControl.updateValueAndValidity({ emitEvent: false });
  }

  private applyMask(mask: string, digits: string): string {
    let digitIndex = 0;
    let result = '';
    for (const char of mask) {
      if (char === '0') {
        if (digitIndex >= digits.length) {
          break;
        }
        result += digits[digitIndex];
        digitIndex += 1;
        continue;
      }
      if (digitIndex > 0 || digits.length > 0) {
        result += char;
      }
    }
    return result;
  }
}

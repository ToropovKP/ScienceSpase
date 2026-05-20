import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { PopoverModule } from 'primeng/popover';
import { NumbersOnlyDirective } from '../../../../shared/lib/directives/numbers-only.directive';
import { PhoneFieldComponent } from '../../../shared/auth/ui/forms/phone-field.component';
import { PhoneCountryId } from '../../../../shared/lib/phone-country';

@Component({
  selector: 'app-job-contact-info-form',
  templateUrl: './job-contact-info-form.component.html',
  styleUrls: ['./job-contact-info-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    PopoverModule,
    NumbersOnlyDirective,
    PhoneFieldComponent
  ]
})
export class JobContactInfoFormComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) customOrcidPattern!: Record<string, { pattern: RegExp }>;

  get phoneControl() {
    return this.formJob.get('phone') as FormControl;
  }

  get phoneCountryControl() {
    return this.formJob.get('phoneCountry') as FormControl<PhoneCountryId>;
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { PopoverModule } from 'primeng/popover';
import { NumbersOnlyDirective } from '../../../shared/lib/directives/numbers-only.directive';

@Component({
  selector: 'app-job-contact-info-form',
  templateUrl: './job-contact-info-form.component.html',
  styleUrls: ['./job-contact-info-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, PopoverModule, NumbersOnlyDirective]
})
export class JobContactInfoFormComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) customOrcidPattern!: Record<string, { pattern: RegExp }>;
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { orcidPattern } from '../../../../app.constants';
import { FileMetadata } from '../../../../entities/shared/common/model/file.metadata';
import { PhoneFieldComponent } from '../../../shared/auth/ui/forms/phone-field.component';
import { FormControl } from '@angular/forms';
import { PhoneCountryId } from '../../../../shared/lib/phone-country';

@Component({
  selector: 'app-job-readonly-details',
  templateUrl: './job-readonly-details.component.html',
  styleUrls: ['./job-readonly-details.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, PhoneFieldComponent]
})
export class JobReadonlyDetailsComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) customOrcidPattern!: typeof orcidPattern;
  @Input({ required: true }) files!: FileMetadata[];

  @Output() fileDownload = new EventEmitter<string>();

  get phoneControl() {
    return this.formJob.get('phone') as FormControl;
  }

  get phoneCountryControl() {
    return this.formJob.get('phoneCountry') as FormControl<PhoneCountryId>;
  }

  onDownload(uuid: string) {
    this.fileDownload.emit(uuid);
  }
}

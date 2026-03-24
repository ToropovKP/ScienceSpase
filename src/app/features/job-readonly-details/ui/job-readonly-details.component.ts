import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { orcidPattern } from '../../../app.constants';
import { FileMetadata } from '../../../entities/common/model/file.metadata';

@Component({
  selector: 'app-job-readonly-details',
  templateUrl: './job-readonly-details.component.html',
  styleUrls: ['./job-readonly-details.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective]
})
export class JobReadonlyDetailsComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) customOrcidPattern!: typeof orcidPattern;
  @Input({ required: true }) files!: FileMetadata[];

  @Output() fileDownload = new EventEmitter<string>();

  onDownload(uuid: string) {
    this.fileDownload.emit(uuid);
  }
}

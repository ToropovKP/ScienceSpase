import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { conferenceStatusList } from '../../../app.constants';

@Component({
  selector: 'app-conference-main-fields',
  templateUrl: './conference-main-fields.component.html',
  styleUrls: ['./conference-main-fields.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceMainFieldsComponent {
  protected readonly conferenceStatusList = conferenceStatusList;

  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) minDate!: Date;
  @Input({ required: true }) maxDate!: Date;
  @Input({ required: true }) canEdit!: boolean;

  @Output() statusChange = new EventEmitter<Event>();

  onStatusChange(event: Event) {
    this.statusChange.emit(event);
  }
}

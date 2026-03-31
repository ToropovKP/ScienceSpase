import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserBase } from '../../../entities/user/model/user.base';

@Component({
  selector: 'app-conference-admins-selector',
  templateUrl: './conference-admins-selector.component.html',
  styleUrls: ['./conference-admins-selector.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceAdminsSelectorComponent {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) admins!: UserBase[];
  @Output() adminSelectionChange = new EventEmitter<void>();

  onAdminCheckboxChange() {
    this.adminSelectionChange.emit();
  }
}

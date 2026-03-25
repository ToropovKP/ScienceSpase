import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Conference } from '../../../entities/conference/model/conference';
import { Section } from '../../../entities/conference/model/section';

@Component({
  selector: 'app-job-context-selector',
  templateUrl: './job-context-selector.component.html',
  styleUrls: ['./job-context-selector.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class JobContextSelectorComponent {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) conferences!: Conference[];
  @Input({ required: true }) sections!: Section[];
  @Input({ required: true }) loading!: boolean;

  /** Без compareWith нативный select с [ngValue] часто не показывает выбранное значение (другая ссылка / bigint id). */
  compareConference = (a: Conference | null | undefined, b: Conference | null | undefined): boolean => {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return String(a.id) === String(b.id);
  };

  compareSection = (a: Section | null | undefined, b: Section | null | undefined): boolean => {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return String(a.id) === String(b.id);
  };

  getShortConferenceTitle(conference: Conference | undefined): string {
    const title = conference?.title || '';
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  }
}

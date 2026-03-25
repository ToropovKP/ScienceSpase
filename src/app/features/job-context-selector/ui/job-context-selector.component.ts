import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Conference } from '../../../entities/conference/model/conference';
import { Section } from '../../../entities/conference/model/section';

@Component({
  selector: 'app-job-context-selector',
  templateUrl: './job-context-selector.component.html',
  styleUrls: ['./job-context-selector.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class JobContextSelectorComponent implements OnChanges {
  @Input({ required: true }) formJob!: FormGroup;
  @Input({ required: true }) conferences!: Conference[];
  @Input({ required: true }) sections!: Section[];
  @Input({ required: true }) loading!: boolean;
  @Input({ required: true }) isEditMode!: boolean;

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

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncControlDisabledState();
  }

  private syncControlDisabledState(): void {
    const conferenceCtrl = this.formJob.get('conference') as FormControl | null;
    const sectionCtrl = this.formJob.get('section') as FormControl | null;
    if (!conferenceCtrl || !sectionCtrl) {
      return;
    }

    const shouldDisableConference = this.loading;
    const shouldDisableSection = this.loading || this.sections.length === 0;

    // В режиме редактирования родитель сам управляет disabled'ами (конференция/секция),
    // поэтому после загрузки не включаем вручную, чтобы не перетереть логику родителя.
    if (shouldDisableConference) {
      conferenceCtrl.disable({ emitEvent: false });
    } else if (!this.isEditMode) {
      conferenceCtrl.enable({ emitEvent: false });
    }

    if (shouldDisableSection) {
      sectionCtrl.disable({ emitEvent: false });
    } else if (!this.isEditMode) {
      sectionCtrl.enable({ emitEvent: false });
    }
  }
}

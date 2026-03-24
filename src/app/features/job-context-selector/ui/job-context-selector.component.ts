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

  getShortConferenceTitle(conference: Conference | undefined): string {
    const title = conference?.title || '';
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  }
}

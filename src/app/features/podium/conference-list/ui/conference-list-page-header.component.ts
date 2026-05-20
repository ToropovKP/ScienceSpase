import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-conference-list-page-header',
  templateUrl: './conference-list-page-header.component.html',
  styleUrls: ['./conference-list-page-header.component.css'],
  imports: [CommonModule]
})
export class ConferenceListPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) showCreateButton!: boolean;
  @Input({ required: true }) createButtonLabel!: string;

  @Output() create = new EventEmitter<void>();
}

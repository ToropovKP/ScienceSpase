import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-conference-view-header',
  templateUrl: './conference-view-header.component.html',
  styleUrls: ['./conference-view-header.component.css'],
  imports: [CommonModule, Tooltip]
})
export class ConferenceViewHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) status!: string;
  @Input({ required: true }) statusLabel!: string;
  @Input({ required: true }) showAddJob!: boolean;
  @Input({ required: true }) showMyWorks!: boolean;
  @Input({ required: true }) showEditConference!: boolean;
  /** Показывать текст мобильного предупреждения для модератора конференции */
  @Input({ required: true }) isModeratorOfConference!: boolean;

  @Output() addJob = new EventEmitter<void>();
  @Output() myWorks = new EventEmitter<void>();
  @Output() editConference = new EventEmitter<void>();
}

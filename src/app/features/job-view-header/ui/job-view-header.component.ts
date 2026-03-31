import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-job-view-header',
  templateUrl: './job-view-header.component.html',
  styleUrls: ['./job-view-header.component.css'],
  imports: [CommonModule, Tooltip]
})
export class JobViewHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) isOwner!: boolean;
  @Input({ required: true }) allowEdit!: boolean;

  @Output() edit = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<Event>();

  onEdit() {
    this.edit.emit();
  }

  onDelete(event: Event) {
    this.deleteClick.emit(event);
  }
}

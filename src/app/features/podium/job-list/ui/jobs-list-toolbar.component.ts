import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbWrapperComponent } from '../../../../shared/ui/breadcrumb-wrapper.component';

@Component({
  selector: 'app-jobs-list-toolbar',
  templateUrl: './jobs-list-toolbar.component.html',
  styleUrls: ['./jobs-list-toolbar.component.css'],
  imports: [CommonModule, BreadcrumbWrapperComponent]
})
export class JobsListToolbarComponent {
  @Input({ required: true }) showToolbar!: boolean;
  @Input() homeItem: MenuItem | undefined;
  @Input() breadcrumbItems: MenuItem[] | undefined;
  @Input({ required: true }) showAddButton!: boolean;

  @Output() addJob = new EventEmitter<void>();
}

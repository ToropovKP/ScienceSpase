import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Job } from '../../../entities/job/model/job';

@Component({
  selector: 'app-job-catalog-grid',
  templateUrl: './job-catalog-grid.component.html',
  styleUrls: ['./job-catalog-grid.component.css'],
  imports: [CommonModule]
})
export class JobCatalogGridComponent {
  @Input({ required: true }) jobs!: Job[];
  @Input({ required: true }) currentUserId!: bigint;

  @Output() openJob = new EventEmitter<bigint>();

  onOpen(id: bigint) {
    this.openJob.emit(id);
  }
}

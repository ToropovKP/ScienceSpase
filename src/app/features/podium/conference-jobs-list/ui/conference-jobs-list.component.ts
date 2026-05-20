import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Job } from '../../../../entities/podium/job/model/job';
import { DateService } from '../../../../shared/services/date.service';
import { ClickOutsideDirective } from '../../../../shared/lib/directives/click-outside.directive';

@Component({
  selector: 'app-conference-jobs-list',
  templateUrl: './conference-jobs-list.component.html',
  styleUrls: ['./conference-jobs-list.component.css'],
  imports: [CommonModule, ClickOutsideDirective]
})
export class ConferenceJobsListComponent {
  protected readonly DateService = DateService;
  protected readonly String = String;

  @Input({ required: true }) jobs!: Job[];
  @Input({ required: true }) sectionFilters!: string[];
  @Input({ required: true }) isReviewer!: boolean;

  @Output() openJob = new EventEmitter<string>();
  @Output() downloadJob = new EventEmitter<Job>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  sectionFilterOpen = false;
  selectedSections: string[] = [];

  get filteredJobs(): Job[] {
    if (!this.selectedSections.length) return this.jobs;
    return this.jobs.filter((job) => this.selectedSections.includes(job.sectionTitle));
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.jobs.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (column) {
        case 'userName':
          valueA = a.userName?.toLowerCase() || '';
          valueB = b.userName?.toLowerCase() || '';
          break;
        case 'title':
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          break;
        case 'sectionTitle':
          valueA = a.sectionTitle?.toLowerCase() || '';
          valueB = b.sectionTitle?.toLowerCase() || '';
          break;
        case 'dateTime':
          valueA = new Date(a.dateTime).getTime();
          valueB = new Date(b.dateTime).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  toggleSectionFilter(section: string) {
    if (this.selectedSections.includes(section)) {
      this.selectedSections = this.selectedSections.filter((s) => s !== section);
    } else {
      this.selectedSections = [...this.selectedSections, section];
    }
  }

  onOpenJob(id: string) {
    this.openJob.emit(id);
  }

  onDownloadJob(job: Job) {
    this.downloadJob.emit(job);
  }
}

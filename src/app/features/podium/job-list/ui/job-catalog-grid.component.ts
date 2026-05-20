import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Job } from '../../../../entities/podium/job/model/job';

@Component({
  selector: 'app-job-catalog-grid',
  templateUrl: './job-catalog-grid.component.html',
  styleUrls: ['./job-catalog-grid.component.css'],
  imports: [CommonModule]
})
export class JobCatalogGridComponent {
  @Input({ required: true }) jobs!: Job[];
  @Input({ required: true }) currentUserId!: bigint;
  @Input() isAdminView = false;

  @Output() openJob = new EventEmitter<bigint>();
  @Output() editJob = new EventEmitter<bigint>();
  @Output() reviewJob = new EventEmitter<bigint>();
  @Output() deleteJob = new EventEmitter<bigint>();

  onOpen(id: bigint) {
    this.openJob.emit(id);
  }

  onEdit(id: bigint) {
    this.editJob.emit(id);
  }

  onReview(id: bigint) {
    this.reviewJob.emit(id);
  }

  onDelete(id: bigint) {
    this.deleteJob.emit(id);
  }

  formatUploadedDate(value: Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Загружено: —';
    }

    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
    const year = date.getFullYear();

    return `Загружено: ${day} ${monthCapitalized} ${year} г.`;
  }

  getJobTags(job: Job): string[] {
    const tags = [job.sectionTitle, job.conferenceTitle].filter((item) => !!item && item.trim().length > 0);
    return Array.from(new Set(tags));
  }

  private toShortName(fullName: string | null | undefined): string {
    const raw = (fullName || '').trim();
    if (!raw) {
      return '—';
    }

    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0];
    }

    const lastName = parts[0];
    const firstInitial = parts[1]?.charAt(0)?.toUpperCase() || '';
    const middleInitial = parts[2]?.charAt(0)?.toUpperCase() || '';

    return `${lastName} ${firstInitial}.${middleInitial}.`.replace(/\.\s*$/, '.').trim();
  }

  getAuthorName(job: Job): string {
    return this.toShortName(job.userName);
  }

  getAuthorsLine(job: Job): string {
    const names = [this.getAuthorName(job)];
    if (job.coAuthors && job.coAuthors.length > 0) {
      names.push(...job.coAuthors.map((author) => this.toShortName(author.fullName)));
    }
    return names.join(', ');
  }

  getStatusChipClass(job: Job): string {
    switch (job.status) {
      case 'PENDING_REVIEW':
        return 'ui-status-chip--pending-review';
      case 'UNDER_REVISION':
        return 'ui-status-chip--needs-revision';
      case 'READY_FOR_PUBLICATION':
        return 'ui-status-chip--reviewed';
      case 'APPROVED':
        return 'ui-status-chip--approved';
      case 'REJECTED':
        return 'ui-status-chip--rejected';
      default:
        return 'ui-status-chip--submitted';
    }
  }

  getStatusChipIcon(job: Job): string {
    switch (job.status) {
      case 'PENDING_REVIEW':
      case 'UNDER_REVISION':
        return 'bi-question-circle';
      case 'READY_FOR_PUBLICATION':
        return 'bi-bookmark';
      case 'APPROVED':
        return 'bi-pen';
      case 'REJECTED':
        return 'bi-x-circle';
      default:
        return 'bi-check2-circle';
    }
  }

  getStatusChipLabel(job: Job): string {
    const isOwner = job.userId === this.currentUserId;

    if (job.status === 'PENDING_REVIEW') {
      return isOwner ? 'На проверке' : 'Требует проверки';
    }
    if (job.status === 'UNDER_REVISION') {
      return isOwner ? 'Требует доработки' : 'На доработке';
    }
    if (job.status === 'READY_FOR_PUBLICATION') {
      return 'Рецензирована';
    }
    if (job.status === 'APPROVED') {
      return 'Одобрена';
    }
    if (job.status === 'REJECTED') {
      return 'Отклонена';
    }
    if (job.status === 'PENDING_CHANGES') {
      return isOwner ? 'Отправлена' : 'Правки отправлены';
    }
    if (job.status === 'SUBMITTED') {
      return isOwner ? 'Отправлена' : 'Правки отправлены';
    }
    return isOwner ? 'Отправлена' : 'Правки отправлены';
  }
}

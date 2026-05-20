import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateService } from '../../../../shared/services/date.service';

@Component({
  selector: 'app-conference-summary-cards',
  templateUrl: './conference-summary-cards.component.html',
  styleUrls: ['./conference-summary-cards.component.css'],
  imports: [CommonModule]
})
export class ConferenceSummaryCardsComponent {
  protected readonly DateService = DateService;

  @Input({ required: true }) organization!: string;
  @Input({ required: true }) startDate!: Date;
  @Input({ required: true }) endDate!: Date;
  @Input({ required: true }) countUsers!: number;
  @Input() countUsersWithJob: number | null = null;
  @Input({ required: true }) showParticipantsColumn!: boolean;
  @Input({ required: true }) showParticipantsCount!: boolean;
  @Input({ required: true }) showParticipantsLink!: boolean;
  /** «Список участников» на странице конференции или «Скачать все» на списке работ */
  @Input() participantsLinkVariant: 'participants' | 'downloadAll' = 'participants';

  @Output() participantsClick = new EventEmitter<void>();
  @Output() downloadAllClick = new EventEmitter<void>();

  onParticipantsClick() {
    this.participantsClick.emit();
  }

  onDownloadAllClick() {
    this.downloadAllClick.emit();
  }
}

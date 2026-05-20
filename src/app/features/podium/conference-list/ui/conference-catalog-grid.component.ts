import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Conference } from '../../../../entities/podium/conference/model/conference';
import { conferenceStatusMap } from '../../../../app.constants';
import { DateService } from '../../../../shared/services/date.service';

@Component({
  selector: 'app-conference-catalog-grid',
  templateUrl: './conference-catalog-grid.component.html',
  styleUrls: ['./conference-catalog-grid.component.css'],
  imports: [CommonModule]
})
export class ConferenceCatalogGridComponent {
  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  @Input({ required: true }) conferences!: Conference[];

  @Output() openConference = new EventEmitter<bigint>();
  @Output() editConference = new EventEmitter<bigint>();

  onOpen(id: bigint) {
    this.openConference.emit(id);
  }

  onEdit(id: bigint) {
    this.editConference.emit(id);
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Section } from '../../../../entities/podium/conference/model/section';
import { UserBase } from '../../../../entities/shared/user/model/user.base';

@Component({
  selector: 'app-conference-sections-list',
  templateUrl: './conference-sections-list.component.html',
  styleUrls: ['./conference-sections-list.component.css'],
  imports: [CommonModule]
})
export class ConferenceSectionsListComponent {
  @Input({ required: true }) sections!: Section[];

  getLeadersString(leaders: UserBase[]): string {
    return leaders
      .map(
        (lead) =>
          lead.lastName +
          ' ' +
          lead.firstName +
          (lead.middleName !== '' ? ' ' + lead.middleName : '')
      )
      .join(', ');
  }
}

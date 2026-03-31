import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Conference } from '../../../entities/conference/model/conference';
import { User } from '../../../entities/user/model/user';

@Component({
  selector: 'app-job-conference-summary',
  templateUrl: './job-conference-summary.component.html',
  styleUrls: ['./job-conference-summary.component.css'],
  imports: [CommonModule]
})
export class JobConferenceSummaryComponent {
  @Input({ required: true }) currentConference!: Conference;
  @Input({ required: true }) jobUser!: User;
  @Input({ required: true }) showAuthorColumn!: boolean;
}

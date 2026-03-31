import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-conference-jobs-header',
  templateUrl: './conference-jobs-header.component.html',
  styleUrls: ['./conference-jobs-header.component.css'],
  imports: [CommonModule]
})
export class ConferenceJobsHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) status!: string;
  @Input({ required: true }) statusLabel!: string;
}

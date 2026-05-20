import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-conference-description-card',
  templateUrl: './conference-description-card.component.html',
  styleUrls: ['./conference-description-card.component.css'],
  imports: [CommonModule]
})
export class ConferenceDescriptionCardComponent {
  @Input({ required: true }) description!: string;
}

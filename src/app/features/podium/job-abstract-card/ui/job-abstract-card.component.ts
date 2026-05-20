import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-job-abstract-card',
  templateUrl: './job-abstract-card.component.html',
  styleUrls: ['./job-abstract-card.component.css'],
  imports: [CommonModule]
})
export class JobAbstractCardComponent {
  @Input({ required: true }) description!: string;
}

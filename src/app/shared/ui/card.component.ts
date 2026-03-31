import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() headerTitle?: string;
  @Input() headerIcon?: string;
  @Input() headerClass: string = 'bg-primary text-white';
  @Input() showFooter: boolean = false;
  @Input() shadow: boolean = true;
}

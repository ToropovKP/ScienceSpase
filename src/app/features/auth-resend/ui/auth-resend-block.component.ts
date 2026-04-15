import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-auth-resend-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-resend-block.component.html',
  styleUrl: './auth-resend-block.component.css',
})
export class AuthResendBlockComponent {
  @Input() leadText = 'Не получили письмо?';
  @Input() waiting = false;
  @Input() countdownLabel = '00:00';
  @Input() extraClass = '';
  @Output() resendClick = new EventEmitter<Event>();

  onClick(event: Event): void {
    this.resendClick.emit(event);
  }
}

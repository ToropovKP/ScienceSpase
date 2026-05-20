import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-podium-search-line',
  templateUrl: './podium-search-line.component.html',
  styleUrls: ['./podium-search-line.component.css'],
  imports: [CommonModule]
})
export class PodiumSearchLineComponent {
  @Input() searchQuery = '';
  @Input() searchPlaceholder = 'Поиск';
  @Input() showFilterControls = true;
  @Input() bordered = true;

  @Output() searchChange = new EventEmitter<string>();

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }
}

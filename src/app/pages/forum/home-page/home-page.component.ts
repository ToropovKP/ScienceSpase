import { Component } from '@angular/core';
import { FilterBarComponent } from '../../../widgets/forum/filter-bar/filter-bar.component';
import { PublicationCardsGridComponent } from '../../../widgets/forum/publication-cards-grid/publication-cards-grid.component';

@Component({
  selector: 'app-forum-home-page',
  imports: [FilterBarComponent, PublicationCardsGridComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  viewMode: 'list' | 'grid' = 'grid';
  searchQuery: string = '';
  authorFilter: string = '';
  yearFilter: number | null = null;

  onViewModeChange(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
  }

  onAuthorFilterChange(author: string): void {
    this.authorFilter = author;
  }

  onYearFilterChange(year: number | null): void {
    this.yearFilter = year;
  }
}

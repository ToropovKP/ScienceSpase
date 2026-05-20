import { Component, EventEmitter, Output, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AuthorResponse,
  PublicationResponse,
  PublicationService,
} from '../../../entities/forum/publication/api/publication.service';

@Component({
  selector: 'app-forum-filter-bar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent implements OnInit {
  @Output() viewModeChange = new EventEmitter<'list' | 'grid'>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() authorFilterChange = new EventEmitter<string>();
  @Output() yearFilterChange = new EventEmitter<number | null>();
  
  viewMode: 'list' | 'grid' = 'grid';
  searchQuery: string = '';
  authorFilter: string = '';
  yearFilter: number | null = null;
  showFilters: boolean = false;
  
  // Списки для выпадающих меню
  allAuthors: string[] = [];
  allYears: number[] = [];
  
  // Фильтрованные списки для отображения
  filteredAuthors: string[] = [];
  filteredYears: number[] = [];
  
  // Состояния выпадающих списков
  showAuthorDropdown: boolean = false;
  showYearDropdown: boolean = false;
  
  private searchTimeout: any;
  private authorFilterTimeout: any;
  private yearFilterTimeout: any;
  private publicationService = inject(PublicationService);

  ngOnInit(): void {
    // Загружаем опции фильтрации только при необходимости
    // Не блокируем загрузку страницы
    setTimeout(() => {
      this.loadFilterOptions();
    }, 100);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInsideDropdown = target.closest('.filter__dropdown-container');
    const isInsidePopup = target.closest('.filter__popup');
    const isFilterButton = target.closest('.filter__menu-filterBtn');
    
    if (!isInsideDropdown && !isFilterButton) {
      this.showAuthorDropdown = false;
      this.showYearDropdown = false;
    }
    
    // Закрываем всплывающее окно при клике вне его
    if (!isInsidePopup && !isFilterButton && this.showFilters) {
      // Не закрываем автоматически, только выпадающие списки
    }
  }

  loadFilterOptions(): void {
    // Загружаем публикации для получения списка авторов и годов
    // Используем разумный размер страницы, чтобы не перегружать сервер
    // Если опции уже загружены, не загружаем повторно
    if (this.allAuthors.length > 0 || this.allYears.length > 0) {
      return;
    }

    this.publicationService.searchPublications({ page: 1, size: 500 }).subscribe({
      next: (response) => {
        if (!response || !response.content) {
          return;
        }

        const authorsSet = new Set<string>();
        const yearsSet = new Set<number>();

        response.content.forEach((pub: PublicationResponse) => {
          if (pub.authors && Array.isArray(pub.authors)) {
            pub.authors.forEach((author: AuthorResponse) => {
              if (author && author.lastName) {
                const fullName = this.formatAuthorName(author);
                if (fullName) {
                  authorsSet.add(fullName);
                }
              }
            });
          }

          if (pub.publicationDate) {
            try {
              const date = new Date(pub.publicationDate);
              const year = date.getFullYear();
              if (year && !isNaN(year) && year >= 1900 && year <= 2100) {
                yearsSet.add(year);
              }
            } catch (e) {
              // ignore invalid dates
            }
          }
        });

        this.allAuthors = Array.from(authorsSet).sort();
        this.allYears = Array.from(yearsSet).sort((a, b) => b - a);
        this.filteredAuthors = this.allAuthors;
        this.filteredYears = this.allYears;
      },
      error: () => {
        this.allAuthors = [];
        this.allYears = [];
        this.filteredAuthors = [];
        this.filteredYears = [];
      },
    });
  }

  formatAuthorName(author: AuthorResponse): string {
    if (!author || !author.lastName) return '';
    const parts: string[] = [author.lastName];
    if (author.firstName) {
      parts.push(author.firstName.charAt(0).toUpperCase() + '.');
    }
    if (author.middleName) {
      parts.push(author.middleName.charAt(0).toUpperCase() + '.');
    }
    return parts.join(' ');
  }

  onViewModeChange(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  onSearch(): void {
    this.searchChange.emit(this.searchQuery.trim());
  }

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.searchChange.emit(this.searchQuery.trim());
    }, 500);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.showAuthorDropdown = false;
      this.showYearDropdown = false;
    } else {
      // Загружаем опции фильтрации при открытии фильтров, если еще не загружены
      if (this.allAuthors.length === 0 && this.allYears.length === 0) {
        this.loadFilterOptions();
      }
    }
  }

  onAuthorInput(): void {
    const query = (this.authorFilter || '').toLowerCase().trim();
    this.filteredAuthors = this.allAuthors.filter(author => 
      author.toLowerCase().includes(query)
    );
    this.showAuthorDropdown = true;
  }

  onAuthorSelect(author: string): void {
    // При выборе из списка используем полное имя
    this.authorFilter = author;
    this.showAuthorDropdown = false;
    this.onAuthorFilterChange();
  }

  onAuthorFilterChange(): void {
    if (this.authorFilterTimeout) {
      clearTimeout(this.authorFilterTimeout);
    }
    
    this.authorFilterTimeout = setTimeout(() => {
      this.authorFilterChange.emit(this.authorFilter.trim());
    }, 300);
  }

  onYearInput(): void {
    const query = this.yearFilter?.toString() || '';
    if (query) {
      this.filteredYears = this.allYears.filter(year => 
        year.toString().includes(query)
      );
    } else {
      this.filteredYears = this.allYears;
    }
    this.showYearDropdown = true;
  }

  onYearSelect(year: number): void {
    this.yearFilter = year;
    this.showYearDropdown = false;
    this.onYearFilterChange();
  }

  onYearFilterChange(): void {
    if (this.yearFilterTimeout) {
      clearTimeout(this.yearFilterTimeout);
    }
    
    this.yearFilterTimeout = setTimeout(() => {
      const year = this.yearFilter && this.yearFilter > 0 ? this.yearFilter : null;
      this.yearFilterChange.emit(year);
    }, 300);
  }

  clearFilters(): void {
    this.authorFilter = '';
    this.yearFilter = null;
    this.authorFilterChange.emit('');
    this.yearFilterChange.emit(null);
    this.filteredAuthors = this.allAuthors;
    this.filteredYears = this.allYears;
  }
}

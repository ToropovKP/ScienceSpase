import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardMComponent } from '../../../entities/forum/publication/ui/card-m/card-m.component';
import { CardLComponent } from '../../../entities/forum/publication/ui/card-l/card-l.component';
import {
  AuthorResponse,
  PageResponse,
  PublicationResponse,
  PublicationService,
  SearchPublicationsParams,
} from '../../../entities/forum/publication/api/publication.service';

@Component({
  selector: 'app-forum-publication-cards-grid',
  imports: [CommonModule, CardMComponent, CardLComponent],
  templateUrl: './publication-cards-grid.component.html',
  styleUrl: './publication-cards-grid.component.scss',
})
export class PublicationCardsGridComponent implements OnInit, OnChanges {
  @Input() viewMode: 'list' | 'grid' = 'grid';
  @Input() searchQuery: string = '';
  @Input() authorFilter: string = '';
  @Input() yearFilter: number | null = null;
  
  publications: PublicationResponse[] = [];
  loading: boolean = false;
  error: string | null = null;

  private publicationService = inject(PublicationService);

  ngOnInit(): void {
    this.loadPublications();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Перезагружаем публикации при изменении любого фильтра
    // Но не при первой инициализации (firstChange)
    const shouldReload = 
      (changes['searchQuery'] && !changes['searchQuery'].firstChange) ||
      (changes['authorFilter'] && !changes['authorFilter'].firstChange) ||
      (changes['yearFilter'] && !changes['yearFilter'].firstChange);
    
    if (shouldReload) {
      this.loadPublications();
    }
  }

  loadPublications(): void {
    this.loading = true;
    this.error = null;

    const params: SearchPublicationsParams = {
      page: 1,
      size: 50,
    };

    if (this.searchQuery && this.searchQuery.trim()) {
      params.title = this.searchQuery.trim();
    }

    if (this.authorFilter && this.authorFilter.trim()) {
      params.author = this.authorFilter.trim();
    }

    if (this.yearFilter && this.yearFilter > 0) {
      params.publicationYear = this.yearFilter;
    }

    this.publicationService.searchPublications(params).subscribe({
      next: (response: PageResponse<PublicationResponse>) => {
        this.publications = response?.content ?? [];
        this.loading = false;
        this.error = null;
      },
      error: (error: any) => {
        this.error =
          error?.error?.error ||
          error?.error?.message ||
          error?.message ||
          'Не удалось загрузить публикации';
        this.publications = [];
        this.loading = false;
      },
    });
  }

  getKindLabel(kind?: string): string {
    if (!kind) return '';
    const types: Record<string, string> = {
      PATENT: 'Патент',
      BOOK: 'Книга',
      JOURNAL_ARTICLE: 'Статья в журнале',
      CONFERENCE: 'Конференция',
      ARCHIVE: 'Архив',
      DISSERTATION: 'Диссертация',
      SOFTWARE: 'Программное обеспечение',
    };
    return types[kind] || kind;
  }

  getAuthorsString(authors?: AuthorResponse[]): string {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return 'Автор не указан';
    }

    const validAuthors = authors.filter(
      (a) => a && a.lastName && typeof a.lastName === 'string' && a.lastName.trim().length > 0,
    );

    if (validAuthors.length === 0) {
      return 'Автор не указан';
    }

    const formatAuthor = (author: AuthorResponse): string => {
      const lastName = author.lastName || '';
      const firstInitial = author.firstName?.trim()
        ? author.firstName.trim().charAt(0).toUpperCase() + '.'
        : '';
      const middleInitial = author.middleName?.trim()
        ? author.middleName.trim().charAt(0).toUpperCase() + '.'
        : '';
      return [lastName, firstInitial, middleInitial].filter(Boolean).join(' ');
    };

    if (validAuthors.length > 2) {
      return `${validAuthors.slice(0, 2).map(formatAuthor).join(', ')} и др.`;
    }
    return validAuthors.map(formatAuthor).join(', ');
  }
}

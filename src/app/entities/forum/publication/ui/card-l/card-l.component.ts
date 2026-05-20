import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AuthorResponse,
  PublicationKind,
  PublicationResponse,
} from '../../api/publication.service';

@Component({
  selector: 'app-forum-card-l',
  imports: [CommonModule],
  templateUrl: './card-l.component.html',
  styleUrl: './card-l.component.scss',
  standalone: true,
})
export class CardLComponent {
  @Input() publication?: PublicationResponse;

  getKindLabel(kind?: PublicationKind | string): string {
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

  getYear(date?: string): string {
    if (!date) return '';
    return new Date(date).getFullYear().toString();
  }
}

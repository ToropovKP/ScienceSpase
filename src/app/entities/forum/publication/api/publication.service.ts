import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseUrl } from '../../../../app.constants';

const PUBLICATIONS_URL = `${baseUrl}/api/v1/publications`;

export type PublicationKind =
  | 'PATENT'
  | 'BOOK'
  | 'JOURNAL_ARTICLE'
  | 'CONFERENCE'
  | 'ARCHIVE'
  | 'DISSERTATION'
  | 'SOFTWARE';

export interface AuthorDto {
  lastName: string;
  firstName: string;
  middleName?: string;
  affiliation?: string;
  role?: string;
  authorType?: string;
}

export interface CodeDto {
  codeType: string;
  codeValue: string;
  description?: string;
}

export interface FileMetadataDto {
  uuid?: string;
  name?: string;
  size?: number;
  contentType?: string;
}

export interface PatentDto {
  patentNumber?: string;
  applicationNumber?: string;
  applicationDate?: string;
  patentOwners?: string;
}

export interface BookDto {
  publisher?: string;
  publisherPlace?: string;
  publicationYear?: string;
  isbn?: string;
  volume?: string;
  pages?: string;
}

export interface JournalArticleDto {
  journalName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  issn?: string;
}

export interface ConferenceDto {
  conferenceName?: string;
  conferenceDate?: string;
  location?: string;
  organizer?: string;
  pages?: string;
}

export interface ArchiveDto {
  archiveName?: string;
  archiveDate?: string;
  archiveLocation?: string;
}

export interface DissertationDto {
  academicDegree?: string;
  speciality?: string;
  defenseDate?: string;
  institution?: string;
}

export interface SoftwareDto {
  programLanguage?: string;
  operatingSystem?: string;
  databaseVersion?: string;
  softwareType?: string;
}

export interface CreatePublicationRequest {
  title: string;
  abstractText?: string;
  publicationDate?: string;
  language?: string;
  keywords?: string;
  publicationType?: string;
  publicationCategory?: string;
  publicationKind: PublicationKind;
  authors?: AuthorDto[];
  codes?: CodeDto[];
  files?: FileMetadataDto[];
  patent?: PatentDto;
  book?: BookDto;
  journalArticle?: JournalArticleDto;
  conference?: ConferenceDto;
  archive?: ArchiveDto;
  dissertation?: DissertationDto;
  software?: SoftwareDto;
}

export interface AuthorResponse {
  id: number;
  lastName: string;
  firstName: string;
  middleName?: string;
  affiliation?: string;
  role?: string;
  authorType?: string;
}

export interface CodeResponse {
  id: number;
  codeType: string;
  codeValue: string;
  description?: string;
}

export interface PublicationResponse {
  id: number;
  title: string;
  abstractText?: string;
  publicationDate?: string;
  language?: string;
  keywords?: string;
  publicationType?: string;
  publicationCategory?: string;
  publicationKind: PublicationKind;
  userId: number;
  basket: boolean;
  favorite: boolean;
  deletionDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  authors?: AuthorResponse[];
  codes?: CodeResponse[];
  files?: FileMetadataDto[];
  patent?: PatentDto & { id?: number };
  book?: BookDto & { id?: number };
  journalArticle?: JournalArticleDto & { id?: number };
  conference?: ConferenceDto & { id?: number };
  archive?: ArchiveDto & { id?: number };
  dissertation?: DissertationDto & { id?: number };
  software?: SoftwareDto & { id?: number };
}

export interface SearchPublicationsRequest {
  title?: string | null;
  author?: string | null;
  publicationYear?: number | null;
  publicationKind?: PublicationKind | null;
  basket?: boolean | null;
  favorite?: boolean | null;
}

export interface SearchPublicationsParams extends SearchPublicationsRequest {
  /** 1-indexed (бэкенд по умолчанию начинает с 1). */
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PublicationService {
  private readonly http = inject(HttpClient);

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  createPublication(request: CreatePublicationRequest): Observable<PublicationResponse> {
    return this.http.post<PublicationResponse>(PUBLICATIONS_URL, request, {
      headers: this.buildHeaders(),
    });
  }

  searchPublications(params: SearchPublicationsParams): Observable<PageResponse<PublicationResponse>> {
    const { page, size, ...body } = params;

    let httpParams = new HttpParams();
    if (page !== undefined && page !== null) {
      httpParams = httpParams.set('page', String(page));
    }
    if (size !== undefined && size !== null) {
      httpParams = httpParams.set('size', String(size));
    }

    const cleanedBody: SearchPublicationsRequest = {};
    (Object.keys(body) as (keyof SearchPublicationsRequest)[]).forEach((key) => {
      const value = body[key];
      if (value !== undefined && value !== null && value !== '') {
        (cleanedBody as Record<string, unknown>)[key] = value;
      }
    });

    return this.http.post<PageResponse<PublicationResponse>>(
      `${PUBLICATIONS_URL}/search`,
      cleanedBody,
      { headers: this.buildHeaders(), params: httpParams },
    );
  }

  getAllPublications(): Observable<PublicationResponse[]> {
    return this.http.get<PublicationResponse[]>(PUBLICATIONS_URL, {
      headers: this.buildHeaders(),
    });
  }

  updateFavorite(id: number, favorite: boolean): Observable<void> {
    return this.http.put<void>(`${PUBLICATIONS_URL}/favorite?id=${id}`, { favorite }, {
      headers: this.buildHeaders(),
    });
  }

  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${PUBLICATIONS_URL}/delete?id=${id}`, {
      headers: this.buildHeaders(),
    });
  }

  restore(id: number): Observable<void> {
    return this.http.post<void>(`${PUBLICATIONS_URL}/restore?id=${id}`, {}, {
      headers: this.buildHeaders(),
    });
  }

  deletePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${PUBLICATIONS_URL}/delete/permanent?id=${id}`, {
      headers: this.buildHeaders(),
    });
  }
}

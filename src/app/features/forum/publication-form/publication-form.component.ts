import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreatePublicationRequest,
  PublicationKind,
  PublicationService,
} from '../../../entities/forum/publication/api/publication.service';

@Component({
  selector: 'app-forum-publication-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './publication-form.component.html',
  styleUrl: './publication-form.component.scss',
  standalone: true,
})
export class PublicationFormComponent {
  publicationForm: FormGroup;
  publicationKinds: { value: PublicationKind; label: string }[] = [
    { value: 'PATENT', label: 'Патент' },
    { value: 'BOOK', label: 'Книга' },
    { value: 'JOURNAL_ARTICLE', label: 'Статья в журнале' },
    { value: 'CONFERENCE', label: 'Конференция' },
    { value: 'ARCHIVE', label: 'Архив' },
    { value: 'DISSERTATION', label: 'Диссертация' },
    { value: 'SOFTWARE', label: 'Программное обеспечение' },
  ];

  constructor(
    private fb: FormBuilder,
    private publicationService: PublicationService,
    private router: Router,
  ) {
    this.publicationForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(500)]],
      abstractText: [''],
      publicationDate: [''],
      language: [''],
      keywords: [''],
      publicationType: [''],
      publicationCategory: [''],
      publicationKind: ['', Validators.required],

      authors: this.fb.array([]),
      codes: this.fb.array([]),

      patent: this.fb.group({
        patentNumber: [''],
        applicationNumber: [''],
        applicationDate: [''],
        patentOwners: [''],
      }),
      book: this.fb.group({
        publisher: [''],
        publisherPlace: [''],
        publicationYear: [''],
        isbn: [''],
        volume: [''],
        pages: [''],
      }),
      journalArticle: this.fb.group({
        journalName: [''],
        volume: [''],
        issue: [''],
        pages: [''],
        doi: [''],
        issn: [''],
      }),
      conference: this.fb.group({
        conferenceName: [''],
        conferenceDate: [''],
        location: [''],
        organizer: [''],
        pages: [''],
      }),
      archive: this.fb.group({
        archiveName: [''],
        archiveDate: [''],
        archiveLocation: [''],
      }),
      dissertation: this.fb.group({
        academicDegree: [''],
        speciality: [''],
        defenseDate: [''],
        institution: [''],
      }),
      software: this.fb.group({
        programLanguage: [''],
        operatingSystem: [''],
        databaseVersion: [''],
        softwareType: [''],
      }),
    });
  }

  get authors(): FormArray {
    return this.publicationForm.get('authors') as FormArray;
  }

  get codes(): FormArray {
    return this.publicationForm.get('codes') as FormArray;
  }

  addAuthor(): void {
    const authorGroup = this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      affiliation: [''],
      role: [''],
      authorType: [''],
    });
    this.authors.push(authorGroup);
  }

  removeAuthor(index: number): void {
    this.authors.removeAt(index);
  }

  addCode(): void {
    const codeGroup = this.fb.group({
      codeType: ['', Validators.required],
      codeValue: ['', Validators.required],
      description: [''],
    });
    this.codes.push(codeGroup);
  }

  removeCode(index: number): void {
    this.codes.removeAt(index);
  }

  getSelectedKind(): string {
    return this.publicationForm.get('publicationKind')?.value || '';
  }

  onSubmit(): void {
    if (!this.publicationForm.valid) {
      this.markFormGroupTouched(this.publicationForm);
      return;
    }

    const formValue = this.publicationForm.value;

    const request: CreatePublicationRequest = {
      title: formValue.title,
      abstractText: formValue.abstractText || undefined,
      publicationDate: formValue.publicationDate || undefined,
      language: formValue.language || undefined,
      keywords: formValue.keywords || undefined,
      publicationType: formValue.publicationType || undefined,
      publicationCategory: formValue.publicationCategory || undefined,
      publicationKind: formValue.publicationKind,
      authors:
        formValue.authors?.map((author: any) => ({
          lastName: author.lastName,
          firstName: author.firstName,
          middleName: author.middleName || undefined,
          affiliation: author.affiliation || undefined,
          role: author.role || undefined,
          authorType: author.authorType || undefined,
        })) || [],
      codes:
        formValue.codes?.map((code: any) => ({
          codeType: code.codeType,
          codeValue: code.codeValue,
          description: code.description || undefined,
        })) || [],
    };

    const kind = formValue.publicationKind as PublicationKind;
    if (kind === 'PATENT' && formValue.patent) {
      request.patent = {
        patentNumber: formValue.patent.patentNumber || undefined,
        applicationNumber: formValue.patent.applicationNumber || undefined,
        applicationDate: formValue.patent.applicationDate || undefined,
        patentOwners: formValue.patent.patentOwners || undefined,
      };
    } else if (kind === 'BOOK' && formValue.book) {
      request.book = {
        publisher: formValue.book.publisher || undefined,
        publisherPlace: formValue.book.publisherPlace || undefined,
        publicationYear: formValue.book.publicationYear || undefined,
        isbn: formValue.book.isbn || undefined,
        volume: formValue.book.volume || undefined,
        pages: formValue.book.pages || undefined,
      };
    } else if (kind === 'JOURNAL_ARTICLE' && formValue.journalArticle) {
      request.journalArticle = {
        journalName: formValue.journalArticle.journalName || undefined,
        volume: formValue.journalArticle.volume || undefined,
        issue: formValue.journalArticle.issue || undefined,
        pages: formValue.journalArticle.pages || undefined,
        doi: formValue.journalArticle.doi || undefined,
        issn: formValue.journalArticle.issn || undefined,
      };
    } else if (kind === 'CONFERENCE' && formValue.conference) {
      request.conference = {
        conferenceName: formValue.conference.conferenceName || undefined,
        conferenceDate: formValue.conference.conferenceDate || undefined,
        location: formValue.conference.location || undefined,
        organizer: formValue.conference.organizer || undefined,
        pages: formValue.conference.pages || undefined,
      };
    } else if (kind === 'ARCHIVE' && formValue.archive) {
      request.archive = {
        archiveName: formValue.archive.archiveName || undefined,
        archiveDate: formValue.archive.archiveDate || undefined,
        archiveLocation: formValue.archive.archiveLocation || undefined,
      };
    } else if (kind === 'DISSERTATION' && formValue.dissertation) {
      request.dissertation = {
        academicDegree: formValue.dissertation.academicDegree || undefined,
        speciality: formValue.dissertation.speciality || undefined,
        defenseDate: formValue.dissertation.defenseDate || undefined,
        institution: formValue.dissertation.institution || undefined,
      };
    } else if (kind === 'SOFTWARE' && formValue.software) {
      request.software = {
        programLanguage: formValue.software.programLanguage || undefined,
        operatingSystem: formValue.software.operatingSystem || undefined,
        databaseVersion: formValue.software.databaseVersion || undefined,
        softwareType: formValue.software.softwareType || undefined,
      };
    }

    this.publicationService.createPublication(request).subscribe({
      next: () => {
        this.router.navigate(['/forum']);
      },
      error: (error) => {
        const errorMessage =
          error?.error?.error || 'Ошибка при создании публикации. Проверьте данные и попробуйте снова.';
        alert(errorMessage);
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }
}

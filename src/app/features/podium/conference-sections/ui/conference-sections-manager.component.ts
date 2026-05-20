import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-conference-sections-manager',
  templateUrl: './conference-sections-manager.component.html',
  styleUrls: ['./conference-sections-manager.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceSectionsManagerComponent implements OnChanges {
  @Input({ required: true }) sections!: FormArray;
  @Input({ required: true }) loadingSections!: boolean;
  @Input({ required: true }) canManageSections!: boolean;
  @Input({ required: true }) isLeaderSection!: (sectionIndex: number) => boolean;
  @Input({ required: true }) createSection!: () => FormGroup;
  @Input({ required: true }) currentUserId!: string | number | bigint | undefined;

  readonly sectionTableColumns: Array<{
    title: string;
    controlName: string;
    type: 'text' | 'date';
    placeholder: string;
  }> = [
    {
      title: 'Секция',
      controlName: 'title',
      type: 'text',
      placeholder: 'Введите название секций'
    },
    {
      title: 'Руководитель',
      controlName: 'leaderName',
      type: 'text',
      placeholder: 'Введите ФИО руководителя'
    },
    {
      title: 'Дата проведения',
      controlName: 'sectionDate',
      type: 'date',
      placeholder: 'Выберете дату проведения'
    }
  ];

  form!: FormGroup;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections'] && this.sections) {
      // Создаем "обертку" FormGroup, чтобы директивы formArrayName/formGroupName работали.
      this.form = new FormGroup({
        sections: this.sections
      });
    }
  }

  addSection(): void {
    if (!this.canManageSections) {
      return;
    }
    this.sections.push(this.createSection());
  }

  leadSecArray(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('leaders') as FormArray;
  }

  reviewSecArray(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('reviewers') as FormArray;
  }

  disableSection(index: number) {
    const section = this.sections.at(index);

    section.get('title')?.disable();

    const leadersArray = section.get('leaders') as FormArray;
    leadersArray.controls.forEach((control) => {
      control.get('selected')?.disable();
    });
    const reviewersArray = section.get('reviewers') as FormArray;
    reviewersArray.controls.forEach((control) => {
      control.get('selected')?.disable();
    });

    if (this.sections.at(this.sections.length - 1).get('title')?.value !== '' && this.sections.length < 5) {
      this.sections.push(this.createSection());
    }
  }

  enableSection(index: number) {
    const section = this.sections.at(index);
    section.get('title')?.enable();
    const leadersArray = section.get('leaders') as FormArray;
    leadersArray.controls.forEach((control) => {
      control.get('selected')?.enable();
    });
    const reviewersArray = section.get('reviewers') as FormArray;
    reviewersArray.controls.forEach((control) => {
      control.get('selected')?.enable();
    });
  }

  removeSection(index: number) {
    this.sections.removeAt(index);
    if (this.sections.at(this.sections.length - 1).get('title')?.value !== '' && this.sections.value.length === 4) {
      this.sections.push(this.createSection());
    }
  }

  isDisabledSection(index: number) {
    return this.sections.at(index).get('title')?.disabled;
  }

  countLeadSecArray(sectionIndex: number): number {
    const leaders = this.sections.at(sectionIndex).get('leaders') as FormArray;
    return leaders.controls.filter((control) => control.get('selected')?.value === true).length;
  }

  getStringLeadSecArray(sectionIndex: number) {
    const leaders = this.sections.at(sectionIndex).get('leaders') as FormArray;
    return leaders.controls
      .filter((control) => control.get('selected')?.value === true)
      .map((control) => control.get('fullName')?.value)
      .join(', ');
  }

  countReviewSecArray(sectionIndex: number): number {
    const reviewers = this.sections.at(sectionIndex).get('reviewers') as FormArray;
    return reviewers.controls.filter((control) => control.get('selected')?.value === true).length;
  }

  getStringReviewSecArray(sectionIndex: number) {
    const reviewers = this.sections.at(sectionIndex).get('reviewers') as FormArray;
    return reviewers.controls
      .filter((control) => control.get('selected')?.value === true)
      .map((control) => control.get('fullName')?.value)
      .join(', ');
  }
}

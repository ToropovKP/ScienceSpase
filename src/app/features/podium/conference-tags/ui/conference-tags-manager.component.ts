import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-conference-tags-manager',
  templateUrl: './conference-tags-manager.component.html',
  styleUrls: ['./conference-tags-manager.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceTagsManagerComponent implements OnChanges {
  @Input({ required: true }) tags!: FormArray;
  @Input({ required: true }) loadingTags!: boolean;
  @Input({ required: true }) canManageTags!: boolean;

  form!: FormGroup;
  isEnabled = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tags'] && this.tags) {
      // Создаем "обертку" FormGroup, чтобы директивы formArrayName/formGroupName работали.
      this.form = this.formBuilder.group({
        tags: this.tags
      });
      this.tags.controls.forEach((control) => {
        const tagGroup = control as FormGroup;
        if (!tagGroup.get('method')) {
          tagGroup.addControl('method', this.formBuilder.control(''));
        }
        if (!tagGroup.get('description')) {
          tagGroup.addControl('description', this.formBuilder.control(''));
        }
      });
      this.isEnabled = this.tags.controls.some((control) => !!control.get('name')?.value);
    }
  }

  private createTag(name: string = ''): FormGroup {
    return this.formBuilder.group({
      name: [name],
      method: [''],
      description: ['']
    });
  }

  toggleEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled && this.tags.length === 0) {
      this.tags.push(this.createTag());
    }
  }

  addTag(): void {
    if (!this.canManageTags) {
      return;
    }
    this.tags.push(this.createTag());
  }

  removeTag(index: number) {
    this.tags.removeAt(index);
    if (this.tags.length === 0) {
      this.tags.push(this.createTag());
    }
  }
}

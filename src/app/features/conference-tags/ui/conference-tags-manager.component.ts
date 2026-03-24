import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-conference-tags-manager',
  templateUrl: './conference-tags-manager.component.html',
  styleUrls: ['./conference-tags-manager.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ConferenceTagsManagerComponent {
  @Input({ required: true }) tags!: FormArray;
  @Input({ required: true }) loadingTags!: boolean;
  @Input({ required: true }) canManageTags!: boolean;

  constructor(private formBuilder: FormBuilder) {}

  private createTag(name: string = ''): FormGroup {
    return this.formBuilder.group({
      name: [name]
    });
  }

  disableTag(index: number) {
    const tag = this.tags.at(index);
    if (tag.get('name')?.value !== '') {
      tag.get('name')?.disable();
      if (this.tags.at(this.tags.length - 1).get('name')?.value !== '' && this.tags.value.length < 5) {
        this.tags.push(this.createTag());
      }
    }
  }

  enableTag(index: number) {
    const tag = this.tags.at(index);
    tag.get('name')?.enable();
  }

  removeTag(index: number) {
    this.tags.removeAt(index);
    if (this.tags.value.length === 4) {
      this.tags.push(this.createTag());
    }
  }
}

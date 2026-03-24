import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-co-authors-form-array',
  templateUrl: './co-authors-form-array.component.html',
  styleUrls: ['./co-authors-form-array.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CoAuthorsFormArrayComponent {
  @Input({ required: true }) authors!: FormArray;

  constructor(private formBuilder: FormBuilder) {}

  private createAuthor(fullName: string = '', organization: string = '', email: string = ''): FormGroup {
    return this.formBuilder.group({
      fullName: [fullName],
      organization: [organization],
      email: [email]
    });
  }

  disableAuthor(index: number) {
    const author = this.authors.at(index);
    if (author.get('fullName')?.value !== '') {
      author.get('fullName')?.disable();
      author.get('organization')?.disable();
      author.get('email')?.disable();
      if (this.authors.at(this.authors.length - 1).get('fullName')?.value !== '' && this.authors.value.length < 5) {
        this.authors.push(this.createAuthor());
      }
    }
  }

  enableAuthor(index: number) {
    const author = this.authors.at(index);
    author.get('fullName')?.enable();
    author.get('organization')?.enable();
    author.get('email')?.enable();
  }

  removeAuthor(index: number) {
    this.authors.removeAt(index);
    if (this.authors.value.length === 4) {
      this.authors.push(this.createAuthor());
    }
  }
}

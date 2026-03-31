import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Author } from '../../../entities/author/model/author';

@Component({
  selector: 'app-job-coauthors-list',
  templateUrl: './job-coauthors-list.component.html',
  styleUrls: ['./job-coauthors-list.component.css'],
  imports: [CommonModule]
})
export class JobCoauthorsListComponent {
  @Input({ required: true }) coAuthors!: Author[];
}

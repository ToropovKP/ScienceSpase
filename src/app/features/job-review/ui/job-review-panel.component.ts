import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Review } from '../../../entities/job/model/review';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner.component';

@Component({
  selector: 'app-job-review-panel',
  templateUrl: './job-review-panel.component.html',
  styleUrls: ['./job-review-panel.component.css'],
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent]
})
export class JobReviewPanelComponent {
  @Input({ required: true }) loadingConference!: boolean;
  @Input({ required: true }) tags!: string[];
  @Input({ required: true }) formReview!: FormGroup;
  @Input({ required: true }) existReviewByCurrentUser!: boolean;
  @Input({ required: true }) reviewByCurrentUser!: Review;
  @Input({ required: true }) reviewsMarks!: number[];

  @Output() markChange = new EventEmitter<{ tag: string; mark: number }>();
  @Output() saveReview = new EventEmitter<void>();

  onMark(tag: string, mark: number) {
    this.markChange.emit({ tag, mark });
  }

  onSaveReview() {
    this.saveReview.emit();
  }
}

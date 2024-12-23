export class ReviewDto {
  private reviews!: object;
  private reviewText!: string;

  constructor() {
  }

  getReviews(): object {
    return this.reviews;
  }

  setReviews(value: object) {
    this.reviews = value;
  }

  getReviewText(): string {
    return this.reviewText;
  }

  setReviewText(value: string) {
    this.reviewText = value;
  }
}

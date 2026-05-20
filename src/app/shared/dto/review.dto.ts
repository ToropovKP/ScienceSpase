export class ReviewDto {
  private reviews!: Record<string, number>;
  private text!: string;
  private requestRevision!: boolean;

  constructor() {
  }

  getReviews(): Record<string, number> {
    return this.reviews;
  }

  setReviews(value: Record<string, number>) {
    this.reviews = value;
  }

  getText(): string {
    return this.text;
  }

  setText(value: string) {
    this.text = value;
  }

  isRequestRevision(): boolean {
    return this.requestRevision;
  }

  setRequestRevision(value: boolean) {
    this.requestRevision = value;
  }
}

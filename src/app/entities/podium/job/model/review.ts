export interface Review {
  id: bigint;
  userId: bigint;
  text: string;
  reviews: Record<string, number>;
  requestRevision: boolean;
  dateTime: Date;
}

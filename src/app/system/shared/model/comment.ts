export interface Comment {
  id: bigint;
  jobId: bigint;
  userId: bigint;
  firstName: string;
  lastName: string;
  message: string;
  dateTime: Date;
  read: boolean;
}

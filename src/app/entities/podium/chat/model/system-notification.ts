export interface SystemNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  jobId: number | null;
  conferenceId: number | null;
  createdAt: string;
  readAt: string | null;
}

export interface ChatJobPreview {
  jobId: number;
  title: string;
  authorName: string;
  lastMessage: string;
  lastMessageSenderName: string;
  lastMessageDateTime: string | null;
}

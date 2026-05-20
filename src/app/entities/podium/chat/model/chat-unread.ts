export interface JobChatUnread {
  jobId: number;
  title: string;
  sectionId: number;
  unreadCount: number;
}

export interface SectionChatUnread {
  sectionId: number;
  title: string;
  unreadCount: number;
  jobs: JobChatUnread[];
}

export interface ConferenceChatUnread {
  conferenceId: number;
  title: string;
  unreadCount: number;
  sections: SectionChatUnread[];
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ConferenceChatUnread, SectionChatUnread } from '../../../entities/podium/chat/model/chat-unread';
import { ChatJobPreview } from '../../../entities/podium/chat/model/chat-job-preview';
import { Comment } from '../../../entities/podium/comment/model/comment';
import { User } from '../../../entities/shared/user/model/user';
import { AuthService } from '../../../shared/services/auth.service';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { ChatService } from '../../../shared/services/chat.service';
import { StompSubscription } from '@stomp/stompjs';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner.component';
import { ToastContainerComponent } from '../../../shared/ui/toast-container.component';
import { ChatConversationPanelComponent } from './chat-conversation-panel.component';

interface ChatPreviewItem extends ChatJobPreview {
  unreadCount: number;
}

@Component({
  selector: 'app-chat-inbox',
  standalone: true,
  templateUrl: './chat-inbox.component.html',
  styleUrls: ['./chat-inbox.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ToastContainerComponent,
    ChatConversationPanelComponent,
  ],
})
export class ChatInboxComponent implements OnInit, OnDestroy {
  unreadTree: ConferenceChatUnread[] = [];
  selectedConferenceId: number | null = null;
  selectedSectionId: number | null = null;
  selectedJobId: number | null = null;
  selectedJobPreview: ChatPreviewItem | null = null;
  jobPreviews: ChatPreviewItem[] = [];
  currentUser: User | null = null;
  searchQuery = '';
  expandedConferenceId: number | null = null;

  loadingTree = true;
  loadingJobs = false;

  private destroy$ = new Subject<void>();
  private listPreviewSubscriptions: StompSubscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.chatService.reconnect$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        void this.bindListPreviewSubscriptions();
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.currentUser = user;
          void this.loadTree();
        } else {
          this.currentUser = null;
          void this.router.navigate(['/auth']);
        }
      });
  }

  ngOnDestroy(): void {
    this.clearListPreviewSubscriptions();
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadTree(): Promise<void> {
    this.loadingTree = true;
    try {
      this.unreadTree = await this.httpService.getChatUnreadTree();
      const firstConference = this.unreadTree[0];
      const firstSection = firstConference?.sections?.[0];
      this.expandedConferenceId = firstConference?.conferenceId ?? null;
      if (firstSection) {
        await this.selectSection(firstConference.conferenceId, firstSection);
      } else {
        this.jobPreviews = [];
        this.selectedJobId = null;
        this.selectedJobPreview = null;
        this.clearListPreviewSubscriptions();
      }
    } catch {
      this.notificationService.showServerError();
    } finally {
      this.loadingTree = false;
    }
  }

  async selectSection(conferenceId: number, section: SectionChatUnread): Promise<void> {
    this.selectedConferenceId = conferenceId;
    this.selectedSectionId = section.sectionId;
    this.expandedConferenceId = conferenceId;
    this.loadingJobs = true;
    try {
      const previews = await this.httpService.getChatJobs(String(conferenceId), String(section.sectionId));
      const unreadByJob = new Map(section.jobs.map((job) => [job.jobId, job.unreadCount]));
      this.jobPreviews = previews.map((preview) => ({
        ...preview,
        unreadCount: unreadByJob.get(preview.jobId) ?? 0,
      }));
      if (this.jobPreviews.length > 0) {
        const preserved = this.jobPreviews.find((preview) => preview.jobId === this.selectedJobId);
        this.selectChat(preserved ?? this.jobPreviews[0]);
      } else {
        this.selectedJobId = null;
        this.selectedJobPreview = null;
      }
      void this.bindListPreviewSubscriptions();
    } catch {
      this.jobPreviews = [];
      this.selectedJobId = null;
      this.selectedJobPreview = null;
      this.clearListPreviewSubscriptions();
      this.notificationService.showServerError();
    } finally {
      this.loadingJobs = false;
    }
  }

  selectChat(preview: ChatPreviewItem): void {
    this.selectedJobId = preview.jobId;
    this.selectedJobPreview = preview;
    this.markChatAsReadLocally(preview.jobId);
  }

  isSectionSelected(conferenceId: number, sectionId: number): boolean {
    return this.selectedConferenceId === conferenceId && this.selectedSectionId === sectionId;
  }

  toggleConference(conferenceId: number): void {
    this.expandedConferenceId = this.expandedConferenceId === conferenceId ? null : conferenceId;
  }

  isConferenceExpanded(conferenceId: number): boolean {
    return this.expandedConferenceId === conferenceId;
  }

  get filteredJobPreviews(): ChatPreviewItem[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.jobPreviews;
    }
    return this.jobPreviews.filter((preview) =>
      [preview.title, preview.authorName, preview.lastMessage, preview.lastMessageSenderName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }

  isChatSelected(jobId: number): boolean {
    return this.selectedJobId === jobId;
  }

  private clearListPreviewSubscriptions(): void {
    for (const sub of this.listPreviewSubscriptions) {
      try {
        sub.unsubscribe();
      } catch {
        /* ignore */
      }
    }
    this.listPreviewSubscriptions = [];
  }

  private async bindListPreviewSubscriptions(): Promise<void> {
    this.clearListPreviewSubscriptions();
    if (this.jobPreviews.length === 0) {
      return;
    }
    try {
      await this.chatService.connect();
    } catch {
      return;
    }
    for (const preview of this.jobPreviews) {
      const jobId = String(preview.jobId);
      const sub = this.chatService.subscribeToJob(jobId, (comment) => this.applyLiveMessageToPreview(jobId, comment));
      if (sub) {
        this.listPreviewSubscriptions.push(sub);
      }
    }
  }

  private applyLiveMessageToPreview(jobId: string, comment: Comment): void {
    const idx = this.jobPreviews.findIndex((p) => String(p.jobId) === jobId);
    if (idx === -1) {
      return;
    }
    const preview = this.jobPreviews[idx];
    const lastMessageDateTime = this.commentDateTimeToIsoString(comment.dateTime);
    const senderName = [comment.firstName, comment.lastName].filter(Boolean).join(' ').trim();

    let unreadCount = preview.unreadCount;
    const isOtherUser =
      this.currentUser != null && String(comment.userId) !== String(this.currentUser.id);
    if (isOtherUser && Number(jobId) !== this.selectedJobId) {
      unreadCount = (unreadCount ?? 0) + 1;
    }

    const updated: ChatPreviewItem = {
      ...preview,
      lastMessage: comment.message,
      lastMessageSenderName: senderName,
      lastMessageDateTime,
      unreadCount,
    };

    this.jobPreviews = [...this.jobPreviews.slice(0, idx), updated, ...this.jobPreviews.slice(idx + 1)];
    if (this.selectedJobPreview?.jobId === updated.jobId) {
      this.selectedJobPreview = updated;
    }
  }

  private commentDateTimeToIsoString(value: Comment['dateTime']): string {
    if (value == null) {
      return new Date().toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(String(value)).toISOString();
  }

  private markChatAsReadLocally(jobId: number): void {
    const currentPreview = this.jobPreviews.find((preview) => preview.jobId === jobId);
    const unreadCount = currentPreview?.unreadCount ?? 0;
    if (unreadCount <= 0) {
      return;
    }

    this.jobPreviews = this.jobPreviews.map((preview) =>
      preview.jobId === jobId ? { ...preview, unreadCount: 0 } : preview,
    );
    this.selectedJobPreview = this.jobPreviews.find((preview) => preview.jobId === jobId) ?? this.selectedJobPreview;

    this.unreadTree = this.unreadTree.map((conference) => {
      if (conference.conferenceId !== this.selectedConferenceId) {
        return conference;
      }

      const updatedSections = conference.sections.map((sectionNode) => {
        if (sectionNode.sectionId !== this.selectedSectionId) {
          return sectionNode;
        }

        const updatedJobs = sectionNode.jobs.map((job) =>
          job.jobId === jobId ? { ...job, unreadCount: 0 } : job,
        );
        const updatedSectionUnread = updatedJobs.reduce((sum, job) => sum + job.unreadCount, 0);
        return {
          ...sectionNode,
          jobs: updatedJobs,
          unreadCount: updatedSectionUnread,
        };
      });

      return {
        ...conference,
        sections: updatedSections,
        unreadCount: updatedSections.reduce((sum, sectionNode) => sum + sectionNode.unreadCount, 0),
      };
    });
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StompSubscription } from '@stomp/stompjs';
import { Comment } from '../../../entities/podium/comment/model/comment';
import { User } from '../../../entities/shared/user/model/user';
import { ChatService } from '../../../shared/services/chat.service';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { DateService } from '../../../shared/services/date.service';
import { ChatActivityService } from '../../../shared/services/chat-activity.service';
import { LinkifyPipe } from '../../../shared/pipes/linkify.pipe';
import { baseUrl } from '../../../app.constants';

@Component({
  selector: 'app-chat-conversation-panel',
  standalone: true,
  templateUrl: './chat-conversation-panel.component.html',
  styleUrls: ['./chat-conversation-panel.component.css'],
  imports: [CommonModule, ReactiveFormsModule, LinkifyPipe]
})
export class ChatConversationPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) jobId!: string;
  @Input({ required: true }) currentUser!: User;

  protected readonly DateService = DateService;

  formComment!: FormGroup;
  comments: Comment[] = [];
  attachmentUploading = false;

  trackCommentById(_index: number, comment: Comment): string {
    return String(comment.id);
  }

  isOwnComment(comment: Comment): boolean {
    return String(comment.userId) === String(this.currentUser.id);
  }

  commentToDate(comment: Comment): Date {
    const raw = comment.dateTime;
    if (raw instanceof Date) {
      return raw;
    }
    if (typeof raw === 'string') {
      return new Date(raw);
    }
    return new Date(String(raw));
  }

  showDateSeparatorBefore(comment: Comment, index: number): boolean {
    if (index === 0) {
      return true;
    }
    const prev = this.comments[index - 1];
    return this.calendarDayKey(this.commentToDate(comment)) !== this.calendarDayKey(this.commentToDate(prev));
  }

  dateSeparatorLabel(comment: Comment): string {
    return DateService.formatChatDateSeparator(this.commentToDate(comment));
  }

  messageTimeLabel(comment: Comment): string {
    return DateService.formatChatMessageTime(this.commentToDate(comment));
  }

  displayName(comment: Comment): string {
    const parts = [comment.firstName, comment.lastName]
      .map((s) => (s || '').trim())
      .filter(Boolean);
    return parts.join(' ') || 'Пользователь';
  }

  avatarInitials(comment: Comment): string {
    const f = (comment.firstName || '').trim().charAt(0);
    const l = (comment.lastName || '').trim().charAt(0);
    const s = (f + l).toUpperCase();
    return s || '?';
  }

  private calendarDayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('chatContainer', { static: false }) chatContainerRef!: ElementRef<HTMLElement>;

  private scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  private isUserScrolling = false;
  private isInitialLoad = true;
  private readonly SCROLL_THRESHOLD = 100;
  private jobSubscription: StompSubscription | null = null;
  private lastSentReadCommentId: string | null = null;
  protected activeJobId: string | null = null;
  private viewReady = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private chatService: ChatService,
    private notificationService: NotificationService,
    private chatActivityService: ChatActivityService,
  ) {}

  ngOnInit() {
    this.formComment = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.activateJobChat(this.jobId);
    this.startScrollManagement();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['jobId'] && !changes['jobId'].firstChange && this.viewReady) {
      this.activateJobChat(this.jobId);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.scrollTimeout);
    this.jobSubscription?.unsubscribe();
    if (this.activeJobId) {
      this.chatActivityService.deactivateJob(this.activeJobId);
    }
  }

  private activateJobChat(jobId: string) {
    if (!jobId || (this.activeJobId === jobId && this.jobSubscription)) {
      return;
    }
    if (this.activeJobId) {
      this.chatActivityService.deactivateJob(this.activeJobId);
    }
    this.jobSubscription?.unsubscribe();
    this.jobSubscription = null;
    this.activeJobId = jobId;
    this.comments = [];
    this.lastSentReadCommentId = null;
    this.isInitialLoad = true;
    this.isUserScrolling = false;
    this.chatActivityService.activateJob(jobId);

    this.chatService
      .connect()
      .then(() => {
        if (this.activeJobId !== jobId) {
          return;
        }
        this.jobSubscription = this.chatService.subscribeToJob(jobId, (message) => {
          this.comments = [...this.comments, message];
          this.scheduleScrollCheck();
          this.updateReadState(message.id);
        });
        this.loadComments(jobId);
      })
      .catch(() => {
        this.notificationService.showServerError();
      });
  }

  private loadComments(jobId: string) {
    this.httpService
      .getJobComments(jobId)
      .then((data) => {
        if (this.activeJobId !== jobId) {
          return;
        }
        this.comments = data;
        if (this.isInitialLoad) {
          this.scrollToBottom();
          this.isInitialLoad = false;
        }
        this.updateReadState();
      })
      .catch(() => {
        this.notificationService.showServerError();
      });
  }

  private startScrollManagement() {
    setTimeout(() => {
      this.setupScrollListeners();
      this.scrollToBottom();
    }, 100);
  }

  private setupScrollListeners() {
    const container = this.chatContainerRef?.nativeElement;
    if (!container) return;

    container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      this.isUserScrolling = scrollHeight - (scrollTop + clientHeight) > this.SCROLL_THRESHOLD;
      this.updateReadState();
    });
  }

  private scheduleScrollCheck() {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.scrollToBottomIfNeeded();
    }, 50);
  }

  private scrollToBottomIfNeeded() {
    if (!this.isUserScrolling) {
      this.scrollToBottom();
    }
    this.updateReadState();
  }

  private scrollToBottom() {
    const container = this.chatContainerRef?.nativeElement;
    if (container) {
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
      }, 0);
    }
  }

  openAttachmentPicker(): void {
    this.fileInput?.nativeElement?.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files;
    if (!list?.length || !this.activeJobId) {
      input.value = '';
      return;
    }
    const formData = new FormData();
    for (let i = 0; i < list.length; i++) {
      const file = list.item(i);
      if (file) {
        formData.append('files', file);
      }
    }
    this.attachmentUploading = true;
    this.httpService
      .uploadFiles(formData)
      .then((metas) => {
        const lines = metas.map((m) => `${baseUrl}/api/v1/files/downloadFile/${String(m.uuid)}`);
        const ctrl = this.formComment.get('message');
        const cur = String(ctrl?.value ?? '').trimEnd();
        const sep = cur ? '\n' : '';
        ctrl?.patchValue(`${cur}${sep}${lines.join('\n')}`);
        this.messageInput?.nativeElement?.focus();
      })
      .catch(() => {
        this.notificationService.showError('Не удалось загрузить файл');
      })
      .finally(() => {
        this.attachmentUploading = false;
        input.value = '';
      });
  }

  createComment() {
    if (this.attachmentUploading) {
      return;
    }
    const message = String(this.formComment.value.message ?? '').trim();
    if (!message || !this.activeJobId) {
      return;
    }
    this.chatService.sendMessage(this.activeJobId, message);
    this.formComment.reset();
    this.resetTextarea();
  }

  handleEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.attachmentUploading) {
      keyboardEvent.preventDefault();
      return;
    }
    const messageControl = this.formComment.get('message');

    if (!messageControl?.value?.trim()) {
      keyboardEvent.preventDefault();
      return;
    }

    if (!keyboardEvent.shiftKey) {
      if (!this.formComment.invalid) {
        this.createComment();
      }
      keyboardEvent.preventDefault();
    }
  }

  resetTextarea() {
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.rows = 1;
    this.formComment.patchValue({ message: '' });
  }

  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight);
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  @HostListener('window:focus')
  onWindowFocus() {
    this.updateReadState();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    this.updateReadState();
  }

  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  onUserActivity() {
    this.updateReadState();
  }

  private updateReadState(lastReadCommentId?: string | number | bigint | null) {
    this.chatActivityService.setAtBottom(!this.isUserScrolling);
    this.chatActivityService.trackActivity();
    this.markCurrentChatAsRead(lastReadCommentId);
  }

  private markCurrentChatAsRead(lastReadCommentId?: string | number | bigint | null) {
    if (!this.comments.length || !this.activeJobId) {
      return;
    }
    if (!this.chatActivityService.isActivelyReading(this.activeJobId)) {
      return;
    }
    const latestCommentId = lastReadCommentId ?? this.comments[this.comments.length - 1]?.id;
    if (!latestCommentId) {
      return;
    }
    const normalizedCommentId = String(latestCommentId);
    if (this.lastSentReadCommentId === normalizedCommentId) {
      return;
    }
    this.chatService.sendRead(this.activeJobId, latestCommentId);
    this.lastSentReadCommentId = normalizedCommentId;
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Comment } from '../../../entities/comment/model/comment';
import { User } from '../../../entities/user/model/user';
import { ChatService } from '../../../shared/services/chat.service';
import { HttpService } from '../../../shared/services/http.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { DateService } from '../../../shared/services/date.service';
import { FirstWordPipe } from '../../../shared/pipes/first.word.pipe';
import { ShortNamePipe } from '../../../shared/pipes/short.name.pipe';
import { LinkifyPipe } from '../../../shared/pipes/linkify.pipe';

@Component({
  selector: 'app-job-chat',
  templateUrl: './job-chat.component.html',
  styleUrls: ['./job-chat.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FirstWordPipe, ShortNamePipe, LinkifyPipe]
})
export class JobChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) jobId!: string;
  @Input({ required: true }) currentUser!: User;

  protected readonly DateService = DateService;

  formComment!: FormGroup;
  comments: Comment[] = [];

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatContainer', { static: false }) chatContainerRef!: ElementRef<HTMLElement>;

  private scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  private isUserScrolling = false;
  private isInitialLoad = true;
  private readonly SCROLL_THRESHOLD = 100;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private chatService: ChatService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.formComment = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
    this.loadComments();
  }

  ngAfterViewInit() {
    this.initChatConnection();
    this.startScrollManagement();
  }

  ngOnDestroy() {
    clearTimeout(this.scrollTimeout);
    this.chatService.disconnect();
  }

  private loadComments() {
    this.httpService
      .getJobComments(this.jobId)
      .then((data) => {
        this.comments = data;
        if (this.isInitialLoad) {
          this.scrollToBottom();
          this.isInitialLoad = false;
        }
      })
      .catch(() => {
        this.notificationService.showServerError();
      });
  }

  private initChatConnection() {
    this.chatService
      .connect()
      .then(() => {
        this.chatService.subscribeToJob(this.jobId, (message) => {
          this.comments = [...this.comments, message];
          this.scheduleScrollCheck();
        });
      })
      .catch(console.error);
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

  createComment() {
    const message = {
      jobId: this.jobId,
      userId: this.currentUser.id,
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      middleName: this.currentUser.middleName,
      message: this.formComment.value.message.trim()
    };
    this.chatService.sendMessage(`/app/send`, message);
    this.formComment.reset();
    this.resetTextarea();
  }

  handleEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
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
}

import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Job} from "../shared/model/job";
import {HttpResponse} from "@angular/common/http";
import {Comment} from "../shared/model/comment";
import {Conference} from "../shared/model/conference";
import {ReviewDto} from "../shared/dto/review.dto";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {DateService} from "../shared/services/date.service";
import {Review} from "../shared/model/review";
import {ChatService} from "../shared/services/chat.service";
import {AuthService} from "../shared/services/auth.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ToastModule} from "primeng/toast";
import {FirstWordPipe} from "../shared/pipes/first.word.pipe";
import {ShortNamePipe} from "../shared/pipes/short.name.pipe";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-one-conference',
  templateUrl: './one-job.component.html',
  styleUrls: ['./one-job.component.css'],
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, ConfirmDialogModule, ToastModule, FirstWordPipe, ShortNamePipe, FirstWordPipe, ShortNamePipe],
  providers: [ConfirmationService, MessageService]
})
export class OneJobComponent implements OnInit, OnDestroy, AfterViewInit {

  protected readonly DateService = DateService;

  reviewsMarks = [1, 2, 3, 4, 5];
  model: Record<string, number> = {}

  currentJobId!: string;
  currentJob: Job = new Job();
  jobUser!: User;
  currentComments!: Comment[];
  currentConference!: Conference;

  formAddJob!: FormGroup;
  formReview!: FormGroup;
  formComment!: FormGroup;
  currentUser!: User;

  existReviewByCurrentUser: boolean = false;
  reviewByCurrentUser!: Review;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private chatService: ChatService,
              private authService: AuthService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService) {
  }

  @ViewChild('chatContainer', {static: false}) chatContainerRef!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();
  private scrollTimeout: any;
  private isUserScrolling = false;
  private readonly SCROLL_THRESHOLD = 100;

  ngAfterViewInit() {
    this.initChatConnection();
    if (!this.isReviewer()) {
      this.startScrollManagement();
    }
  }

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  initializeForms() {
    this.formAddJob = this.formBuilder.group({
      title: new FormControl('',),
      authors: this.formBuilder.array([]),
      description: new FormControl('',),
      phone: new FormControl('',),
      organization: new FormControl('',),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('',),
      rincId: new FormControl('',),
      section: new FormControl('',),
    })

    this.formComment = this.formBuilder.group({
      message: new FormControl('', [Validators.required]),
    })

    this.formReview = this.formBuilder.group({
      text: new FormControl('',),
    })
  }

  ngOnDestroy() {
    clearTimeout(this.scrollTimeout);
    this.chatService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initChatConnection() {
    this.chatService.connect().then(() => {
      this.chatService.subscribeToJob(this.currentJobId, (message) => {
        this.currentComments = [...this.currentComments, message];
        this.scheduleScrollCheck();
      });
    }).catch(console.error);
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
      const {scrollTop, scrollHeight, clientHeight} = container;
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
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  loadingJob: boolean = true;
  loadingConference: boolean = true;

  loadAllData() {
    const pattern = /^\/conference\/.+\/jobs\/.+$/;
    const currentPath = window.location.pathname;
    let skip: boolean = false;
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      if (currentPath.match(pattern)) {
        this.route.params.pipe(map(p => p['confId'])).subscribe(e => {
          this.httpService.getConference(String(e)).then((conf) => {
            this.currentConference = conf;
            if (!this.isModeratorOfJobConferenceOrReviewer()) {
              this.router.navigate(['not-found']);
              skip = true;
            }

            this.loadingConference = false;
          }).catch(error => {
            this.loadingConference = false;
          });
        });
      }

      if (!skip) {
        this.currentJobId = e;

        this.httpService.getUserOneJob(this.currentJobId).then((data) => {
          this.currentJob = data

          const pattern2 = /^\/jobs\/.+$/;
          if (currentPath.match(pattern2)) {
            if (this.currentJob.userId !== this.currentUser.id) {
              let find = this.currentJob.coAuthors.find((author) => author.email === this.currentUser.email);
              if (!find) {
                this.router.navigate(['not-found']);
                skip = true;
              }
            }
          }

          if (!skip) {
            if (this.isReviewer()) {
              let find = this.currentJob.reviews.find(review => review.userId === this.currentUser.id);
              if (find) {
                this.existReviewByCurrentUser = true;
                this.reviewByCurrentUser = find;
                this.formReview.controls['text'].setValue(this.reviewByCurrentUser.text);
              }
            }

            this.httpService.getConference(String(data.conferenceId)).then((conf) => {
              this.currentConference = conf;
              this.updateUserInfo()
              this.loadingConference = false;
            }).catch(error => {
              this.loadingConference = false;
            });

            this.httpService.getJobComments(this.currentJobId).then((data) => {
              this.currentComments = data
            }).catch(error => {
              this.messageService.add({
                severity: 'error',
                summary: 'Возникла непредвиденная ошибка',
                detail: 'Ошибка на стороне сервера',
                life: 3000
              });
            })
          }

        }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Ошибка на стороне сервера',
            life: 3000
          });
          if (error.status == '404') {
            this.router.navigate(['not-found']);
          }
        })
      }

    });
  }

  updateUserInfo() {
    this.httpService.getUserInfoById(String(this.currentJob.userId)).then((data) => {
      this.jobUser = data
      this.authors.clear();
      this.currentJob.coAuthors.forEach(author => {
        this.authors.push(this.createAuthor(author.fullName, author.organization, author.email));
      })
      this.formAddJob.controls['title'].setValue(this.currentJob.title)
      this.formAddJob.controls['description'].setValue(this.currentJob.description)
      this.formAddJob.controls['phone'].setValue(this.jobUser.phone)
      this.formAddJob.controls['organization'].setValue(this.jobUser.organization)
      this.formAddJob.controls['academicDegree'].setValue(this.jobUser.academicDegree)
      this.formAddJob.controls['academicTitle'].setValue(this.jobUser.academicTitle)
      this.formAddJob.controls['orcId'].setValue(this.jobUser.orcId)
      this.formAddJob.controls['rincId'].setValue(this.jobUser.rincId)
      this.formAddJob.controls['section'].setValue(this.currentJob.sectionTitle)
      this.loadingJob = false;
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Ошибка на стороне сервера',
        life: 3000
      });
      this.loadingJob = false;
    })
  }

  isUserJob(): boolean {
    return this.currentJob.userId === this.currentUser.id
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER');
  }

  isModeratorOfJobConferenceOrReviewer(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentConference.admins !== undefined && this.currentConference.admins.length !== 0) {
      let find = this.currentConference.admins.find((admin) => admin.id === this.currentUser.id);
      if (!find) {
        let find1 = this.currentConference.sections.find((sec) => {
          if (sec.reviewers !== undefined && sec.reviewers.length !== 0) {
            let find2 = sec.reviewers.find((rev) => rev.id === this.currentUser.id);
            return this.isReviewer() && find2 !== undefined
          }
          return false;
        });
        return find1 !== undefined;
      }
      return this.isModerator()
    }
    return false;
  }

  updateMark(tag: string, mark: number) {
    this.model[tag] = mark;
  }

  saveReview() {
    let request: ReviewDto = new ReviewDto()
    request.setReviews(this.model)
    request.setText(this.formReview.value.text)
    this.httpService.reviewJob(this.currentJobId, request).then((data) => {
      this.existReviewByCurrentUser = true
      let review: Review = new Review();
      review.reviews = request.getReviews();
      review.text = request.getText();
      review.userId = this.currentUser.id;
      this.reviewByCurrentUser = review;
    })
  }

  get authors(): FormArray {
    return this.formAddJob.get('authors') as FormArray;
  }

  createAuthor(fullName: string = '', organization: string = '', email: string = ''): FormGroup {
    return this.formBuilder.group({
      fullName: [fullName],
      organization: [organization],
      email: [email],
    });
  }

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName, String(this.currentJob.id)).then(response => {
      this.processDownloadFile(response)
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось скачать файл',
        life: 3000
      });
    });
  }

  processDownloadFile(response: HttpResponse<any>) {
    let fileName = response.headers.get('content-disposition')?.split(';')[1].split('=')[1];
    let blob: Blob = response.body as Blob;
    let a = document.createElement('a');
    if (fileName) {
      a.download = fileName;
      a.href = window.URL.createObjectURL(blob);
      a.click();
    }
  }

  createComment() {
    const message = {
      "jobId": this.currentJobId,
      "userId": this.currentUser.id,
      "firstName": this.currentUser.firstName,
      "lastName": this.currentUser.lastName,
      "middleName": this.currentUser.middleName,
      "message": this.formComment.value.message
    };
    this.chatService.sendMessage(`/app/send`, message);
    this.formComment.reset()
  }

  confirmDelete(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите удалить статью?<br>Все связанные с ней данные и файлы будут удалены.',
      header: 'Подтверждение',
      closable: true,
      closeOnEscape: true,
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Удалить',
        severity: 'danger'
      },
      accept: () => {
        this.httpService.deleteJob(String(this.currentJob.id)).then((data) => {
          this.toPage(`/conference/${this.currentJob.conferenceId}`);
          this.messageService.add({severity: 'success', summary: 'Успешно', detail: 'Статья удалена', life: 3000});
        }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось удалить работу',
            life: 3000
          });
        })
      },
      reject: () => {
        this.messageService.add({severity: 'secondary', summary: 'Отменено', detail: 'Действие отменено', life: 3000});
      }
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

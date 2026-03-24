import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {Job} from "../../entities/job/model/job";
import {HttpResponse} from "@angular/common/http";
import {Conference} from "../../entities/conference/model/conference";
import {ReviewDto} from "../../shared/dto/review.dto";
import {CommonModule} from "@angular/common";
import {Review} from "../../entities/job/model/review";
import {AuthService} from "../../shared/services/auth.service";
import {ConfirmationService, MenuItem} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {filter} from "rxjs/operators";
import {orcidPattern} from "../../app.constants";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {NotificationService} from "../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../shared/ui/loading-spinner.component";
import {BreadcrumbWrapperComponent} from "../../shared/ui/breadcrumb-wrapper.component";
import {ToastContainerComponent} from "../../shared/ui/toast-container.component";
import {JobConferenceSummaryComponent} from "../../features/job-conference-summary/ui/job-conference-summary.component";
import {JobReadonlyDetailsComponent} from "../../features/job-readonly-details/ui/job-readonly-details.component";
import {JobReviewPanelComponent} from "../../features/job-review/ui/job-review-panel.component";
import {JobChatComponent} from "../../features/job-chat/ui/job-chat.component";
import {JobViewHeaderComponent} from "../../features/job-view-header/ui/job-view-header.component";
import {JobAbstractCardComponent} from "../../features/job-abstract-card/ui/job-abstract-card.component";
import {JobCoauthorsListComponent} from "../../features/job-coauthors-list/ui/job-coauthors-list.component";

@Component({
  selector: 'app-one-job',
  templateUrl: './one-job.component.html',
  styleUrls: ['./one-job.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent,
    JobConferenceSummaryComponent,
    JobReadonlyDetailsComponent,
    JobReviewPanelComponent,
    JobChatComponent,
    JobViewHeaderComponent,
    JobAbstractCardComponent,
    JobCoauthorsListComponent
  ],
  providers: [ConfirmationService]
})
export class OneJobComponent implements OnInit, OnDestroy {

  protected readonly customOrcidPattern = orcidPattern;

  reviewsMarks = [1, 2, 3, 4, 5];
  model: Record<string, number> = {}

  currentJobId!: string;
  currentJob: Job = {} as Job;
  jobUser!: User;
  currentConference!: Conference;

  formJob!: FormGroup;
  formReview!: FormGroup;
  currentUser!: User;

  existReviewByCurrentUser: boolean = false;
  reviewByCurrentUser!: Review;

  loadingJob: boolean = true;
  loadingConference: boolean = true;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  allowEdit: boolean = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private notificationService: NotificationService
  ) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null)
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
    this.formJob = this.formBuilder.group({
      title: new FormControl('',),
      description: new FormControl('',),
      phone: new FormControl('',),
      email: new FormControl('',),
      organization: new FormControl('',),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('',),
      rincId: new FormControl('',),
      section: new FormControl('',),
    })

    this.formReview = this.formBuilder.group({
      text: new FormControl('',),
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
          this.currentJob.files = this.currentJob.files.sort((a, b) => a.uploadTime > b.uploadTime ? 1 : -1)

          this.homeItem = {
            icon: 'bi bi-house-door',
            routerLink: '/'
          };
          this.breadcrumbItems = [];

          if (this.currentJob.userId !== this.currentUser.id) {
            if (!this.isReviewer()) {
              this.breadcrumbItems.push(
                  {
                    label: this.getShortConferenceTitle(),
                    routerLink: `/conference/${this.currentJob.conferenceId}`
                  },
                  {label: this.currentJob.userName});
            }
          } else {
            this.breadcrumbItems.push({label: 'Мои статьи', routerLink: `/jobs`},
                {
                  label: this.getShortConferenceTitle(),
                  routerLink: `/conference/${this.currentJob.conferenceId}`
                });
          }

          this.breadcrumbItems.push({label: this.getShortJobTitle()});

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
              if (conf.status !== 'ACTIVE') {
                this.allowEdit = false;
              }
              this.updateUserInfo()
              this.loadingConference = false;
            }).catch(error => {
              this.loadingConference = false;
            });

          }

        }).catch(error => {
          this.notificationService.showServerError();
          if (error.status === 404) {
            this.router.navigate(['not-found']);
          }
        })
      }

    });
  }

  updateUserInfo() {
    this.httpService.getUserInfoById(String(this.currentJob.userId)).then((data) => {
      this.jobUser = data
      this.formJob.controls['title'].setValue(this.currentJob.title)
      this.formJob.controls['description'].setValue(this.currentJob.description)
      this.formJob.controls['phone'].setValue(this.jobUser.phone)
      this.formJob.controls['email'].setValue(this.jobUser.email)
      this.formJob.controls['organization'].setValue(this.jobUser.organization)
      this.formJob.controls['academicDegree'].setValue(this.jobUser.academicDegree)
      this.formJob.controls['academicTitle'].setValue(this.jobUser.academicTitle)
      this.formJob.controls['orcId'].setValue(this.jobUser.orcId)
      this.formJob.controls['rincId'].setValue(this.jobUser.rincId)
      this.formJob.controls['section'].setValue(this.currentJob.sectionTitle)
      this.loadingJob = false;
    }).catch(error => {
      this.notificationService.showServerError();
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

  getShortConferenceTitle(): string {
    const title = this.currentJob?.conferenceTitle || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  getShortJobTitle(): string {
    const title = this.currentJob?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
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
      let review: Review = {} as Review;
      review.reviews = request.getReviews();
      review.text = request.getText();
      review.userId = this.currentUser.id;
      this.reviewByCurrentUser = review;
    })
  }

  downloadFile(fileName: string) {
    this.httpService.downloadFile(fileName).then(response => {
      this.processDownloadFile(response)
    }).catch(error => {
      this.notificationService.showFileDownloadError();
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

  confirmDelete(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      key: 'confirmPopup',
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
          this.notificationService.showSuccess('Успешно', 'Статья удалена');
        }).catch(error => {
          this.notificationService.showError('Не удалось удалить работу');
        })
      }
    });
  }

  editJob() {
    this.toPage(`/job/${this.currentJob.id}/edit`);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

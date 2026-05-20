import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../../../entities/shared/user/model/user";
import {HttpService} from "../../../shared/services/http.service";
import {Job} from "../../../entities/podium/job/model/job";
import {HttpResponse} from "@angular/common/http";
import {Conference} from "../../../entities/podium/conference/model/conference";
import {ReviewDto} from "../../../shared/dto/review.dto";
import {CommonModule} from "@angular/common";
import {Review} from "../../../entities/podium/job/model/review";
import {AuthService} from "../../../shared/services/auth.service";
import {ConfirmationService, MenuItem} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {filter} from "rxjs/operators";
import {jobStatusMap, orcidPattern} from "../../../app.constants";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {NotificationService} from "../../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../../shared/ui/loading-spinner.component";
import {BreadcrumbWrapperComponent} from "../../../shared/ui/breadcrumb-wrapper.component";
import {ToastContainerComponent} from "../../../shared/ui/toast-container.component";
import {JobConferenceSummaryComponent} from "../../../features/podium/job-conference-summary/ui/job-conference-summary.component";
import {JobReadonlyDetailsComponent} from "../../../features/podium/job-readonly-details/ui/job-readonly-details.component";
import {JobReviewPanelComponent} from "../../../features/podium/job-review/ui/job-review-panel.component";
import {JobChatComponent} from "../../../features/podium/job-chat/ui/job-chat.component";
import {JobViewHeaderComponent} from "../../../features/podium/job-view-header/ui/job-view-header.component";
import {JobAbstractCardComponent} from "../../../features/podium/job-abstract-card/ui/job-abstract-card.component";
import {JobCoauthorsListComponent} from "../../../features/podium/job-coauthors-list/ui/job-coauthors-list.component";
import { parseUserPhone, PhoneCountryId } from "../../../shared/lib/phone-country";

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
  protected readonly jobStatusMap = jobStatusMap;

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
      phoneCountry: new FormControl<PhoneCountryId>('RU', { nonNullable: true }),
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
                    routerLink: `/podium/conference/${this.currentJob.conferenceId}`
                  },
                  {label: this.currentJob.userName});
            }
          } else {
            this.breadcrumbItems.push({label: 'Мои статьи', routerLink: `/podium/jobs`},
                {
                  label: this.getShortConferenceTitle(),
                  routerLink: `/podium/conference/${this.currentJob.conferenceId}`
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
              this.allowEdit = this.canOwnerEditJob();
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
      const parsed = parseUserPhone({
        countryCode: this.jobUser.countryCode as PhoneCountryId | undefined,
        phoneNumber: this.jobUser.phoneNumber,
        phone: this.jobUser.phone
      });
      this.formJob.patchValue({
        phoneCountry: parsed.countryId,
        phone: parsed.national
      });
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
    if (this.currentConference.moderators !== undefined && this.currentConference.moderators.length !== 0) {
      let find = this.currentConference.moderators.find((admin) => admin.id === this.currentUser.id);
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

  isModeratorOfJobConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentConference?.moderators?.length) {
      return this.isModerator() && this.currentConference.moderators.some((admin) => admin.id === this.currentUser.id);
    }
    return false;
  }

  canOwnerEditJob(): boolean {
    return this.isUserJob() && this.currentJob.status !== 'READY_FOR_PUBLICATION';
  }

  canModerateJob(): boolean {
    return this.isModeratorOfJobConference() && this.currentJob.status === 'PENDING_REVIEW';
  }

  canReviewCurrentJob(): boolean {
    return this.isReviewer() && this.currentJob.status === 'APPROVED';
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

  saveReview(requestRevision: boolean) {
    if (!this.canReviewCurrentJob()) {
      this.notificationService.showInfo('Рецензирование', 'Работа пока недоступна для рецензирования.');
      return;
    }
    if (!requestRevision && Object.keys(this.model).length < this.currentConference.tags.length) {
      this.notificationService.showWarning('Рецензирование', 'Для финальной рецензии заполните все оценки.');
      return;
    }
    let request: ReviewDto = new ReviewDto()
    request.setReviews(requestRevision ? {} : this.model)
    request.setText(this.formReview.value.text)
    request.setRequestRevision(requestRevision)
    this.httpService.reviewJob(this.currentJobId, request).then((data) => {
      this.existReviewByCurrentUser = true
      let review: Review = {} as Review;
      review.reviews = request.getReviews();
      review.text = request.getText();
      review.userId = this.currentUser.id;
      review.requestRevision = request.isRequestRevision();
      this.reviewByCurrentUser = review;
      this.currentJob.status = requestRevision ? 'UNDER_REVISION' : 'READY_FOR_PUBLICATION';
      this.allowEdit = this.canOwnerEditJob();
      this.notificationService.showSuccess('Рецензирование', requestRevision ? 'Работа отправлена на доработку.' : 'Финальная рецензия сохранена.');
    }).catch(() => {
      this.notificationService.showError('Не удалось сохранить рецензию');
    })
  }

  moderateJob(decision: 'APPROVE' | 'REJECT') {
    if (!this.canModerateJob()) {
      return;
    }
    this.httpService.moderateJob(this.currentJobId, decision).then(() => {
      this.currentJob.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      this.allowEdit = this.canOwnerEditJob();
      this.notificationService.showSuccess(
        'Модерация',
        decision === 'APPROVE' ? 'Работа одобрена.' : 'Работа отклонена.',
      );
    }).catch(() => {
      this.notificationService.showError('Не удалось изменить статус работы');
    });
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
          this.toPage(`/podium/conference/${this.currentJob.conferenceId}`);
          this.notificationService.showSuccess('Успешно', 'Статья удалена');
        }).catch(error => {
          this.notificationService.showError('Не удалось удалить работу');
        })
      }
    });
  }

  editJob() {
    this.toPage(`/podium/job/${this.currentJob.id}/edit`);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

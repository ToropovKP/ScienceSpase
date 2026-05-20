import {Component, OnDestroy, OnInit} from '@angular/core';
import {conferenceStatusMap} from "../../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpResponse} from "@angular/common/http";
import {Job} from "../../../entities/podium/job/model/job";
import {Conference} from "../../../entities/podium/conference/model/conference";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../../../entities/shared/user/model/user";
import {HttpService} from "../../../shared/services/http.service";
import {Section} from "../../../entities/podium/conference/model/section";
import {UserBase} from "../../../entities/shared/user/model/user.base";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../../shared/services/auth.service";
import {MenuItem} from "primeng/api";
import {filter} from "rxjs/operators";
import {NotificationService} from "../../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../../shared/ui/loading-spinner.component";
import {BreadcrumbWrapperComponent} from "../../../shared/ui/breadcrumb-wrapper.component";
import {ToastContainerComponent} from "../../../shared/ui/toast-container.component";
import {ConferenceJobsHeaderComponent} from "../../../features/podium/conference-jobs-header/ui/conference-jobs-header.component";
import {ConferenceSummaryCardsComponent} from "../../../features/podium/conference-summary-cards/ui/conference-summary-cards.component";
import {ConferenceJobsListComponent} from "../../../features/podium/conference-jobs-list/ui/conference-jobs-list.component";

@Component({
  selector: 'app-conference-jobs',
  templateUrl: './conference-jobs.component.html',
  styleUrls: ['./conference-jobs.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent,
    ConferenceJobsHeaderComponent,
    ConferenceSummaryCardsComponent,
    ConferenceJobsListComponent
  ]
})
export class ConferenceJobsComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;

  jobs: Job[] = [];

  currentConference!: Conference;
  currentConferenceId!: string
  countUsers: number = 0;
  countUsersWithJob: number = 0;
  currentSections!: Section[];

  currentUser!: User;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user && this.isReviewerOrModerator()) {
        this.currentUser = user;
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadingConference: boolean = true;
  loadingJobs: boolean = true;

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        this.homeItem = {
          icon: 'bi bi-house-door',
          routerLink: '/'
        };
        this.breadcrumbItems = [
          { label: this.getShortConferenceTitle(), routerLink: `/podium/conference/${this.currentConferenceId}` },
          { label: 'Участники' }
        ]
        this.sectionFilters = [...new Set(data.sections.map(section => section.title))].filter(Boolean);
        if (!this.isModeratorOfThisConferenceOrReviewer()) {
          this.router.navigate(['not-found']);
        }

        this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
          this.countUsers = data.all;
          this.countUsersWithJob = data.withJob;
        });

        this.httpService.getConferenceJobs(this.currentConferenceId).then((data) => {
          if (!this.isMasterModeratorOfThisConference()) {
            let find = this.currentConference.moderators.find((admin) => admin.id === this.currentUser.id);
            if (find) {
              let sections = this.currentConference.sections.filter((sec) => sec.leaders.filter((lead) => lead.id === find?.id).length > 0)
              this.jobs = data.filter((job) => sections.filter((sec) => sec.id === job.sectionId).length > 0);
              this.currentSections = sections.filter((sec) => this.jobs.filter((job) => job.sectionId === sec.id).length > 0);
            } else {

              let user: UserBase | undefined;
              let find1 = this.currentConference.sections.find((sec) => {
                if (sec.reviewers !== undefined && sec.reviewers.length !== 0) {
                  user = sec.reviewers.find((rev) => rev.id === this.currentUser.id)
                  return user !== undefined
                }
                return false;
              });

              if (find1) {
                let sections = this.currentConference.sections.filter((sec) => sec.reviewers.filter((rev) => rev.id === user?.id).length > 0)
                this.jobs = data.filter((job) => sections.filter((sec) => sec.id === job.sectionId).length > 0);
                this.currentSections = sections.filter((sec) => this.jobs.filter((job) => job.sectionId === sec.id).length > 0);
              }
            }
          } else {
            this.jobs = data
          }
          this.loadingJobs = false;
        }).catch(error => {
          this.loadingJobs = false;
          this.notificationService.showServerError();
        });
        this.loadingConference = false;
      }).catch(error => {
        this.loadingConference = false;
        this.notificationService.showServerError();
        if (error.status === 404) {
          this.router.navigate(['not-found']);
        }
      });
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
  }

  isMasterModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.isModeratorOfThisConferenceOrReviewer()) {
      if (this.currentConference.moderators !== undefined && this.currentConference.moderators.length !== 0) {
        let find = this.currentConference.moderators.find((admin) => admin.id === this.currentUser.id);
        if (find) {
          let length = this.currentConference.sections.filter((sec) => sec.leaders.filter((lead) => lead.id === find?.id).length === 0).length;
          return length === this.currentConference.sections.length
        }
      }
    }
    return false;
  }

  isModeratorOfThisConferenceOrReviewer(): boolean {
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

  isReviewerOrModerator(): boolean {
    return this.authService.hasRole('REVIEWER') || this.isModerator()
  }

  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER')
  }

  getShortConferenceTitle(): string {
    const title = this.currentConference?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  openJob(id: string) {
    this.toPage(`/podium/conference/${this.currentConferenceId}/job/${id}`)
  }

  downloadFilesJob(job: Job) {
    this.httpService.downloadFilesJob(String(job.id)).then(response => this.processDownloadFile(response))
    .catch(error => {
      this.notificationService.showFileDownloadError();
    });
  }

  downloadFilesConference() {
    if (this.isMasterModeratorOfThisConference()) {
      this.httpService.downloadFilesConference(this.currentConferenceId).then(response => this.processDownloadFile(response))
      .catch(error => {
        this.notificationService.showFileDownloadError();
      });
    } else {
      this.currentSections.forEach((sec) =>
          this.httpService.downloadFilesSection(String(sec.id)).then(response => this.processDownloadFile(response))
          .catch(error => {
            this.notificationService.showFileDownloadError();
          })
      );
    }
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

  sectionFilters: string[] = [];

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

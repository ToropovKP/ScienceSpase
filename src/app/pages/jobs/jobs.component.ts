import {Component, OnDestroy, OnInit} from '@angular/core';
import {Job} from "../../entities/job/model/job";
import {User} from "../../entities/user/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../../shared/services/http.service";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../../entities/conference/model/conference";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {NotificationService} from "../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../shared/ui/loading-spinner.component";
import {EmptyStateComponent} from "../../shared/ui/empty-state.component";
import {ToastContainerComponent} from "../../shared/ui/toast-container.component";
import {JobsListToolbarComponent} from "../../features/job-list/ui/jobs-list-toolbar.component";
import {JobCatalogGridComponent} from "../../features/job-list/ui/job-catalog-grid.component";
import {MenuItem} from "primeng/api";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent,
    JobsListToolbarComponent,
    JobCatalogGridComponent
  ]
})
export class JobsComponent implements OnInit, OnDestroy {

  jobs: Job[] = [];

  currentConferenceId!: string;
  currentConference!: Conference;
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
        filter(() => this.route.snapshot.component != null)
    )
    .subscribe((user) => {
      if (user) {
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

  loadingJobs: boolean = true;
  loadingConference: boolean = true;

  loadAllData() {
    this.route.queryParams.pipe(map(e => e['conferenceId'])).subscribe(e => {
      this.currentConferenceId = e;
      this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
        this.jobs = data;
        this.homeItem = {
          icon: 'bi bi-house-door',
          routerLink: '/'
        };
        this.breadcrumbItems = [
          {label: 'Мои статьи', routerLink: `/jobs`}
        ]
        this.loadingJobs = false;
        if (this.currentConferenceId !== undefined) {
          this.httpService.getConference(this.currentConferenceId).then((conf) => {
            this.currentConference = conf;
            this.breadcrumbItems?.push({label: this.getShortConferenceTitle()})
            this.loadingConference = false;
          }).catch(error => {
            this.notificationService.showServerError();
            this.loadingConference = false;
          });
          this.jobs = this.jobs.filter(job => String(job.conferenceId) === this.currentConferenceId)
        } else {
          this.loadingConference = false;
        }
      }).catch(error => {
        this.notificationService.showServerError();
        this.loadingJobs = false;
      });
    })
  }

  getShortConferenceTitle(): string {
    const title = this.currentConference?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  openJob(id: bigint) {
    this.toPage(`/job/${id}`)
  }

  addJob() {
    this.toPage(`/jobs/create`)
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

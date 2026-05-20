import {Component, OnDestroy, OnInit} from '@angular/core';
import {Job} from "../../../entities/podium/job/model/job";
import {User} from "../../../entities/shared/user/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../../../shared/services/http.service";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../../../entities/podium/conference/model/conference";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../../shared/services/auth.service";
import {NotificationService} from "../../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../../shared/ui/loading-spinner.component";
import {EmptyStateComponent} from "../../../shared/ui/empty-state.component";
import {ToastContainerComponent} from "../../../shared/ui/toast-container.component";
import {JobCatalogGridComponent} from "../../../features/podium/job-list/ui/job-catalog-grid.component";
import {filter} from "rxjs/operators";
import {PodiumSearchLineComponent} from "../../../features/podium/search-line/ui/podium-search-line.component";

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent,
    JobCatalogGridComponent,
    PodiumSearchLineComponent
  ]
})
export class JobsComponent implements OnInit, OnDestroy {
  readonly publicationTabs = [
    { key: 'all', label: 'Все публикации' },
    { key: 'pending', label: 'Ожидают проверки' },
    { key: 'reviewing', label: 'На рецензировании' },
    { key: 'team', label: 'Команда' },
  ] as const;

  selectedPublicationTab: 'all' | 'pending' | 'reviewing' | 'team' = 'all';

  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  searchQuery = '';

  currentConferenceId!: string;
  currentConference!: Conference;
  currentUser!: User;

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
        this.loadingJobs = false;
        if (this.currentConferenceId !== undefined) {
          this.httpService.getConference(this.currentConferenceId).then((conf) => {
            this.currentConference = conf;
            this.loadingConference = false;
          }).catch(error => {
            this.notificationService.showServerError();
            this.loadingConference = false;
          });
          this.jobs = this.jobs.filter(job => String(job.conferenceId) === this.currentConferenceId)
          this.applyFilters();
        } else {
          this.applyFilters();
          this.loadingConference = false;
        }
      }).catch(error => {
        this.notificationService.showServerError();
        this.loadingJobs = false;
      });
    })
  }

  openJob(id: bigint) {
    this.toPage(`/podium/job/${id}`)
  }

  addJob() {
    this.toPage(`/podium/jobs/create`)
  }

  editJob(id: bigint) {
    this.toPage(`/podium/job/${id}/edit`)
  }

  reviewJob(id: bigint) {
    this.toPage(`/podium/job/${id}`)
  }

  deleteJob(id: bigint) {
    this.httpService.deleteJob(String(id)).then(() => {
      this.jobs = this.jobs.filter((job) => job.id !== id);
      this.applyFilters();
      this.notificationService.showSuccess('Публикация', 'Публикация удалена');
    }).catch(() => {
      this.notificationService.showServerError();
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.applyFilters();
  }

  selectPublicationTab(tab: 'all' | 'pending' | 'reviewing' | 'team'): void {
    this.selectedPublicationTab = tab;
    this.applyFilters();
  }

  isPublicationTabActive(tab: 'all' | 'pending' | 'reviewing' | 'team'): boolean {
    return this.selectedPublicationTab === tab;
  }

  private applyFilters(): void {
    let result = [...this.jobs];

    if (this.selectedPublicationTab === 'pending') {
      result = result.filter((job) => job.status === 'PENDING_REVIEW');
    } else if (this.selectedPublicationTab === 'reviewing') {
      result = result.filter((job) => job.status === 'UNDER_REVISION');
    } else if (this.selectedPublicationTab === 'team') {
      result = result.filter((job) => (job.coAuthors?.length || 0) > 0);
    }

    const normalizedQuery = this.searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      this.filteredJobs = result;
      return;
    }

    this.filteredJobs = result.filter((job) => {
      const title = job.title?.toLowerCase() || '';
      const conference = job.conferenceTitle?.toLowerCase() || '';
      return title.includes(normalizedQuery) || conference.includes(normalizedQuery);
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

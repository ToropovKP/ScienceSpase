import {Component, OnDestroy, OnInit} from '@angular/core';
import {Conference} from "../../../entities/podium/conference/model/conference";
import {User} from "../../../entities/shared/user/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../../../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../../shared/services/auth.service";
import {NotificationService} from "../../../shared/services/notification.service";
import {AuthGuardService} from "../../../shared/services/auth-guard.service";
import {LoadingSpinnerComponent} from "../../../shared/ui/loading-spinner.component";
import {EmptyStateComponent} from "../../../shared/ui/empty-state.component";
import {ToastContainerComponent} from "../../../shared/ui/toast-container.component";
import {ConferenceListPageHeaderComponent} from "../../../features/podium/conference-list/ui/conference-list-page-header.component";
import {ConferenceCatalogGridComponent} from "../../../features/podium/conference-list/ui/conference-catalog-grid.component";
import {Subject, takeUntil} from "rxjs";
import {filter} from "rxjs/operators";
import {ConferenceDashboardStatsComponent} from "../../../features/podium/conference-dashboard-stats/ui/conference-dashboard-stats.component";

@Component({
  selector: 'app-conferences',
  templateUrl: './conferences.component.html',
  styleUrls: ['./conferences.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent,
    ConferenceListPageHeaderComponent,
    ConferenceCatalogGridComponent,
    ConferenceDashboardStatsComponent
  ]
})
export class ConferencesComponent implements OnInit, OnDestroy {

  conferences: Conference[] = [];
  filteredConferences: Conference[] = [];
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private authGuardService: AuthGuardService
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
      }
    });
    this.loadAllData()
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadingConference: boolean = true;

  loadAllData() {
    this.currentUser = this.authService.getUserInfo();

    this.httpService.getConferences().then((data) => {
      this.conferences = data || [];
      this.filteredConferences = [...this.conferences];
      this.loadingConference = false;
    }).catch(error => {
      const status = error?.status || error?.error?.status;
      if (status !== 401 && status !== 403) {
        this.notificationService.showServerError();
      }
      this.conferences = [];
      this.filteredConferences = [];
      this.loadingConference = false;
    });
  }

  isAdmin(): boolean {
    return this.authGuardService.isAdmin();
  }

  createConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage('/podium/conferences/create');
    });
  }

  openConf(id: bigint): void {
    this.router.navigate([`/podium/conference/${id}`]);
  }

  editConf(id: bigint): void {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.router.navigate([`/podium/conference/${id}/edit`]);
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

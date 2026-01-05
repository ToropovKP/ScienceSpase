import {Component, OnDestroy, OnInit} from '@angular/core';
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {conferenceStatusMap} from "../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";
import {NotificationService} from "../shared/services/notification.service";
import {AuthGuardService} from "../shared/services/auth-guard.service";
import {LoadingSpinnerComponent} from "../shared/components/ui/loading-spinner.component";
import {EmptyStateComponent} from "../shared/components/ui/empty-state.component";
import {ToastContainerComponent} from "../shared/components/ui/toast-container.component";
import {Subject, takeUntil} from "rxjs";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-conferences',
  templateUrl: './conferences.component.html',
  styleUrls: ['./conferences.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent
  ]
})
export class ConferencesComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  conferences: Conference[] = [];
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
        filter(() => this.route.snapshot.component != null) // Проверка активности
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
      this.loadingConference = false;
    }).catch(error => {
      // Для неавторизованных пользователей (401, 403) не показываем ошибку, просто пустой список
      const status = error?.status || error?.error?.status;
      if (status !== 401 && status !== 403) {
        this.notificationService.showServerError();
      }
      this.conferences = [];
      this.loadingConference = false;
    });
  }

  isAdmin(): boolean {
    return this.authGuardService.isAdmin();
  }

  createConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage('/conferences/create');
    });
  }

  openConf(id: bigint): void {
    this.router.navigate([`/conference/${id}`]);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

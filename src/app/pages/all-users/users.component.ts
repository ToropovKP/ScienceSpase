import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from "../../entities/user/model/user";
import {userRoleMap, userStatusMap} from "../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {ShortNamePipe} from "../../shared/pipes/short.name.pipe";
import {Subject, takeUntil} from "rxjs";
import {filter, debounceTime, distinctUntilChanged, skip} from "rxjs/operators";
import {NotificationService} from "../../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../../shared/ui/loading-spinner.component";
import {EmptyStateComponent} from "../../shared/ui/empty-state.component";
import {ToastContainerComponent} from "../../shared/ui/toast-container.component";
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {PaginationComponent} from "../../shared/ui/pagination.component";
import {AuthGuardService} from "../../shared/services/auth-guard.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [
    CommonModule,
    ShortNamePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent,
    ConfirmPopupModule,
    PaginationComponent,
    ReactiveFormsModule
  ],
  providers: [ConfirmationService]
})
export class UsersComponent implements OnInit, OnDestroy {

  protected readonly userStatusMap = userStatusMap;
  protected readonly userRoleMap = userRoleMap;

  users: User[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalUsers: number = 0;
  filterName: FormControl = new FormControl('');
  loadingData: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
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
        this.setupFilterSubscription();
        this.loadAllData();
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  private filterSubscriptionInitialized = false;

  private setupFilterSubscription(): void {
    // Создаем подписку только один раз
    if (this.filterSubscriptionInitialized) {
      return;
    }
    this.filterSubscriptionInitialized = true;
    
    this.filterName.valueChanges
      .pipe(
        skip(1), // Пропускаем начальное значение, чтобы избежать двойного запроса
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadAllData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData() {
    this.loadingData = true;
    const filter = this.filterName.value?.trim() || undefined;
    this.httpService.getUsersPaginated(this.currentPage, this.pageSize, filter)
      .then((data) => {
        this.users = data.content;
        this.totalUsers = data.total;
        this.loadingData = false;
      })
      .catch(error => {
        this.notificationService.showServerError();
        this.loadingData = false;
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAllData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAllData();
  }

  clearFilter(): void {
    this.filterName.setValue('', { emitEvent: false });
    this.currentPage = 1;
    this.loadAllData();
  }

  openProfile(userId: bigint) {
    this.toPage(`/profile/${userId}`)
  }

  isAdmin(): boolean {
    return this.authGuardService.isAdmin();
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  confirmRole(event: Event, user: User) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить роль?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        let role = user.role == 'MEMBER' ? 'MODERATOR' : 'MEMBER';
        this.httpService.changeUserRole(String(user.id), role).then((data) => {
          if (data) {
            user.role = role;
            this.notificationService.showSuccess('Успешно', 'Роль изменена');
            this.loadAllData();
          }
        }).catch(error => {
          this.notificationService.showError('Не удалось изменить роль');
        });
      },
      reject: () => {
        this.notificationService.showWarning('Отменено', 'Действие отменено');
      }
    });
  }

  confirmStatus(event: Event, user: User) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить статус?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        let status = user.status == 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        this.httpService.changeUserStatus(String(user.id), status).then((data) => {
          if (data) {
            user.status = status;
            this.notificationService.showSuccess('Успешно', 'Статус изменен');
            this.loadAllData();
          }
        }).catch(error => {
          this.notificationService.showError('Не удалось изменить статус');
        });
      },
      reject: () => {
        this.notificationService.showWarning('Отменено', 'Действие отменено');
      }
    });
  }
}

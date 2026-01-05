import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {userRoleMap, userStatusMap} from "../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";
import {FirstWordPipe} from "../shared/pipes/first.word.pipe";
import {ShortNamePipe} from "../shared/pipes/short.name.pipe";
import {Subject, takeUntil} from "rxjs";
import {filter} from "rxjs/operators";
import {NotificationService} from "../shared/services/notification.service";
import {LoadingSpinnerComponent} from "../shared/components/ui/loading-spinner.component";
import {EmptyStateComponent} from "../shared/components/ui/empty-state.component";
import {ToastContainerComponent} from "../shared/components/ui/toast-container.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [
    CommonModule,
    FirstWordPipe,
    ShortNamePipe,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ToastContainerComponent
  ]
})
export class UsersComponent implements OnInit, OnDestroy {

  protected readonly userStatusMap = userStatusMap;
  protected readonly userRoleMap = userRoleMap;

  users: User[] = [];

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
      if (user) {
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

  loadingData: boolean = true;

  loadAllData() {
    this.httpService.getUsers().then((data) => {
      this.users = data
      this.loadingData = false;
    }).catch(error => {
      this.notificationService.showServerError();
      this.loadingData = false;
    });
  }

  openProfile(userId: bigint) {
    this.toPage(`/profile/${userId}`)
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

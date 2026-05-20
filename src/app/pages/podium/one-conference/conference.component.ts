import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Router} from "@angular/router";
import {Section} from "../../../entities/podium/conference/model/section";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../../../entities/podium/conference/model/conference";
import {User} from "../../../entities/shared/user/model/user";
import {HttpService} from "../../../shared/services/http.service";
import {UserBase} from "../../../entities/shared/user/model/user.base";
import {CommonModule} from "@angular/common";
import {conferenceStatusMap} from "../../../app.constants";
import {AuthService} from "../../../shared/services/auth.service";
import {MenuItem} from "primeng/api";
import {filter} from "rxjs/operators";
import {NotificationService} from "../../../shared/services/notification.service";
import {AuthGuardService} from "../../../shared/services/auth-guard.service";
import {LoadingSpinnerComponent} from "../../../shared/ui/loading-spinner.component";
import {ToastContainerComponent} from "../../../shared/ui/toast-container.component";
import {DateService} from "../../../shared/services/date.service";

@Component({
  selector: 'app-one-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.css'],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    ToastContainerComponent
  ]
})
export class ConferenceComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  currentConference: Conference = {} as Conference;
  currentConferenceId!: string;
  countUsers: number = 0;
  countUsersWithJob: number = 0;
  currentAdmins!: UserBase[];
  sections: Section[] = []

  currentUser!: User;
  currentUserJobId: string | null = null;
  isRegisteredForConference = false;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private authGuardService: AuthGuardService
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
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        this.homeItem = {
          icon: 'bi bi-house-door',
          routerLink: '/'
        };
        this.breadcrumbItems = [
          {label: this.getShortConferenceTitle()}
        ]
        this.sections = data.sections.sort((a, b) => Number(a.id) - Number(b.id))
        this.currentAdmins = this.currentConference.moderators;

        if (this.isModerator()) {
          this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
            this.countUsers = data.all;
            this.countUsersWithJob = data.withJob;
          }).catch(error => {
            this.notificationService.showServerError();
          });
        }

        this.updateUserInfo()
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

  updateUserInfo() {
    if (!this.currentUser) {
      this.isRegisteredForConference = this.readRegistrationFlag();
      return;
    }
    this.currentUserJobId = null;
    this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
      this.currentUserJobId = null;
      data.forEach((job) => {
        if (String(job.conferenceId) === this.currentConferenceId) {
          this.currentUserJobId = String(job.id)
          return
        }
      });
      this.isRegisteredForConference = !!this.currentUserJobId || this.readRegistrationFlag();
    }).catch(error => {
      this.notificationService.showServerError();
      this.isRegisteredForConference = this.readRegistrationFlag();
    });
  }

  isUserAuthorized(): boolean {
    return this.currentUser !== undefined && this.currentUser != null;
  }

  isAdmin(): boolean {
    return this.authGuardService.isAdmin();
  }

  isModerator(): boolean {
    return this.authGuardService.isModerator();
  }

  isModeratorOfThisConference(): boolean {
    if (!this.currentUser) {
      return false;
    }
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentAdmins !== undefined && this.currentAdmins.length !== 0) {
      let find = this.currentAdmins.find((admin) => admin.id === this.currentUser.id);
      return this.isModerator() && find !== undefined
    }
    return false;
  }

  isReviewer(): boolean {
    return this.authService.hasRole('REVIEWER')
  }

  getShortConferenceTitle(): string {
    const title = this.currentConference?.title || '';
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  getTeamPreview(): string {
    if (!this.currentAdmins || this.currentAdmins.length === 0) {
      return 'Команда...';
    }
    const first = this.currentAdmins[0];
    return `${first.lastName} ${first.firstName?.charAt(0)}.`;
  }

  getTeamInitials(): string {
    const preview = this.getTeamPreview().trim();
    if (!preview) {
      return 'К';
    }
    return preview.charAt(0).toUpperCase();
  }

  getParticipantsLabel(): string {
    if (this.isModerator() || this.isAdmin() || this.countUsers > 0) {
      return `${this.countUsers} участников`;
    }
    return 'Данные недоступны';
  }

  getUserShortName(user: UserBase): string {
    const firstNameInitial = user.firstName ? `${user.firstName.charAt(0)}.` : '';
    const middleNameInitial = user.middleName ? `${user.middleName.charAt(0)}.` : '';
    return `${user.lastName} ${firstNameInitial}${middleNameInitial}`.trim();
  }

  getUsersShort(users: UserBase[] | null | undefined): string {
    if (!users || users.length === 0) {
      return 'Не назначен';
    }
    return users.map((user) => this.getUserShortName(user)).join(', ');
  }

  checkUsers() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage(`/podium/conference/${this.currentConferenceId}/participants`);
    });
  }

  editConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage(`/podium/conference/${this.currentConferenceId}/edit`);
    });
  }

  addJob() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      if (!this.isRegisteredForConference) {
        this.notificationService.showInfo('Регистрация', 'Сначала зарегистрируйтесь на конференцию.');
        return;
      }
      let navigationExtras: NavigationExtras = {
        queryParams: {'conferenceId': this.currentConferenceId},
      };
      this.toPageExtras(`/podium/jobs/create`, navigationExtras);
    });
  }

  openJob() {
    let navigationExtras: NavigationExtras = {
      queryParams: {'conferenceId': this.currentConferenceId},
    };
    this.toPageExtras(`/podium/jobs`, navigationExtras)
  }

  registerForConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.httpService.registerForConference(this.currentConferenceId).then(() => {
        this.isRegisteredForConference = true;
        this.persistRegistrationFlag(true);
        this.notificationService.showSuccess('Конференция', 'Вы зарегистрированы на конференцию.');
      }).catch(() => {
        this.notificationService.showServerError();
      });
    });
  }

  unregisterFromConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.httpService.unregisterFromConference(this.currentConferenceId).then(() => {
        this.isRegisteredForConference = false;
        this.persistRegistrationFlag(false);
        this.notificationService.showSuccess('Конференция', 'Регистрация отменена.');
      }).catch((error) => {
        if (error?.status === 409) {
          this.notificationService.showWarning('Конференция', 'Нельзя отменить регистрацию, пока у вас есть поданные работы.');
          return;
        }
        this.notificationService.showServerError();
      });
    });
  }

  canManageOwnRegistration(): boolean {
    return this.isUserAuthorized() && !this.isAdmin() && !this.isModeratorOfThisConference() && !this.isReviewer();
  }

  private registrationStorageKey(): string | null {
    if (!this.currentUser || !this.currentConferenceId) {
      return null;
    }
    return `conference-registration:${this.currentUser.id}:${this.currentConferenceId}`;
  }

  private persistRegistrationFlag(value: boolean): void {
    const key = this.registrationStorageKey();
    if (!key) {
      return;
    }
    try {
      if (value) {
        localStorage.setItem(key, '1');
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  }

  private readRegistrationFlag(): boolean {
    const key = this.registrationStorageKey();
    if (!key) {
      return false;
    }
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  toPageExtras(link: string, extras: NavigationExtras) {
    this.router.navigate([link], extras);
  }
}

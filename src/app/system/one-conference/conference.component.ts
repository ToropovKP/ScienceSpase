import {Component, OnDestroy, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, NavigationExtras, Router} from "@angular/router";
import {Section} from "../../entities/conference/model/section";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../../entities/conference/model/conference";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {UserBase} from "../../entities/user/model/user.base";
import {CommonModule} from "@angular/common";
import {conferenceStatusMap} from "../../app.constants";
import {DateService} from "../../shared/services/date.service";
import {AuthService} from "../../shared/services/auth.service";
import {MenuItem} from "primeng/api";
import {filter} from "rxjs/operators";
import {PopoverModule} from "primeng/popover";
import {Tooltip} from "primeng/tooltip";
import {NotificationService} from "../../shared/services/notification.service";
import {AuthGuardService} from "../../shared/services/auth-guard.service";
import {LoadingSpinnerComponent} from "../../shared/ui/loading-spinner.component";
import {BreadcrumbWrapperComponent} from "../../shared/ui/breadcrumb-wrapper.component";
import {ToastContainerComponent} from "../../shared/ui/toast-container.component";

@Component({
  selector: 'app-one-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PopoverModule,
    Tooltip,
    LoadingSpinnerComponent,
    BreadcrumbWrapperComponent,
    ToastContainerComponent
  ]
})
export class ConferenceComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  currentConference: Conference = {} as Conference;
  currentConferenceId!: string;
  countUsers: number = 0;
  currentAdmins!: UserBase[];
  sections: Section[] = []

  currentUser!: User;
  currentUserJobId!: string;

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
        console.log(this.sections)
        this.currentAdmins = this.currentConference.admins;

        if (this.isModerator()) {
          this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
            this.countUsers = data
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
      return;
    }
    this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
      data.forEach((job) => {
        if (String(job.conferenceId) === this.currentConferenceId) {
          this.currentUserJobId = String(job.id)
          return
        }
      })
    }).catch(error => {
      this.notificationService.showServerError();
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

  checkUsers() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage(`/conference/${this.currentConferenceId}/jobs`);
    });
  }

  editConference() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      this.toPage(`/conference/${this.currentConferenceId}/edit`);
    });
  }

  addJob() {
    this.authGuardService.executeIfAuthorized(this.currentUser, () => {
      let navigationExtras: NavigationExtras = {
        queryParams: {'conferenceId': this.currentConferenceId},
      };
      this.toPageExtras(`/jobs/create`, navigationExtras);
    });
  }

  openJob() {
    let navigationExtras: NavigationExtras = {
      queryParams: {'conferenceId': this.currentConferenceId},
    };
    this.toPageExtras(`/jobs`, navigationExtras)
  }

  getLeadersString(leaders: UserBase[]) {
    return leaders.map((lead) => lead.lastName + " " + lead.firstName + (lead.middleName !== '' ? " " + lead.middleName : '')).join(", ")
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  toPageExtras(link: string, extras: NavigationExtras) {
    this.router.navigate([link], extras);
  }
}

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, NavigationExtras, Router} from "@angular/router";
import {Section} from "../shared/model/section";
import {map, Subject, takeUntil} from "rxjs";
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {UserBase} from "../shared/model/user.base";
import {CommonModule} from "@angular/common";
import {conferenceStatusMap} from "../../app.constants";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MenuItem, MessageService} from "primeng/api";
import {filter} from "rxjs/operators";
import {PopoverModule} from "primeng/popover";
import {Tooltip} from "primeng/tooltip";
import {BreadcrumbModule} from "primeng/breadcrumb";

@Component({
  selector: 'app-one-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.css'],
  imports: [ReactiveFormsModule, CommonModule, ToastModule, BreadcrumbModule, PopoverModule, Tooltip],
  providers: [MessageService]
})
export class ConferenceComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  currentConference: Conference = new Conference();
  currentConferenceId!: string;
  countUsers: number = 0;
  currentAdmins!: UserBase[];
  sections: Section[] = []

  currentUser!: User;
  currentUserJobId!: string;

  homeItem: MenuItem | undefined;
  breadcrumbItems: MenuItem[] | undefined;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
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
        this.currentAdmins = this.currentConference.admins;

        if (this.isModerator()) {
          this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
            this.countUsers = data
          }).catch(error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Возникла непредвиденная ошибка',
              detail: 'Ошибка на стороне сервера',
              life: 3000
            });
          });
        }

        this.updateUserInfo()
        this.loadingConference = false;
      }).catch(error => {
        this.loadingConference = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Ошибка на стороне сервера',
          life: 3000
        });
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
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Ошибка на стороне сервера',
        life: 3000
      });
    });
  }

  isUserAuthorized(): boolean {
    return this.currentUser !== undefined && this.currentUser != null;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isModerator(): boolean {
    return this.authService.hasRole('MODERATOR') || this.isAdmin();
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
    if (this.currentUser && this.currentUser.verified) {
      this.toPage(`/conference/${this.currentConferenceId}/jobs`);
    } else if (!this.currentUser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Отклонено',
        detail: 'Необходимо выполнить вход в аккаунт',
        life: 3000
      });
    } else if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
    }
  }

  editConference() {
    if (this.currentUser && this.currentUser.verified) {
      this.toPage(`/conference/${this.currentConferenceId}/edit`);
    } else if (!this.currentUser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Отклонено',
        detail: 'Необходимо выполнить вход в аккаунт',
        life: 3000
      });
    } else if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
    }
  }

  addJob() {
    if (this.currentUser && this.currentUser.verified) {
      let navigationExtras: NavigationExtras = {
        queryParams: {'conferenceId': this.currentConferenceId},
      };
      this.toPageExtras(`/jobs/create`, navigationExtras)
    } else if (!this.currentUser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Отклонено',
        detail: 'Необходимо выполнить вход в аккаунт',
        life: 3000
      });
    } else if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
    }
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

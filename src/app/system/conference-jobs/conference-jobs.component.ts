import {Component, OnDestroy, OnInit} from '@angular/core';
import {conferenceStatusMap} from "../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpResponse} from "@angular/common/http";
import {Job} from "../shared/model/job";
import {Conference} from "../shared/model/conference";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Section} from "../shared/model/section";
import {UserBase} from "../shared/model/user.base";
import {CommonModule} from "@angular/common";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {filter} from "rxjs/operators";
import {ClickOutsideDirective} from "../shared/directives/click-outside.directive";

@Component({
  selector: 'app-conference-jobs',
  templateUrl: './conference-jobs.component.html',
  styleUrls: ['./conference-jobs.component.css'],
  imports: [CommonModule, ToastModule, ClickOutsideDirective],
  providers: [MessageService]
})
export class ConferenceJobsComponent implements OnInit, OnDestroy {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;
  protected readonly String = String;

  jobs: Job[] = [];

  currentConference!: Conference;
  currentConferenceId!: string
  countUsers: number = 0;
  currentSections!: Section[];

  currentUser!: User;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
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
        this.sectionFilters = [...new Set(data.sections.map(section => section.title))].filter(Boolean);
        if (!this.isModeratorOfThisConferenceOrReviewer()) {
          this.router.navigate(['not-found']);
        }

        this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
          this.countUsers = data
        });

        this.httpService.getConferenceJobs(this.currentConferenceId).then((data) => {
          if (!this.isMasterModeratorOfThisConference()) {
            let find = this.currentConference.admins.find((admin) => admin.id === this.currentUser.id);
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
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Ошибка на стороне сервера',
            life: 3000
          });
        });
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
      if (this.currentConference.admins !== undefined && this.currentConference.admins.length !== 0) {
        let find = this.currentConference.admins.find((admin) => admin.id === this.currentUser.id);
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
    if (this.currentConference.admins !== undefined && this.currentConference.admins.length !== 0) {
      let find = this.currentConference.admins.find((admin) => admin.id === this.currentUser.id);
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

  openJob(id: string) {
    this.toPage(`conference/${this.currentConferenceId}/jobs/${id}`)
  }

  downloadFilesJob(job: Job) {
    this.httpService.downloadFilesJob(String(job.id)).then(response => this.processDownloadFile(response))
    .catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось скачать файлы',
        life: 3000
      });
    });
  }

  downloadFilesConference() {
    if (this.isMasterModeratorOfThisConference()) {
      this.httpService.downloadFilesConference(this.currentConferenceId).then(response => this.processDownloadFile(response))
      .catch(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Не удалось скачать файлы',
          life: 3000
        });
      });
    } else {
      this.currentSections.forEach((sec) =>
          this.httpService.downloadFilesSection(String(sec.id)).then(response => this.processDownloadFile(response))
          .catch(error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Возникла непредвиденная ошибка',
              detail: 'Не удалось скачать файлы',
              life: 3000
            });
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

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.jobs.sort((a, b) => {
      let valueA, valueB;

      switch (column) {
        case 'userName':
          valueA = a.userName?.toLowerCase() || '';
          valueB = b.userName?.toLowerCase() || '';
          break;
        case 'title':
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          break;
        case 'sectionTitle':
          valueA = a.sectionTitle?.toLowerCase() || '';
          valueB = b.sectionTitle?.toLowerCase() || '';
          break;
        case 'dateTime':
          valueA = new Date(a.dateTime).getTime();
          valueB = new Date(b.dateTime).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  sectionFilters: string[] = [];
  selectedSections: string[] = [];
  showSectionFilter: boolean = false;

  get filteredJobs() {
    if (!this.selectedSections.length) return this.jobs;
    return this.jobs.filter(job =>
        this.selectedSections.includes(job.sectionTitle)
    );
  }

  toggleSectionFilter(section: string) {
    if (this.selectedSections.includes(section)) {
      this.selectedSections = this.selectedSections.filter(s => s !== section);
    } else {
      this.selectedSections = [...this.selectedSections, section];
    }
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

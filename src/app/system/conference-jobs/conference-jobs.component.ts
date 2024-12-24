import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AppConstants} from "../../app.constants";
import {ActivatedRoute, Router} from "@angular/router";
import { HttpResponse } from "@angular/common/http";
import {Job} from "../shared/model/job";
import {Conference} from "../shared/model/conference";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Section} from "../shared/model/section";
import {AlertService} from "../shared/services/alert.service";
import {UserBase} from "../shared/model/user.base";
import {ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";

@Component({
    selector: 'app-conference-jobs',
    templateUrl: './conference-jobs.component.html',
    styleUrls: ['./conference-jobs.component.css'],
    imports: [CommonModule]
})
export class ConferenceJobsComponent implements OnInit, AfterViewInit {

  protected readonly AppConstants = AppConstants;

  jobs: Job[] = [];

  currentConference!: Conference;
  currentConferenceId!: string
  countUsers: number = 0;
  currentSections!: Section[];

  currentUser!: User;
  email!: string;
  role!: string;
  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService) {
  }

  checkLogin(): boolean {
    let email: string | null = sessionStorage.getItem("email");
    let role: string | null = sessionStorage.getItem("role");

    if (email != null) {
      this.email = email;
      this.role = role ? role : '';
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
      return true;
    } else {
      this.email = '';
      this.role = '';
      return false;
    }
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit(): void {
    if (!this.checkLogin() || !this.isReviewerOrModerator()) {
      this.router.navigate(['']);
    }

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        if (!this.isModeratorOfThisConferenceOrReviewer()) {
          this.router.navigate(['']);
        }

        this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
          this.countUsers = data
        });

        this.httpService.getConferenceJobs(this.currentConferenceId).then((data) => {
          if (!this.isMasterModeratorOfThisConference()) {
            let find = this.currentConference.admins.find((admin) => admin.id == this.currentUser.id);
            if (find) {
              let sections = this.currentConference.sections.filter((sec) => sec.leaders.filter((lead) => lead.id == find?.id).length > 0)
              this.jobs = data.filter((job) => sections.filter((sec) => sec.id == job.sectionId).length > 0);
              this.currentSections = sections.filter((sec) => this.jobs.filter((job) => job.sectionId == sec.id).length > 0);
            } else {

              let user: UserBase | undefined;
              let find1 = this.currentConference.sections.find((sec) => {
                if (sec.reviewers != undefined && sec.reviewers.length != 0) {
                  user = sec.reviewers.find((rev) => rev.id == this.currentUser.id)
                  return user != undefined
                }
                return false;
              });

              if (find1) {
                let sections = this.currentConference.sections.filter((sec) => sec.reviewers.filter((rev) => rev.id == user?.id).length > 0)
                this.jobs = data.filter((job) => sections.filter((sec) => sec.id == job.sectionId).length > 0);
                this.currentSections = sections.filter((sec) => this.jobs.filter((job) => job.sectionId == sec.id).length > 0);
              }
            }
          } else {
            this.jobs = data
          }
        }).catch(error => {
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
        });
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    });
  }

  isAdmin(): boolean {
    return this.role == 'ADMIN';
  }

  isModerator(): boolean {
    return this.role == 'MODERATOR' || this.isAdmin();
  }

  isMasterModeratorOfThisConference(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.isModeratorOfThisConferenceOrReviewer()) {
      if (this.currentConference.admins != undefined && this.currentConference.admins.length != 0) {
        let find = this.currentConference.admins.find((admin) => admin.id == this.currentUser.id);
        if (find) {
          let length = this.currentConference.sections.filter((sec) => sec.leaders.filter((lead) => lead.id == find?.id).length == 0).length;
          return length == this.currentConference.sections.length
        }
      }
    }
    return false;
  }

  isModeratorOfThisConferenceOrReviewer(): boolean {
    if (this.isAdmin()) {
      return true;
    }
    if (this.currentConference.admins != undefined && this.currentConference.admins.length != 0) {
      let find = this.currentConference.admins.find((admin) => admin.id == this.currentUser.id);

      if (!find) {
        let find1 = this.currentConference.sections.find((sec) => {
          if (sec.reviewers != undefined && sec.reviewers.length != 0) {
            let find2 = sec.reviewers.find((rev) => rev.id == this.currentUser.id);
            return this.role == 'REVIEWER' && find2 != undefined
          }
          return false;
        });

        return find1 != undefined;
      }

      return this.role == 'MODERATOR'
    }

    return false;
  }

  isReviewerOrModerator(): boolean {
    return this.role == 'REVIEWER' || this.isModerator()
  }

  isReviewer(): boolean {
    return this.role == 'REVIEWER'
  }

  openJob(id: string) {
    this.toPage(`/jobs/${id}`)
  }

  downloadFilesJob(job: Job) {
    this.httpService.downloadFilesJob(String(job.id)).then(response => this.processDownloadFile(response))
      .catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
  }

  downloadFilesConference() {
    if (this.isMasterModeratorOfThisConference()) {
      this.httpService.downloadFilesConference(this.currentConferenceId).then(response => this.processDownloadFile(response))
        .catch(error => {
          let title = "Возникла непредвиденная ошибка";
          let description = 'Ошибка на стороне сервера';
          this.alertService.constructErrorAlert(error, title, description);
        });
    } else {
      this.currentSections.forEach((sec) =>
        this.httpService.downloadFilesSection(String(sec.id)).then(response => this.processDownloadFile(response))
          .catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
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

  toPage(link: string) {
    this.router.navigate([link]);
  }

  protected readonly String = String;
}

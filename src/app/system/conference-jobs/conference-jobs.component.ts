import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AppConstants} from "../../app.module";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpResponse} from "@angular/common/http";
import {LoginResponse} from "../shared/model/login.response";
import {Job} from "../shared/model/job";
import {Conference} from "../shared/model/conference";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {Section} from "../shared/model/section";
import {AlertService} from "../shared/services/alert.service";

@Component({
  selector: 'app-conference-jobs',
  templateUrl: './conference-jobs.component.html',
  styleUrls: ['./conference-jobs.component.css']
})
export class ConferenceJobsComponent implements OnInit, AfterViewInit {

  protected readonly AppConstants = AppConstants;

  jobs: Job[] = [];

  currentConference!: Conference;
  currentConferenceId!: string
  countUsers: number = 0;
  currentSections!: Section[];

  currentUser!: User;
  loggedUser!: LoginResponse;
  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService) {
  }

  checkLogin(): boolean {
    let json: string | null = sessionStorage.getItem("user");
    let obj: LoginResponse | null = json != null ? JSON.parse(json) : null;

    if (obj != null) {
      this.loggedUser = obj;
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
      return true;
    } else {
      this.loggedUser = new LoginResponse();
      this.loggedUser.email = '';
      return false;
    }
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit(): void {
    if (!this.checkLogin() || !this.isAdminAbsolute()) {
      this.router.navigate(['']);
    }

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getConference(this.currentConferenceId).then((data) => {
        this.currentConference = data;
        if (!this.isAdminConference()) {
          this.router.navigate(['']);
        }

        this.httpService.getConferenceUsers(this.currentConferenceId).then((data) => {
          this.countUsers = data
        });

        this.httpService.getConferenceJobs(this.currentConferenceId).then((data) => {
          if (!this.isMasterAdminConference()) {
            let find = this.currentConference.admins.find((admin) => admin.id == this.currentUser.id);
            if (find) {
              let sections = this.currentConference.sections.filter((sec) => sec.leaders.filter((lead) => lead.id == find?.id).length > 0)
              this.jobs = data.filter((job) => sections.filter((sec) => sec.id == job.sectionId).length > 0);
              this.currentSections = sections.filter((sec) => this.jobs.filter((job) => job.sectionId == sec.id).length > 0);
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

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  isAdminAbsolute(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.isSuperAdmin();
  }

  isAdminConference(): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    if (this.currentConference.admins != undefined && this.currentConference.admins.length != 0) {
      let find = this.currentConference.admins.find((admin) => admin.id == this.currentUser.id);
      return this.loggedUser.role == 'ADMIN' && find != undefined
    }
    return false;
  }

  isMasterAdminConference(): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    if (this.isAdminConference()) {
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
    if (this.isMasterAdminConference()) {
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

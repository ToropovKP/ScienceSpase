import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Job} from "../shared/model/job";
import {User} from "../shared/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";

@Component({
    selector: 'app-jobs',
    templateUrl: './jobs.component.html',
    styleUrls: ['./jobs.component.css'],
    imports: [CommonModule]
})
export class JobsComponent implements OnInit, AfterViewInit {

  jobs: Job[] = [];

  currentConferenceId!: string;
  currentConference!: Conference;
  currentUser!: User;
  email!: string;
  role!: string;

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
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }
    this.loadAllData()
  }

  loadAllData() {
    let user_info: string | null = sessionStorage.getItem("user_info");
    this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
    this.route.queryParams.pipe(map(e => e['conferenceId'])).subscribe(e => {
      this.currentConferenceId = e;

      this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
        this.jobs = data;
        if (e != undefined) {
          this.httpService.getConference(this.currentConferenceId).then((conf) => {
            this.currentConference = conf;
          }).catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
          });
          this.jobs = this.jobs.filter(job => job.conferenceId == e)
        }
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    })
  }

  isModerator(): boolean {
    return this.isAdmin() || this.role == 'MODERATOR';
  }

  isAdmin(): boolean {
    return this.role == 'ADMIN';
  }

  openJob(id: bigint) {
    this.toPage(`/jobs/${id}`)
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

}

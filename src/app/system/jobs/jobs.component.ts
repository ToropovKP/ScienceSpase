import {Component, OnInit} from '@angular/core';
import {Job} from "../shared/model/job";
import {User} from "../shared/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css'],
  imports: [CommonModule]
})
export class JobsComponent implements OnInit {

  jobs: Job[] = [];

  currentConferenceId!: string;
  currentConference!: Conference;
  currentUser!: User;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.loadAllData()
      } else {
        this.router.navigate(['']);
      }
    });
  }

  loadAllData() {
    this.route.queryParams.pipe(map(e => e['conferenceId'])).subscribe(e => {

      this.currentConferenceId = e;
      this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
        this.jobs = data;
        if (this.currentConferenceId !== undefined) {
          this.httpService.getConference(this.currentConferenceId).then((conf) => {
            this.currentConference = conf;
          }).catch(error => {
            let title = "Возникла непредвиденная ошибка";
            let description = 'Ошибка на стороне сервера';
            this.alertService.constructErrorAlert(error, title, description);
          });
          this.jobs = this.jobs.filter(job => String(job.conferenceId) === this.currentConferenceId)
        }
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    })
  }

  openJob(id: bigint) {
    this.toPage(`/jobs/${id}`)
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

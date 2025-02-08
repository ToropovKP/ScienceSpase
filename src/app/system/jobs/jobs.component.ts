import {Component, OnInit} from '@angular/core';
import {Job} from "../shared/model/job";
import {User} from "../shared/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map} from "rxjs";
import {Conference} from "../shared/model/conference";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css'],
  imports: [CommonModule, ToastModule],
  providers: [MessageService]
})
export class JobsComponent implements OnInit {

  jobs: Job[] = [];

  currentConferenceId!: string;
  currentConference!: Conference;
  currentUser!: User;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  loadingJobs: boolean = true;
  loadingConference: boolean = true;

  loadAllData() {
    this.route.queryParams.pipe(map(e => e['conferenceId'])).subscribe(e => {
      this.currentConferenceId = e;
      this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
        this.jobs = data;
        this.loadingJobs = false;
        if (this.currentConferenceId !== undefined) {
          this.httpService.getConference(this.currentConferenceId).then((conf) => {
            this.currentConference = conf;
            this.loadingConference = false;
          }).catch(error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Возникла непредвиденная ошибка',
              detail: 'Ошибка на стороне сервера',
              life: 3000
            });
            this.loadingConference = false;
          });
          this.jobs = this.jobs.filter(job => String(job.conferenceId) === this.currentConferenceId)
        }
      }).catch(error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Ошибка на стороне сервера',
          life: 3000
        });
        this.loadingJobs = false;
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

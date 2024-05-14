import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Job} from "../shared/model/job";
import {LoginResponse} from "../shared/model/login.response";
import {User} from "../shared/model/user";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";

@Component({
  selector: 'app-my-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit, AfterViewInit {

  jobs: Job[] = [];

  currentUser!: User;
  loggedUser!: LoginResponse;

  constructor(private router: Router,
              private httpService: HttpService) {
  }

  checkLogin(): boolean {
    let json: string | null = sessionStorage.getItem("user");
    let obj: LoginResponse | null = json != null ? JSON.parse(json) : null;

    if (obj != null) {
      this.loggedUser = obj;
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
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }
    this.loadAllData()
  }

  loadAllData() {
    let user_info: string | null = sessionStorage.getItem("user_info");
    this.currentUser = user_info != null ? JSON.parse(user_info) : new User();

    this.httpService.getUserJobs(String(this.currentUser.id)).then((data) => {
      this.jobs = data;
    });
  }

  isAdmin(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.loggedUser.role == 'SUPER_ADMIN';
  }

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  openJob(id: bigint) {
    this.toPage(`/my-jobs/${id}`)
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

}

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {AppConstants} from "../../app.module";
import {Router} from "@angular/router";
import {LoginResponse} from "../shared/model/login.response";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, AfterViewInit {

  users: User[] = [];

  loggedUser!: LoginResponse;

  userStatusMap: Map<string, string> = AppConstants.userStatusMap;
  userRoleMap: Map<string, string> = AppConstants.userRoleMap;

  constructor(private router: Router,
              private httpService: HttpService,
              private alertService: AlertService) {
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
    if (!this.checkLogin() || !this.isSuperAdmin()) {
      this.router.navigate(['']);
    }

    this.loadAllData()
  }

  loadAllData() {
    this.httpService.getUsers().then((data) => {
      this.users = data
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  openProfile(userId: bigint) {
    this.toPage(`/profile/${userId}`)
  }

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

}

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {AppConstants} from "../../../main";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class UsersComponent implements OnInit, AfterViewInit {

  users: User[] = [];

  email!: string;
  role!: string;

  userStatusMap: Map<string, string> = AppConstants.userStatusMap;
  userRoleMap: Map<string, string> = AppConstants.userRoleMap;

  constructor(private router: Router,
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
    if (!this.checkLogin() || !this.isAdmin()) {
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

  isAdmin(): boolean {
    return this.role == 'ADMIN';
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

}

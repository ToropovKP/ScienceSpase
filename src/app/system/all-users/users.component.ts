import {Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {userRoleMap, userStatusMap} from "../../app.constants";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [CommonModule]
})
export class UsersComponent implements OnInit {

  protected readonly userStatusMap = userStatusMap;
  protected readonly userRoleMap = userRoleMap;

  users: User[] = [];

  constructor(private router: Router,
              private httpService: HttpService,
              private alertService: AlertService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.router.navigate(['not-found']);
      } else {
        this.loadAllData()
      }
    });
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
    return this.authService.hasRole('ADMIN');
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

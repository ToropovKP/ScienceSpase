import {Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {userRoleMap, userStatusMap} from "../../app.constants";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {FirstWordPipe} from "../shared/pipes/first.word.pipe";
import {ShortNamePipe} from "../shared/pipes/short.name.pipe";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  imports: [CommonModule, ToastModule, FirstWordPipe, ShortNamePipe],
  providers: [MessageService]
})
export class UsersComponent implements OnInit {

  protected readonly userStatusMap = userStatusMap;
  protected readonly userRoleMap = userRoleMap;

  users: User[] = [];

  constructor(private router: Router,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  loadingData: boolean = true;

  loadAllData() {
    this.httpService.getUsers().then((data) => {
      this.users = data
      this.loadingData = false;
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Ошибка на стороне сервера',
        life: 3000
      });
      this.loadingData = false;
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

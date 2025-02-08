import {Component, OnInit} from '@angular/core';
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {conferenceStatusMap} from "../../app.constants";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-conferences',
  templateUrl: './conferences.component.html',
  styleUrls: ['./conferences.component.css'],
  imports: [CommonModule, ToastModule],
  providers: [MessageService]
})
export class ConferencesComponent implements OnInit {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  conferences: Conference[] = [];
  currentUser!: User;

  constructor(private router: Router,
              private httpService: HttpService,
              private authService: AuthService,
              private messageService: MessageService) {

  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });
    this.loadAllData()
  }

  loadingConference: boolean = true;

  loadAllData() {
    this.currentUser = this.authService.getUserInfo()!;

    this.httpService.getConferences().then((data) => {
      this.conferences = data;
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
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  createConference() {
    if (this.currentUser && this.currentUser.verified) {
      this.toPage('/conferences/create');
    } else if (!this.currentUser) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Отклонено',
        detail: 'Необходимо выполнить вход в аккаунт',
        life: 3000
      });
    } else if (!this.currentUser.verified) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Подтвердите аккаунт',
        detail: 'Проверьте почту и подтвердите свой аккаунт',
        life: 3000
      });
    }
  }

  openConf(id: bigint): void {
    this.router.navigate([`/conference/${id}`]);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

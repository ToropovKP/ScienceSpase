import {Component, OnInit} from '@angular/core';
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {conferenceStatusMap} from "../../app.constants";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {DateService} from "../shared/services/date.service";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-conferences',
  templateUrl: './conferences.component.html',
  styleUrls: ['./conferences.component.css'],
  imports: [CommonModule]
})
export class ConferencesComponent implements OnInit {

  protected readonly conferenceStatusMap = conferenceStatusMap;
  protected readonly DateService = DateService;

  conferences: Conference[] = [];
  currentUser!: User;

  constructor(private router: Router,
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
    this.currentUser = this.authService.getUserInfo()!;

    this.httpService.getConferences().then((data) => {
      this.conferences = data;
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  createConference() {
    if (this.currentUser.verified) {
      this.toPage('/conferences/create');
    } else {
      this.alertService.constructWarnAlert("Подтвердите аккаунт", "Проверьте почту и подтвердите свой аккаунт")
    }
  }

  openConf(id: bigint): void {
    this.router.navigate([`/conference/${id}`]);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

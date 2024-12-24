import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Conference} from "../shared/model/conference";
import {User} from "../shared/model/user";
import {AppConstants} from "../../../main";
import {Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-conferences',
  templateUrl: './conferences.component.html',
  styleUrls: ['./conferences.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ConferencesComponent implements OnInit, AfterViewInit {

  protected readonly AppConstants = AppConstants;
  conferences: Conference[] = [];

  currentUser!: User;
  email!: string;
  role!: string;

  statusMap: Map<string, string> = AppConstants.conferenceStatusMap;

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
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }

    this.loadAllData()
  }

  loadAllData() {
    this.httpService.getUserInfo(this.email).then((data) => {
      this.currentUser = data;
      sessionStorage.setItem("user_info", JSON.stringify(data));
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });

    this.httpService.getConferences().then((data) => {
      this.conferences = data;
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  isModerator(): boolean {
    return this.role == 'MODERATOR' || this.role == 'ADMIN';
  }

  isAdmin(): boolean {
    return this.role == 'ADMIN';
  }

  openConf(id: bigint): void {
    this.router.navigate([`/conference/${id}`]);
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

}

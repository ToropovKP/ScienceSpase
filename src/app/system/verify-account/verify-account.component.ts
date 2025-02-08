import {Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map} from "rxjs";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-verify',
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.css'],
  imports: [CommonModule]
})
export class VerifyAccountComponent implements OnInit {

  currentUser!: User;
  verified: boolean = false;

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
      }
    });
    this.loadAllData()
  }

  loadAllData() {
    this.route.queryParams.pipe(map(e => e['token'])).subscribe(e => {
      let token: string = e;
      this.httpService.verifyAccount(token).then((data) => {
        if (data) {
          this.verified = true;
        }
        return this.authService.getCurrentUser();
      }).then((user) => {
        if (user) {
          this.verified = user.verified;
          this.currentUser = user;
        }
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    })
  }

  sendRepeatLink() {
    this.httpService.sendRepeatLink().then((data) => {
      if (data) {
        this.alertService.constructSuccessAlert('Успешно', 'Письмо отправлено');
        return null;
      } else {
        this.alertService.constructWarnAlert('Ошибка', 'Ваш аккаунт уже подтвержден');
        return this.authService.getCurrentUser();
      }
    }).then((user) => {
      if (user) {
        this.currentUser = user;
      }
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }
}

import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {ActivatedRoute} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map, Subject, takeUntil} from "rxjs";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-verify',
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.css'],
  imports: [CommonModule, ToastModule],
  providers: [MessageService]
})
export class VerifyAccountComponent implements OnInit, OnDestroy {

  currentUser!: User;
  verified: boolean = false;

  constructor(private route: ActivatedRoute,
              private httpService: HttpService,
              private messageService: MessageService,
              private authService: AuthService) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });
    this.loadAllData()
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Ошибка на стороне сервера',
          life: 3000
        });
      });
    })
  }

  sendRepeatLink() {
    this.httpService.sendRepeatLink().then((data) => {
      if (data) {
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Письмо отправлено',
          life: 3000
        });
        return null;
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Ошибка',
          detail: 'Ваш аккаунт уже подтвержден',
          life: 3000
        });
        return this.authService.getCurrentUser();
      }
    }).then((user) => {
      if (user) {
        this.currentUser = user;
      }
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось отправить письмо',
        life: 3000
      });
    });
  }
}

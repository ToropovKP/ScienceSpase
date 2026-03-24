import {Component, OnInit} from '@angular/core';
import {User} from "../../entities/user/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../../shared/services/http.service";
import {map} from "rxjs";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {passwordMatchValidator} from "../../shared/validators/password.match.validator";
import {Button} from "primeng/button";
import {IftaLabel} from "primeng/iftalabel";
import {Password} from "primeng/password";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-restore-password',
  templateUrl: './restore-password.component.html',
  styleUrls: ['./restore-password.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Button, IftaLabel, Password, ToastModule],
  providers: [MessageService]
})
export class RestorePasswordComponent implements OnInit {

  formRestore!: FormGroup;
  currentUser!: User;
  reseted: boolean = false;
  token: string = '';

  constructor(private router: Router,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private httpService: HttpService,
              private messageService: MessageService) {
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadAllData();
  }

  initializeForms() {
    this.formRestore = this.formBuilder.group({
          password: new FormControl('', [Validators.required, Validators.minLength(8)]),
          confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
        },
        {
          validators: passwordMatchValidator
        });
  }

  loadAllData() {
    this.route.queryParams.pipe(map(e => e['token'])).subscribe(e => {
      this.token = e;
      this.httpService.restorePassword(this.token).then((data) => {
        if (data) {
          this.reseted = true;
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

  loading: boolean = false;

  sendNewPassword() {
    this.loading = true;
    let request = {
      "password": this.formRestore.value.password
    };
    this.httpService.changePasswordByRestore(this.token, request).then((data) => {
      if (data) {
        this.messageService.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пароль успешно изменен',
          life: 3000
        });
        this.router.navigate([""]);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Ошибка',
          detail: 'Не удалось обновить пароль',
          life: 3000
        });
      }
      this.loading = false;
    }).catch(error => {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось изменить пароль',
        life: 3000
      });
    });
  }
}

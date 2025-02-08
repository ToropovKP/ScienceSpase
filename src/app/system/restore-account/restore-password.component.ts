import {Component, OnInit} from '@angular/core';
import {User} from "../shared/model/user";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpService} from "../shared/services/http.service";
import {map} from "rxjs";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../shared/services/auth.service";
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {passwordMatchValidator} from "../../app.component";
import {Button} from "primeng/button";
import {IftaLabel} from "primeng/iftalabel";
import {Password} from "primeng/password";

@Component({
  selector: 'app-restore-password',
  templateUrl: './restore-password.component.html',
  styleUrls: ['./restore-password.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Button, IftaLabel, Password]
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
              private alertService: AlertService,
              private authService: AuthService) {
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
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
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
        this.alertService.constructSuccessAlert('Успешно', 'Пароль успешно изменен');
        this.router.navigate([""]);
      } else {
        this.alertService.constructWarnAlert('Ошибка', 'Не удалось обновить пароль');
      }
      this.loading = false;
    }).catch(error => {
      this.loading = false;
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }
}

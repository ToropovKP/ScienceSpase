import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {User} from "../model/user";
import {HttpService} from "../services/http.service";
import {AlertService} from "../services/alert.service";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {IftaLabelModule} from "primeng/iftalabel";
import {InputTextModule} from "primeng/inputtext";
import {PasswordModule} from "primeng/password";
import {ButtonModule} from "primeng/button";
import {AuthService} from "../services/auth.service";
import {passwordMatchValidator} from "../../../app.component";

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective,
    IftaLabelModule, InputTextModule, PasswordModule, ButtonModule]
})
export class HeaderComponent implements OnInit {

  @ViewChild('closeModalLogIn') closeModalLogIn!: ElementRef
  @ViewChild('closeModalReg') closeModalReg!: ElementRef
  @ViewChild('closeModalRestore') closeModalRestore!: ElementRef
  invalidLogin: boolean = false;
  userBlockedLogin: boolean = false;
  userBlockedReg: boolean = false;
  userExists: boolean = false;
  restoreEmailNotExist: boolean = false;

  loginForm!: FormGroup;
  formRegistration!: FormGroup;
  formRestore!: FormGroup;
  currentUser!: User;

  showRegStatus!: User;

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private httpService: HttpService,
              private alertService: AlertService,
              private authService: AuthService
  ) {

  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });

    this.authService.getCurrentUser()
    .catch((error) => {
      console.error('Failed to load user data', error);
    });

    this.initializeForms();
  }

  initializeForms() {
    this.formRegistration = this.formBuilder.group({
          firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
          lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
          middleName: new FormControl('', []),
          phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
          email: new FormControl('', [Validators.required, Validators.email]),
          organization: new FormControl('', []),
          academicDegree: new FormControl('', []),
          academicTitle: new FormControl('', []),
          password: new FormControl('', [Validators.required, Validators.minLength(8)]),
          confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(6)])
        },
        {
          validators: passwordMatchValidator
        });
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    })
    this.formRestore = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
    })
  }

  pressBtn(id: string): void {
    document.getElementById(id)?.click();
  }

  clearBooleans() {
    this.invalidLogin = false
    this.userBlockedLogin = false
    this.userExists = false;
    this.userBlockedReg = false;
    this.restoreEmailNotExist = false;
  }

  loading: boolean = false

  login(): void {
    this.loading = true;
    let email: string = this.loginForm.value.email;
    let request = {"email": email, "password": this.loginForm.value.password};
    this.httpService.login(request).then((data) => {
      this.invalidLogin = false
      this.userBlockedLogin = false
      this.closeModalLogIn.nativeElement.click()
      localStorage.setItem("token", data.access_token);

      return this.authService.getCurrentUser()
    }).then((user) => {
      if (user) {
        this.currentUser = user;
      }

      this.loading = false;
      this.loginForm.reset();
      this.router.navigate(["/conferences"]);
    }).catch((error) => {
      this.loading = false;
      if (error.error['code'] === 'UNAUTHORIZED') {
        this.invalidLogin = true;
        this.userBlockedLogin = false;
      } else if (error.error['code'] === 'BANNED') {
        this.invalidLogin = false
        this.userBlockedLogin = true;
      } else {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      }
    });
  }

  registration(): void {
    let request = {
      "firstName": this.formRegistration.value.firstName,
      "lastName": this.formRegistration.value.lastName,
      "middleName": this.formRegistration.value.middleName,
      "phone": '7' + this.formRegistration.value.phone,
      "email": this.formRegistration.value.email,
      "organization": this.formRegistration.value.organization,
      "academicDegree": this.formRegistration.value.academicDegree,
      "academicTitle": this.formRegistration.value.academicTitle,
      "password": this.formRegistration.value.password
    };
    this.httpService.registration(request).then((data) => {
      this.alertService.constructSuccessAlert('Регистрация прошла успешно', 'На вашу почту отправлено письмо с подтверждением');
      this.userExists = false;
      this.userBlockedReg = false;
      this.closeModalReg.nativeElement.click()
      this.showRegStatus = data;
      this.loginForm.controls['email'].setValue(this.formRegistration.value.email)
      this.loginForm.controls['password'].setValue(this.formRegistration.value.password)
      this.login()
      this.formRegistration.reset();
    }).catch(error => {
      if (error.error['code'] === 'USER_EXISTS') {
        this.userExists = true;
        this.userBlockedReg = false;
      } else if (error.error['code'] === 'BANNED') {
        this.userExists = false;
        this.userBlockedReg = true;
      } else {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      }
    })
  }

  restorePassword(): void {
    let email: string = this.formRestore.value.email;
    this.httpService.sendRestorePasswordLink(email).then((data) => {
      if (data) {
        this.alertService.constructSuccessAlert('Успешно', 'Письмо с инструкцией отправлено на почту');
        this.restoreEmailNotExist = false;
        this.closeModalRestore.nativeElement.click()
      } else {
        this.restoreEmailNotExist = true;
      }
      this.formRestore.reset();
    }).catch((error) => {
      this.loading = false;
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  checkLogin() {
    return this.authService.getUserInfo() != null;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  logout() {
    this.httpService.logout().then(() => {
      localStorage.clear()
      this.authService.clearData()
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

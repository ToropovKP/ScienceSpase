import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {User} from "../model/user";
import {HttpService} from "../services/http.service";
import {AlertService} from "../services/alert.service";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective]
})
export class HeaderComponent implements OnInit {

  @ViewChild('closeModalLogIn') closeModalLogIn!: ElementRef
  @ViewChild('closeModalReg') closeModalReg!: ElementRef
  invalidLogin: boolean = false;
  userBlockedLogin: boolean = false;
  userBlockedReg: boolean = false;
  userExists: boolean = false;

  role!: string;
  loginForm!: FormGroup;
  formRegistration!: FormGroup;
  currentUser!: User;
  loggedStatus: boolean = false;

  public showRegStatus!: User;

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private httpService: HttpService,
              private alertService: AlertService
  ) {

  }

  ngOnInit() {
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
    });
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
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
  }

  login(): void {
    let email: string = this.loginForm.value.email;
    let request = {"email": email, "password": this.loginForm.value.password};
    this.httpService.login(request).then((data) => {
      this.invalidLogin = false
      this.userBlockedLogin = false
      this.closeModalLogIn.nativeElement.click()
      sessionStorage.setItem("email", email);
      sessionStorage.setItem("token", data.access_token);
      sessionStorage.setItem("role", data.role);
      this.role = data.role;
      this.httpService.getUserInfo(email).then((data) => {
        this.currentUser = data;
        //todo убрать и заменить на вызов апи в других местах
        sessionStorage.setItem("user_info", JSON.stringify(data));
      });
      this.loginForm.reset();
      this.router.navigate(["/conferences"]);
    }).catch((error) => {
      if (error.error['code'] == 'UNAUTHORIZED') {
        this.invalidLogin = true;
        this.userBlockedLogin = false;
      } else if (error.error['code'] == 'BANNED') {
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
      this.userExists = false;
      this.userBlockedReg = false;
      this.closeModalReg.nativeElement.click()
      this.showRegStatus = data;
      this.loginForm.controls['email'].setValue(this.formRegistration.value.email)
      this.loginForm.controls['password'].setValue(this.formRegistration.value.password)
      this.login()
      this.formRegistration.reset();
    }).catch(error => {
      if (error.error['code'] == 'USER_EXISTS') {
        this.userExists = true;
        this.userBlockedReg = false;
      } else if (error.error['code'] == 'BANNED') {
        this.userExists = false;
        this.userBlockedReg = true;
      } else {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      }
    })
  }

  checkLogin() {
    let email: string | null = sessionStorage.getItem("email");

    if (email != null) {
      this.loggedStatus = true;
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
      return true;
    } else {
      this.loggedStatus = false;
      return false;
    }
  }

  isAdmin(): boolean {
    return this.loggedStatus && this.role == 'ADMIN';
  }

  logout() {
    //todo не работает
    this.httpService.logout().then();
    sessionStorage.clear();
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

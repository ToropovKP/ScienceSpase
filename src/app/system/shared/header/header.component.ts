import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {LoginResponse} from "../model/login.response";
import {User} from "../model/user";
import {HttpService} from "../services/http.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  loginForm!: FormGroup;
  formRegistration!: FormGroup;
  currentUser!: User;

  loggedUser!: LoginResponse | null;
  loggedStatus: boolean = false;

  public showRegStatus!: User;

  constructor(private router: Router,
              private formBuilder: FormBuilder,
              private httpService: HttpService
  ) {

  }

  ngOnInit() {
    this.formRegistration = this.formBuilder.group({
      firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      middleName: new FormControl('', []),
      phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      organization: new FormControl('', [Validators.required, Validators.minLength(4)]),
      academicDegree: new FormControl('', [Validators.required, Validators.minLength(4)]),
      academicTitle: new FormControl('', [Validators.required, Validators.minLength(4)]),
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

  login(): void {
    let email: string = this.loginForm.value.email;
    let request = {"email": email, "password": this.loginForm.value.password};
    this.httpService.login(request).then((data) => {
      this.router.navigate(["/conferences"]);
      sessionStorage.setItem("user", JSON.stringify(data));
      this.loggedUser = data;
      this.httpService.getUserInfo(this.loggedUser.email).then((data) => {
        this.currentUser = data;
        sessionStorage.setItem("user_info", JSON.stringify(data));
      });
    });
    this.loginForm.reset();
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
      this.showRegStatus = data;
    })
  }

  checkLogin() {
    let json: string | null = sessionStorage.getItem("user");
    let obj: LoginResponse | null = json != null ? JSON.parse(json) : null;

    if (obj != null) {
      this.loggedStatus = true;
      this.loggedUser = obj;
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
      return true;
    } else {
      this.loggedStatus = false;
      this.loggedUser = null;
      return false;
    }
  }

  isSuperAdmin(): boolean {
    return this.loggedUser != null && this.loggedUser.role == 'SUPER_ADMIN';
  }

  logout() {
    sessionStorage.clear();
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

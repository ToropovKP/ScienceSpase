import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {LoginResponse} from "../shared/model/login.response";
import {ActivatedRoute, Router} from "@angular/router";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, AfterViewInit {

  formProfile!: FormGroup;
  loggedUser!: LoginResponse;
  currentUser!: User;
  profileUser!: User;
  profileUserId!: string;

  editProfile: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService) {
  }

  checkLogin() {
    let json: string | null = sessionStorage.getItem("user");
    let obj: LoginResponse | null = json != null ? JSON.parse(json) : null;
    if (obj) {
      this.loggedUser = obj;
      let user_info: string | null = sessionStorage.getItem("user_info");
      this.currentUser = user_info != null ? JSON.parse(user_info) : new User();
    }
    return obj != null;
  }

  ngAfterViewInit() {
    this.loadAllData()
  }

  ngOnInit() {
    if (!this.checkLogin()) {
      this.router.navigate(['']);
    }

    this.formProfile = this.formBuilder.group({
      firstName: new FormControl('',),
      lastName: new FormControl('',),
      middleName: new FormControl('',),
      phone: new FormControl('',),
      organization: new FormControl('',),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('',),
      rincId: new FormControl('',),
      telegram: new FormControl('',),
      password: new FormControl('',),
    })

    this.loadAllData()
  }

  loadAllData() {
    this.route.params.pipe(map(p => p['id'])).subscribe(e => {
      this.profileUserId = e;
      this.httpService.getUserInfoById(this.profileUserId).then((data) => {
        this.profileUser = data
        this.updateUserInfo()
      });
    });
  }

  updateUserInfo() {
    this.formProfile.controls['firstName'].setValue(this.profileUser.firstName)
    this.formProfile.controls['lastName'].setValue(this.profileUser.lastName)
    this.formProfile.controls['middleName'].setValue(this.profileUser.middleName)
    this.formProfile.controls['phone'].setValue(this.profileUser.phone)
    this.formProfile.controls['organization'].setValue(this.profileUser.organization)
    this.formProfile.controls['academicDegree'].setValue(this.profileUser.academicDegree)
    this.formProfile.controls['academicTitle'].setValue(this.profileUser.academicTitle)
    this.formProfile.controls['orcId'].setValue(this.profileUser.orcId)
    this.formProfile.controls['rincId'].setValue(this.profileUser.rincId)
    this.formProfile.controls['telegram'].setValue(this.profileUser.telegramUserName)
    this.formProfile.controls['password'].setValue("***************")
  }


  isAdminAbsolute(): boolean {
    return this.loggedUser.role == 'ADMIN' || this.loggedUser.role == 'SUPER_ADMIN';
  }

  isSuperAdmin(): boolean {
    return this.loggedUser.role == 'SUPER_ADMIN';
  }

  allowToChange(): boolean {
    return this.showButtonsToChange() && !this.editProfile;
  }

  showButtonsToChange(): boolean {
    return String(this.currentUser.id) == this.profileUserId;
  }

  changeRole(role: string) {
    this.httpService.changeUserRole(String(this.profileUser.id), role).then((data) => {
      if (data) {
        this.profileUser.role = role
      }
    });
  }

  changeStatus(status: string) {
    this.httpService.changeUserStatus(String(this.profileUser.id), status).then((data) => {
      if (data) {
        this.profileUser.status = status
      }
    });
  }

  changeProfile() {
    this.editProfile = true;
  }

  cancelProfile() {
    this.editProfile = false;
    this.formProfile.reset()
    this.updateUserInfo()
  }

  saveProfile() {
    let requestUser = {
      "id": this.profileUser.id,
      "firstName": this.formProfile.value.firstName,
      "lastName": this.formProfile.value.lastName,
      "middleName": this.formProfile.value.middleName,
      "phone": this.formProfile.value.phone,
      "organization": this.formProfile.value.organization,
      "academicDegree": this.formProfile.value.academicDegree,
      "academicTitle": this.formProfile.value.academicTitle,
      "orcId": this.formProfile.value.orcId,
      "rincId": this.formProfile.value.rincId,
      "telegramUserName": this.formProfile.value.telegram,
    }

    this.profileUser.firstName = this.formProfile.value.firstName
    this.profileUser.lastName = this.formProfile.value.lastName
    this.profileUser.middleName = this.formProfile.value.middleName
    this.profileUser.phone = this.formProfile.value.phone
    this.profileUser.organization = this.formProfile.value.organization
    this.profileUser.academicDegree = this.formProfile.value.academicDegree
    this.profileUser.academicTitle = this.formProfile.value.academicTitle
    this.profileUser.orcId = this.formProfile.value.orcId
    this.profileUser.rincId = this.formProfile.value.rincId
    this.profileUser.telegramUserName = this.formProfile.value.telegram

    this.httpService.updateUserInfo(requestUser).then((data) => {
    });
    this.editProfile = false;
    this.formProfile.reset()
    this.updateUserInfo()
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

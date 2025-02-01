import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {AlertService} from "../shared/services/alert.service";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {AuthService} from "../shared/services/auth.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective]
})
export class ProfileComponent implements OnInit {

  formProfile!: FormGroup;
  currentUser!: User;
  profileUser!: User;
  profileUserId!: string;

  editProfile: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private alertService: AlertService,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  initializeForms() {
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
      password: new FormControl('',),
    })
  }

  loadAllData() {
    let profId;
    this.route.params.pipe(map(p => p['id'])).subscribe(e => profId = e);
    if (this.isAdmin() && profId !== undefined) {
      this.profileUserId = profId;
      this.httpService.getUserInfoById(this.profileUserId).then((data) => {
        this.profileUser = data
        this.updateUserInfoForm()
      }).catch(error => {
        let title = "Возникла непредвиденная ошибка";
        let description = 'Ошибка на стороне сервера';
        this.alertService.constructErrorAlert(error, title, description);
      });
    } else {
      if (profId !== undefined) {
        this.router.navigate(['/profile']);
      } else {
        this.profileUser = this.currentUser
        this.profileUserId = String(this.currentUser.id)
        this.updateUserInfoForm()
      }
    }
  }

  updateUserInfoForm() {
    this.formProfile.controls['firstName'].setValue(this.profileUser.firstName)
    this.formProfile.controls['lastName'].setValue(this.profileUser.lastName)
    this.formProfile.controls['middleName'].setValue(this.profileUser.middleName)
    this.formProfile.controls['phone'].setValue(this.profileUser.phone)
    this.formProfile.controls['organization'].setValue(this.profileUser.organization)
    this.formProfile.controls['academicDegree'].setValue(this.profileUser.academicDegree)
    this.formProfile.controls['academicTitle'].setValue(this.profileUser.academicTitle)
    this.formProfile.controls['orcId'].setValue(this.profileUser.orcId)
    this.formProfile.controls['rincId'].setValue(this.profileUser.rincId)
    this.formProfile.controls['password'].setValue("***************")
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  allowToChange(): boolean {
    return this.showButtonsToChange() && this.editProfile;
  }

  showButtonsToChange(): boolean {
    return String(this.currentUser.id) === this.profileUserId;
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

  changeRole(role: string) {
    this.httpService.changeUserRole(String(this.profileUser.id), role).then((data) => {
      if (data) {
        this.profileUser.role = role
      }
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  changeStatus(status: string) {
    this.httpService.changeUserStatus(String(this.profileUser.id), status).then((data) => {
      if (data) {
        this.profileUser.status = status
      }
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
  }

  changeProfile() {
    this.editProfile = true;
  }

  cancelProfile() {
    this.editProfile = false;
    this.formProfile.reset()
    this.updateUserInfoForm()
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

    this.httpService.updateUserInfo(requestUser).then(() => {
      return this.authService.getCurrentUser()
    }).then((updatedUser) => {
      this.alertService.constructSuccessAlert('Успешно', 'Данные успешно обновлены');
    }).catch(error => {
      let title = "Возникла непредвиденная ошибка";
      let description = 'Ошибка на стороне сервера';
      this.alertService.constructErrorAlert(error, title, description);
    });
    this.editProfile = false;
    this.formProfile.reset()
    this.updateUserInfoForm()
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

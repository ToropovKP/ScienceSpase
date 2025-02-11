import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../shared/model/user";
import {HttpService} from "../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {AuthService} from "../shared/services/auth.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ToastModule} from "primeng/toast";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, ConfirmPopupModule, ToastModule],
  providers: [ConfirmationService, MessageService]
})
export class ProfileComponent implements OnInit, OnDestroy {

  formProfile!: FormGroup;
  currentUser!: User;
  profileUser!: User;
  profileUserId!: string;

  editProfile: boolean = false;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private authService: AuthService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService) {
  }

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.authService.currentUser$
    .pipe(
        takeUntil(this.destroy$),
        filter(() => this.route.snapshot.component != null) // Проверка активности
    )
    .subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.initializeForms();
        this.loadAllData()
      } else {
        this.router.navigate(['not-found']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.messageService.add({
          severity: 'error',
          summary: 'Возникла непредвиденная ошибка',
          detail: 'Ошибка на стороне сервера',
          life: 3000
        });
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
      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные успешно обновлены',
        life: 3000
      });
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Возникла непредвиденная ошибка',
        detail: 'Не удалось обновить профиль',
        life: 3000
      });
    });
    this.editProfile = false;
    this.formProfile.reset()
    this.updateUserInfoForm()
  }

  confirmRole(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить роль?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        let role = this.profileUser.role == 'MEMBER' ? 'MODERATOR' : 'MEMBER';
        this.httpService.changeUserRole(String(this.profileUser.id), role).then((data) => {
          if (data) {
            this.profileUser.role = role
            this.messageService.add({severity: 'success', summary: 'Успешно', detail: 'Роль изменена', life: 3000});
          }
        }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось изменить роль',
            life: 3000
          });
        });
      },
      reject: () => {
        this.messageService.add({severity: 'secondary', summary: 'Отменено', detail: 'Действие отменено', life: 3000});
      }
    });
  }

  confirmStatus(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Вы уверены, что хотите изменить статус?',
      rejectButtonProps: {
        label: 'Отменить',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Применить',
        severity: 'danger'
      },
      accept: () => {
        let status = this.profileUser.status == 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        this.httpService.changeUserStatus(String(this.profileUser.id), status).then((data) => {
          if (data) {
            this.profileUser.status = status
            this.messageService.add({severity: 'success', summary: 'Успешно', detail: 'Статус изменен', life: 3000});
          }
        }).catch(error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Возникла непредвиденная ошибка',
            detail: 'Не удалось изменить статус',
            life: 3000
          });
        });
      },
      reject: () => {
        this.messageService.add({severity: 'secondary', summary: 'Отменено', detail: 'Действие отменено', life: 3000});
      }
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

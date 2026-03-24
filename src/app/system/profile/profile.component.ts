import {Component, HostListener, OnDestroy, OnInit, SecurityContext} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, NavigationStart, Router} from "@angular/router";
import {map, Subject, takeUntil} from "rxjs";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {CommonModule, Location} from "@angular/common";
import {NgxMaskDirective} from "ngx-mask";
import {AuthService} from "../../shared/services/auth.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ToastModule} from "primeng/toast";
import {filter} from "rxjs/operators";
import {passwordMatchValidator} from "../../shared/validators/password.match.validator";
import {PopoverModule} from "primeng/popover";
import {orcidPattern} from "../../app.constants";
import {NumbersOnlyDirective} from "../../shared/directives/numbers-only.directive";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, ConfirmPopupModule, ToastModule, PopoverModule, NumbersOnlyDirective],
  providers: [ConfirmationService, MessageService]
})
export class ProfileComponent implements OnInit, OnDestroy {

  protected readonly customOrcidPattern = orcidPattern;

  formProfile!: FormGroup;
  securityForm!: FormGroup;
  currentUser!: User;
  profileUser!: User;
  profileUserId!: string;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isUpdating = false;

  showActionButtons = false;
  originalProfileData: any;

  constructor(private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute,
              private location: Location,
              private httpService: HttpService,
              private authService: AuthService,
              private confirmationService: ConfirmationService,
              private messageService: MessageService,
              private sanitizer: DomSanitizer) {
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
    this.router.events.pipe(
        filter(event => event instanceof NavigationStart),
        takeUntil(this.destroy$)
    ).subscribe(event => {
      if (this.formProfile.dirty) {
        if (!confirm('У вас есть несохраненные изменения. Продолжить?')) {
          this.location.go(this.location.path());
          throw new Error('Navigation cancelled');
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms() {
    this.formProfile = this.formBuilder.group({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      middleName: new FormControl('',),
      phone: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      organization: new FormControl('',),
      academicDegree: new FormControl('',),
      academicTitle: new FormControl('',),
      orcId: new FormControl('',),
      rincId: new FormControl('',),
    });

    this.securityForm = this.formBuilder.group({
      currentPassword: new FormControl('', Validators.required),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8)
      ]),
      confirmedPassword: new FormControl('', Validators.required)
    }, {
      validator: passwordMatchValidator
    });
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
    this.formProfile.controls['email'].setValue(this.profileUser.email)
    this.formProfile.controls['organization'].setValue(this.profileUser.organization)
    this.formProfile.controls['academicDegree'].setValue(this.profileUser.academicDegree)
    this.formProfile.controls['academicTitle'].setValue(this.profileUser.academicTitle)
    this.formProfile.controls['orcId'].setValue(this.profileUser.orcId)
    this.formProfile.controls['rincId'].setValue(this.profileUser.rincId)
    this.formProfile.valueChanges.subscribe(() => {
      this.showActionButtons = this.formProfile.dirty;
    })
    this.originalProfileData = {...this.formProfile.value};
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.formProfile.dirty) {
      $event.returnValue = true;
    }
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
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

  cancelProfile() {
    this.formProfile.reset(this.originalProfileData);
    this.showActionButtons = false;
  }

  async saveProfile() {
    if (this.formProfile.invalid) return;

    const requestUser = {
      firstName: this.formProfile.value.firstName,
      lastName: this.formProfile.value.lastName,
      middleName: this.formProfile.value.middleName,
      organization: this.formProfile.value.organization,
      academicDegree: this.formProfile.value.academicDegree,
      academicTitle: this.formProfile.value.academicTitle,
      orcId: this.formProfile.value.orcId?.toUpperCase(),
      rincId: this.formProfile.value.rincId
    };

    try {
      await this.httpService.updateUserInfo(requestUser);
      const updatedUser = await this.authService.getCurrentUser();

      this.updateUserInfoForm()
      this.formProfile.markAsPristine();
      this.showActionButtons = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Данные успешно обновлены',
        life: 3000
      });

    } catch (error: any) {
      this.handleProfileError(error);
    }
  }

  private handleProfileError(error: any) {
    if (error.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось обновить профиль',
        life: 3000
      });
    }
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

  checkPasswordStrength() {
    // Триггерим проверку только если поле не пустое
    if (this.securityForm.get('password')?.value) {
      this.getPasswordStrength();
    }
  }

  getPasswordStrength(): number {
    const password = this.securityForm.get('password')?.value || '';

    let strength = 0;
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];

    strength = (requirements.filter(Boolean)).length * 25;
    return Math.min(strength, 100);
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'Слабый';
    if (strength < 75) return 'Средний';
    return 'Сильный';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'bg-danger';
    if (strength < 75) return 'bg-warning';
    return 'bg-success';
  }

  // Обновленный метод для обработки смены пароля
  async handlePasswordChange() {
    if (this.securityForm.invalid) return;

    this.isUpdating = true;

    try {
      // 1. Сначала проверяем текущий пароль
      const currentPassword = this.sanitizer.sanitize(SecurityContext.HTML, this.securityForm.value.currentPassword);
      const isCurrentValid = await this.httpService.verifyCurrentPassword({password: currentPassword});

      if (!isCurrentValid) {
        this.securityForm.get('currentPassword')?.setErrors({incorrect: true});
        this.isUpdating = false;
        return;
      }

      // 2. Если текущий пароль верный, обновляем на новый
      const newPassword = this.sanitizer.sanitize(SecurityContext.HTML, this.securityForm.value.password);
      await this.httpService.updatePassword({password: newPassword});

      // 3. Успешное завершение
      this.messageService.add({
        severity: 'success',
        summary: 'Успешно',
        detail: 'Пароль успешно изменен',
        life: 3000
      });

      this.securityForm.reset();

    } catch (error: any) {
      this.handlePasswordError(error);
    } finally {
      this.isUpdating = false;
    }
  }

  private handlePasswordError(error: any) {
    if (error.status === 429) {
      this.messageService.add({
        severity: 'error',
        summary: 'Отклонено',
        detail: 'Слишком много запросов. Попробуйте позже',
        life: 3000
      });
    } else if (error.status === 401) {
      this.securityForm.get('currentPassword')?.setErrors({incorrect: true});
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось изменить пароль. Попробуйте позже',
        life: 3000
      });
    }
  }

  resetPasswordForm() {
    this.securityForm.reset();
    this.securityForm.get('currentPassword')?.enable();
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

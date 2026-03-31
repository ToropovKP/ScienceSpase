import { Component, DestroyRef, EventEmitter, Output, ViewChild, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { nationalPhoneValidator, PhoneCountryId } from '../../../../shared/lib/phone-country';
import { Router } from '@angular/router';
import { HttpService } from '../../../../shared/services/http.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { passwordMatchValidator } from '../../../../shared/validators/password.match.validator';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../../entities/user/model/user';
import { FormFieldComponent } from '../forms/form-field.component';
import { EmailFieldComponent } from '../forms/email-field.component';
import { PhoneFieldComponent } from '../forms/phone-field.component';
import { PasswordFieldComponent } from '../forms/password-field.component';

@Component({
  selector: 'app-registration-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    FormFieldComponent,
    EmailFieldComponent,
    PhoneFieldComponent,
    PasswordFieldComponent
  ],
  templateUrl: './registration-modal.component.html',
  styleUrls: ['./registration-modal.component.css']
})
export class RegistrationModalComponent {
  @ViewChild('closeModal') closeModal!: ElementRef;
  @Output() registrationSuccess = new EventEmitter<{ email: string; password: string }>();

  private readonly destroyRef = inject(DestroyRef);

  formRegistration!: FormGroup;
  userExists: boolean = false;
  userBlockedReg: boolean = false;
  loading: boolean = false;
  showRegStatus?: User;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.formRegistration = this.formBuilder.group({
      firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      middleName: new FormControl('', []),
      countryCode: new FormControl<PhoneCountryId>('RU', { nonNullable: true, validators: [Validators.required] }),
      phoneNumber: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      organization: new FormControl('', []),
      academicDegree: new FormControl('', []),
      academicTitle: new FormControl('', []),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmedPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      personalDataConsent: new FormControl(false, [Validators.requiredTrue])
    }, {
      validators: passwordMatchValidator
    });

    const phoneCtrl = this.formRegistration.get('phoneNumber');
    phoneCtrl?.addValidators(
      nationalPhoneValidator(() => this.formRegistration.get('countryCode')?.value)
    );
    this.formRegistration
      .get('countryCode')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        phoneCtrl?.updateValueAndValidity({ emitEvent: false });
      });
  }

  registration(): void {
    if (this.formRegistration.invalid) {
      return;
    }

    this.loading = true;
    const request = {
      "firstName": this.formRegistration.value.firstName,
      "lastName": this.formRegistration.value.lastName,
      "middleName": this.formRegistration.value.middleName,
      "countryCode": this.formRegistration.value.countryCode,
      "phoneNumber": String(this.formRegistration.value.phoneNumber ?? ''),
      "email": this.formRegistration.value.email,
      "organization": this.formRegistration.value.organization,
      "academicDegree": this.formRegistration.value.academicDegree,
      "academicTitle": this.formRegistration.value.academicTitle,
      "password": this.formRegistration.value.password
    };

    this.httpService.registration(request).then((data) => {
      this.loading = false;
      this.notificationService.showRegistrationSuccess();
      this.userExists = false;
      this.userBlockedReg = false;
      this.closeModal.nativeElement.click();
      this.showRegStatus = data;
      
      this.registrationSuccess.emit({
        email: this.formRegistration.value.email,
        password: this.formRegistration.value.password
      });
      
      this.formRegistration.reset();
      this.formRegistration.patchValue({ countryCode: 'RU' });
    }).catch(error => {
      this.loading = false;
      if (error.error?.['code'] === 'USER_EXISTS') {
        this.userExists = true;
        this.userBlockedReg = false;
      } else if (error.error?.['code'] === 'BANNED') {
        this.userExists = false;
        this.userBlockedReg = true;
      } else {
        this.notificationService.showServerError();
      }
    });
  }

  clearErrors() {
    this.userExists = false;
    this.userBlockedReg = false;
  }

  get lastNameControl(): FormControl {
    return this.formRegistration.get('lastName') as FormControl;
  }

  get firstNameControl(): FormControl {
    return this.formRegistration.get('firstName') as FormControl;
  }

  get middleNameControl(): FormControl {
    return this.formRegistration.get('middleName') as FormControl;
  }

  get phoneControl(): FormControl {
    return this.formRegistration.get('phoneNumber') as FormControl;
  }

  get phoneCountryControl(): FormControl<PhoneCountryId> {
    return this.formRegistration.get('countryCode') as FormControl<PhoneCountryId>;
  }

  get emailControl(): FormControl {
    return this.formRegistration.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.formRegistration.get('password') as FormControl;
  }

  get confirmedPasswordControl(): FormControl {
    return this.formRegistration.get('confirmedPassword') as FormControl;
  }
}


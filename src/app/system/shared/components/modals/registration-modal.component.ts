import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { passwordMatchValidator } from '../../validators/password.match.validator';
import { ButtonModule } from 'primeng/button';
import { User } from '../../model/user';
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
      phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
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
      "phone": '7' + this.formRegistration.value.phone,
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
    return this.formRegistration.get('phone') as FormControl;
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


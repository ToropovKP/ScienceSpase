import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../../../shared/services/http.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ButtonModule } from 'primeng/button';
import { EmailFieldComponent } from '../forms/email-field.component';
import { PasswordFieldComponent } from '../forms/password-field.component';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    EmailFieldComponent,
    PasswordFieldComponent
  ],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.css']
})
export class LoginModalComponent {
  @ViewChild('closeModal') closeModal!: ElementRef;
  @Output() loginSuccess = new EventEmitter<void>();

  loginForm!: FormGroup;
  invalidLogin: boolean = false;
  userBlockedLogin: boolean = false;
  loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const email: string = this.loginForm.value.email;
    const request = { "email": email, "password": this.loginForm.value.password };
    
    this.httpService.login(request).then((data) => {
      this.invalidLogin = false;
      this.userBlockedLogin = false;
      if (data.status === 'two_factor_required') {
        this.loading = false;
        this.notificationService.showInfo(
          'Двухфакторная аутентификация',
          'Откройте страницу входа в систему и введите код из приложения после пароля.',
        );
        return Promise.reject(new Error('2FA'));
      }
      const token = data.accessToken;
      if (!token) {
        this.loading = false;
        this.notificationService.showServerError();
        return Promise.reject(new Error('no token'));
      }
      this.closeModal.nativeElement.click();
      localStorage.setItem('token', token);
      return this.authService.getCurrentUser();
    }).then((user) => {
      if (!user) {
        return;
      }
      this.loading = false;
      this.loginForm.reset();
      this.loginSuccess.emit();
      this.router.navigate(["/conferences"]);
    }).catch((error: unknown) => {
      this.loading = false;
      if (error instanceof Error && (error.message === '2FA' || error.message === 'no token')) {
        return;
      }
      const err = error as { error?: { code?: string } };
      if (err.error?.['code'] === 'USER_DOES_NOT_EXISTS') {
        this.invalidLogin = true;
        this.userBlockedLogin = false;
      } else if (err.error?.['code'] === 'BANNED') {
        this.invalidLogin = false;
        this.userBlockedLogin = true;
      } else {
        this.notificationService.showServerError();
      }
    });
  }

  clearErrors() {
    this.invalidLogin = false;
    this.userBlockedLogin = false;
  }

  openRestoreModal() {
    this.closeModal.nativeElement.click();
    // Эмит события для открытия модального окна восстановления пароля
    // Это будет обработано в header компоненте
  }

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }
}


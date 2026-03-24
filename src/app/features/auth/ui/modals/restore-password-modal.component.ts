import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../../../shared/services/http.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ButtonModule } from 'primeng/button';
import { EmailFieldComponent } from '../forms/email-field.component';

@Component({
  selector: 'app-restore-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    EmailFieldComponent
  ],
  templateUrl: './restore-password-modal.component.html',
  styleUrls: ['./restore-password-modal.component.css']
})
export class RestorePasswordModalComponent {
  @ViewChild('closeModal') closeModal!: ElementRef;

  formRestore!: FormGroup;
  restoreEmailNotExist: boolean = false;
  loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.formRestore = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  restorePassword(): void {
    if (this.formRestore.invalid) {
      return;
    }

    this.loading = true;
    const email: string = this.formRestore.value.email;
    
    this.httpService.sendRestorePasswordLink(email).then((data) => {
      if (data) {
        this.notificationService.showRestorePasswordSuccess();
        this.restoreEmailNotExist = false;
        this.closeModal.nativeElement.click();
      } else {
        this.restoreEmailNotExist = true;
      }
      this.loading = false;
      this.formRestore.reset();
    }).catch((error) => {
      this.loading = false;
      if (error.status === 429) {
        this.notificationService.showRestorePasswordTooManyRequests();
      } else {
        this.notificationService.showRestorePasswordFailed();
      }
    });
  }

  clearErrors() {
    this.restoreEmailNotExist = false;
  }

  get emailControl(): FormControl {
    return this.formRestore.get('email') as FormControl;
  }
}


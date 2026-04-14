import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    private notificationService: NotificationService,
    private router: Router,
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
    this.closeModal.nativeElement.click();
    void this.router.navigate(['/auth/recover']);
  }

  clearErrors() {
    this.restoreEmailNotExist = false;
  }

  get emailControl(): FormControl {
    return this.formRestore.get('email') as FormControl;
  }
}


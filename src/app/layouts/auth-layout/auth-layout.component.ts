import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../shared/ui/toast-container.component';
import { RegistrationModalComponent } from '../../features/auth/ui/modals/registration-modal.component';
import { RestorePasswordModalComponent } from '../../features/auth/ui/modals/restore-password-modal.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    RegistrationModalComponent,
    RestorePasswordModalComponent,
  ],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {}

import {Component} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule, RouterOutlet} from "@angular/router";
import {HeaderComponent} from "./system/shared/header/header.component";
import {AlertModule} from "./system/shared/alert/alert.module";
import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";
import {FooterComponent} from "./system/shared/footer/footer.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterModule, RouterOutlet, HeaderComponent, FooterComponent, AlertModule]
})
export class AppComponent {

  constructor() {
  }
}

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmedPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return {passwordMismatch: true};
  }

  return null;
};
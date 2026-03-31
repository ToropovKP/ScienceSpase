import {Component, OnInit, ViewChild} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {FirstWordPipe} from "../../shared/pipes/first.word.pipe";
import {ShortNamePipe} from "../../shared/pipes/short.name.pipe";
import {LoginModalComponent} from "../../features/auth/ui/modals/login-modal.component";
import {RegistrationModalComponent} from "../../features/auth/ui/modals/registration-modal.component";
import {RestorePasswordModalComponent} from "../../features/auth/ui/modals/restore-password-modal.component";
import {ToastContainerComponent} from "../../shared/ui/toast-container.component";

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  imports: [
    CommonModule,
    RouterModule,
    FirstWordPipe,
    ShortNamePipe,
    LoginModalComponent,
    RegistrationModalComponent,
    RestorePasswordModalComponent,
    ToastContainerComponent
  ]
})
export class HeaderComponent implements OnInit {

  @ViewChild(LoginModalComponent) loginModal!: LoginModalComponent;
  @ViewChild(RegistrationModalComponent) registrationModal!: RegistrationModalComponent;

  currentUser!: User;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private authService: AuthService
  ) {
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });

    this.authService.getCurrentUser()
      .catch((error) => {
        console.error('Failed to load user data', error);
      });
  }

  checkLogin() {
    return this.authService.getUserInfo() != null;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  logout() {
    this.httpService.logout().then(() => {
      localStorage.clear();
      this.authService.clearData();
      this.toPage('');
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }

  refreshCurrentUser(): void {
    this.authService.getCurrentUser()
      .catch((error) => {
        console.error('Failed to refresh user data', error);
      });
  }

  onRegistrationSuccess(credentials: { email: string; password: string }) {
    // После успешной регистрации закрываем модальное окно регистрации
    // и открываем модальное окно входа с заполненными данными
    // Это можно сделать через сервис или напрямую через ViewChild
    if (this.loginModal) {
      // Устанавливаем значения в форму логина и открываем модальное окно
      // Но проще просто открыть модальное окно логина - пользователь введет данные сам
    }
  }

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}

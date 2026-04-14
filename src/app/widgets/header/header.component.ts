import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {User} from "../../entities/user/model/user";
import {HttpService} from "../../shared/services/http.service";
import {CommonModule} from "@angular/common";
import {AuthService} from "../../shared/services/auth.service";
import {FirstWordPipe} from "../../shared/pipes/first.word.pipe";
import {ShortNamePipe} from "../../shared/pipes/short.name.pipe";
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
    ToastContainerComponent
  ]
})
export class HeaderComponent implements OnInit {

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

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}

import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from "@angular/router";
import {User} from "../model/user";
import {CommonModule} from "@angular/common";
import {AuthService} from "../services/auth.service";

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css'],
  imports: [CommonModule, RouterModule]
})
export class FooterComponent implements OnInit {

  currentUser!: User;

  constructor(private router: Router,
              private authService: AuthService
  ) {

  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
      }
    });
  }

  toPage(link: string) {
    this.router.navigate([link]);
  }
}

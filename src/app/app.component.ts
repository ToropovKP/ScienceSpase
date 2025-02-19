import {Component} from '@angular/core';
import {CommonModule} from "@angular/common";
import {RouterModule, RouterOutlet} from "@angular/router";
import {HeaderComponent} from "./system/shared/header/header.component";
import {FooterComponent} from "./system/shared/footer/footer.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterModule, RouterOutlet, HeaderComponent, FooterComponent]
})
export class AppComponent {

  constructor() {
  }
}

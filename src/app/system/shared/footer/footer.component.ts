import {Component, OnInit} from '@angular/core';
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css'],
  imports: [CommonModule, RouterModule]
})
export class FooterComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }
}

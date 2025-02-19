import {Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  imports: [CommonModule, RouterLink, NgOptimizedImage]
})
export class NotFoundComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}

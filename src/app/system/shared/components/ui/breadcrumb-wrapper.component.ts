import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb-wrapper',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule],
  templateUrl: './breadcrumb-wrapper.component.html',
  styleUrls: ['./breadcrumb-wrapper.component.css']
})
export class BreadcrumbWrapperComponent {
  @Input() items: MenuItem[] = [];
  @Input() home?: MenuItem;
}


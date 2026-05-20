import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Старый URL `/restore-password` → новый экран в лейауте `/auth/set-password`. */
@Component({
  selector: 'app-restore-password',
  standalone: true,
  imports: [CommonModule],
  template: `<p class="container py-4 text-muted">Перенаправление…</p>`,
})
export class RestorePasswordComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    void this.router.navigate(['/auth/set-password'], {
      queryParams: this.route.snapshot.queryParams,
      replaceUrl: true,
    });
  }
}

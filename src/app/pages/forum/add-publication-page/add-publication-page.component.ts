import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicationFormComponent } from '../../../features/forum/publication-form/publication-form.component';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-forum-add-publication-page',
  imports: [CommonModule, PublicationFormComponent],
  templateUrl: './add-publication-page.component.html',
  styleUrl: './add-publication-page.component.scss',
})
export class AddPublicationPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getUserInfo() ?? await this.authService.getCurrentUser().catch(() => null);
    if (!currentUser) {
      await this.router.navigate(['/auth']);
    }
  }
}


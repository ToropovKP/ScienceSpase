import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AuthorResponse,
  PageResponse,
  PublicationResponse,
  PublicationService,
} from '../../../entities/forum/publication/api/publication.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-forum-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  activeTab: 'active' | 'favorites' | 'basket' = 'active';
  publications: PublicationResponse[] = [];
  loading = true;
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    const currentUser = this.authService.getUserInfo() ?? await this.authService.getCurrentUser().catch(() => null);
    if (!currentUser) {
      await this.router.navigate(['/auth']);
      return;
    }
    await this.loadPublications();
  }

  async switchTab(tab: 'active' | 'favorites' | 'basket'): Promise<void> {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    await this.loadPublications();
  }

  async toggleFavorite(publication: PublicationResponse): Promise<void> {
    await firstValueFrom(this.publicationService.updateFavorite(publication.id, !publication.favorite));
    publication.favorite = !publication.favorite;
    if (this.activeTab === 'favorites' && !publication.favorite) {
      this.publications = this.publications.filter((item) => item.id !== publication.id);
    }
  }

  async moveToTrash(publication: PublicationResponse): Promise<void> {
    await firstValueFrom(this.publicationService.softDelete(publication.id));
    await this.loadPublications();
  }

  async restore(publication: PublicationResponse): Promise<void> {
    await firstValueFrom(this.publicationService.restore(publication.id));
    await this.loadPublications();
  }

  async deletePermanently(publication: PublicationResponse): Promise<void> {
    await firstValueFrom(this.publicationService.deletePermanent(publication.id));
    this.publications = this.publications.filter((item) => item.id !== publication.id);
  }

  getAuthorsString(authors?: AuthorResponse[]): string {
    if (!authors?.length) {
      return 'Автор не указан';
    }
    return authors
      .map((author) =>
        [author.lastName, author.firstName?.charAt(0) ? `${author.firstName.charAt(0)}.` : '', author.middleName?.charAt(0) ? `${author.middleName.charAt(0)}.` : '']
          .filter(Boolean)
          .join(' '),
      )
      .join(', ');
  }

  private async loadPublications(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      if (this.activeTab === 'active') {
        this.publications = await firstValueFrom(this.publicationService.getAllPublications());
      } else {
        const response: PageResponse<PublicationResponse> = await firstValueFrom(
          this.publicationService.searchPublications({
            page: 1,
            size: 100,
            ...(this.activeTab === 'favorites' ? { favorite: true } : { basket: true }),
          }),
        );
        this.publications = response.content ?? [];
      }
    } catch (error: any) {
      this.error = error?.error?.message || 'Не удалось загрузить публикации.';
      this.publications = [];
    } finally {
      this.loading = false;
    }
  }
}

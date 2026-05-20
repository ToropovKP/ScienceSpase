import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../widgets/shared/header/header.component';
import { ForumFooterComponent } from '../../../widgets/forum/footer/footer.component';

@Component({
  selector: 'app-forum-page-provider',
  imports: [HeaderComponent, ForumFooterComponent, RouterOutlet],
  templateUrl: './page-provider.component.html',
  styleUrl: './page-provider.component.scss',
})
export class PageProviderComponent {}

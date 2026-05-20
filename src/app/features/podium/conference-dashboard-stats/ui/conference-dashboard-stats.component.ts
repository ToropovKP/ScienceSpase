import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type DashboardStatCard = {
  value: string;
  label: string;
  iconPath: string;
  iconAlt: string;
};

@Component({
  selector: 'app-conference-dashboard-stats',
  templateUrl: './conference-dashboard-stats.component.html',
  styleUrls: ['./conference-dashboard-stats.component.css'],
  imports: [CommonModule]
})
export class ConferenceDashboardStatsComponent {
  cards: DashboardStatCard[] = [
    {
      value: '31',
      label: 'Завершенных конференций',
      iconPath: '/assets/icons/Conferences.svg',
      iconAlt: 'Иконка конференций'
    },
    {
      value: '25',
      label: 'Рецензированных публикаций',
      iconPath: '/assets/icons/Publications.svg',
      iconAlt: 'Иконка публикаций'
    },
    {
      value: '9',
      label: 'Публикаций в команде',
      iconPath: '/assets/icons/People.svg',
      iconAlt: 'Иконка команды'
    }
  ];
}

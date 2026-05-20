import {environment} from "../environments/environment";

export const baseUrl: string = `${environment.apiUrl}`;

export const conferenceStatusList: string[] = ['Открыта', 'Временно приостановлена', 'Закрыта'];

export const conferenceStatusMap: Record<string, string> = {
  'ACTIVE': 'Открыта',
  'ON_HOLD': 'Временно приостановлена',
  'CLOSED': 'Закрыта',
  'Открыта': 'ACTIVE',
  'Временно приостановлена': 'ON_HOLD',
  'Закрыта': 'CLOSED'
}

export const userStatusMap: Record<string, string> = {
  'ACTIVE': 'Активен',
  'BANNED': 'Заблокирован',
  'CONFIRMATION': 'Подтверждение',
}

export const userRoleMap: Record<string, string> = {
  'MEMBER': 'Участник',
  'MODERATOR': 'Модератор',
  'ADMIN': 'Админ',
  'REVIEWER': 'Рецензент',
}

export const jobStatusMap: Record<string, string> = {
  'PENDING_REVIEW': 'На модерации',
  'APPROVED': 'Одобрена',
  'REJECTED': 'Отклонена',
  'UNDER_REVISION': 'На доработке',
  'READY_FOR_PUBLICATION': 'Готова к публикации',
}

export const orcidPattern = {
  'S': {pattern: new RegExp('^$|[a-zA-Z0-9]')}
};

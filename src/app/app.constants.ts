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
  'Активен': 'ACTIVE',
  'Заблокирован': 'BANNED',
  'Подтверждение': 'CONFIRMATION'
}

export const userRoleMap: Record<string, string> = {
  'MEMBER': 'Участник',
  'MODERATOR': 'Модератор',
  'ADMIN': 'Админ',
  'REVIEWER': 'Рецензент',
  'Участник': 'MEMBER',
  'Модератор': 'MODERATOR',
  'Админ': 'ADMIN',
  'Рецензент': 'REVIEWER'
}

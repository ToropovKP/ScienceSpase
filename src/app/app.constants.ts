import {format} from "date-fns";
import {ru} from "date-fns/locale/ru";
import {environment} from "../environments/environment";

export class AppConstants {

  public static formatDate(date: Date): string {
    return format(date, 'd MMM y', {locale: ru});
  }

  public static formatDateTime(date: Date): string {
    return format(date, 'd MMM y HH:mm:ss', {locale: ru});
  }

  public static get baseURL(): string {
    return `${environment.apiUrl}`;
  }

  public static get conferenceStatusMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('ACTIVE', 'Открыта');
    statusMap.set('ON_HOLD', 'Временно приостановлена');
    statusMap.set('CLOSED', 'Закрыта');
    statusMap.set('Открыта', 'ACTIVE');
    statusMap.set('Временно приостановлена', 'ON_HOLD');
    statusMap.set('Закрыта', 'CLOSED');
    return statusMap;
  }

  public static get userStatusMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('ACTIVE', 'Активен');
    statusMap.set('BANNED', 'Заблокирован');
    statusMap.set('CONFIRMATION', 'Подтверждение');
    statusMap.set('Активен', 'ACTIVE');
    statusMap.set('Заблокирован', 'BANNED');
    statusMap.set('Подтверждение', 'CONFIRMATION');
    return statusMap;
  }

  public static get userRoleMap(): Map<string, string> {
    let statusMap: Map<string, string> = new Map<string, string>();
    statusMap.set('MEMBER', 'Участник');
    statusMap.set('MODERATOR', 'Модератор');
    statusMap.set('ADMIN', 'Админ');
    statusMap.set('REVIEWER', 'Рецензент');
    statusMap.set('Участник', 'MEMBER');
    statusMap.set('Модератор', 'MODERATOR');
    statusMap.set('Админ', 'ADMIN');
    statusMap.set('Рецензент', 'REVIEWER');
    return statusMap;
  }
}
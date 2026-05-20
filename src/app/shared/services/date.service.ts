import {Injectable} from "@angular/core";
import {format} from "date-fns";
import {ru} from "date-fns/locale/ru";

@Injectable({providedIn: 'root'})
export class DateService {

  constructor() {
  }

  public static formatDate(date: Date): string {
    return format(date, 'd MMM y', {locale: ru});
  }

  public static formatDateTime(date: Date): string {
    return format(date, 'd MMM y HH:mm:ss', {locale: ru});
  }

  /** Для разделителя в чате: «1 апреля» */
  public static formatChatDateSeparator(date: Date): string {
    return format(date, 'd MMMM', {locale: ru});
  }

  /** Время в пузыре сообщения */
  public static formatChatMessageTime(date: Date): string {
    return format(date, 'HH:mm', {locale: ru});
  }
}

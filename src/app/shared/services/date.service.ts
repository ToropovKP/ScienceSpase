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
}

import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {Alert, AlertOptions, AlertType} from "../model/alert";

@Injectable({providedIn: 'root'})
export class AlertService {
  private subject = new Subject<Alert>();
  private defaultId = 'default-alert';

  options = {
    autoClose: true,
    keepAfterRouteChange: true
  };

  // enable subscribing to alerts observable
  onAlert(id = this.defaultId): Observable<Alert> {
    return this.subject.asObservable().pipe(filter(x => x && x.id === id));
  }

  constructErrorAlert(error: any, title: string, description: string) {
    const messageJson = {
      "type": error.error['type'],
      "code": error.error['code'],
      "description": description,
    }
    const message = `${title}:\n\n`
      + `Код ошибки: ${error.status}\n\n`
      + JSON.stringify(messageJson, undefined, 2)
    this.create(message);
  }

  create(message: string) {
    this.error(message, this.options);
  }

  // convenience methods
  success(message: string, options?: AlertOptions) {
    this.alert(new Alert({...options, type: AlertType.Success, message}));
  }

  error(message: string, options?: AlertOptions) {
    this.alert(new Alert({...options, type: AlertType.Error, message}));
  }

  info(message: string, options?: AlertOptions) {
    this.alert(new Alert({...options, type: AlertType.Info, message}));
  }

  warn(message: string, options?: AlertOptions) {
    this.alert(new Alert({...options, type: AlertType.Warning, message}));
  }

  // main alert method
  alert(alert: Alert) {
    alert.id = alert.id || this.defaultId;
    this.subject.next(alert);
  }

  // clear alerts
  clear(id = this.defaultId) {
    this.subject.next(new Alert({id}));
  }
}

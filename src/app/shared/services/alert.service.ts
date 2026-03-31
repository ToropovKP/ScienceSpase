import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {Alert, AlertOptions, AlertType} from "../../entities/common/model/alert";

@Injectable({providedIn: 'root'})
export class AlertService {
  private subject = new Subject<Alert>();
  private defaultId = 'default-alert';

  options = {
    autoClose: true,
    keepAfterRouteChange: true
  };

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
    this.createError(message);
  }

  constructWarnAlert(title: string, description: string) {
    const message = `${title}:\n\n`
        + description
    this.createWarn(message);
  }

  constructSuccessAlert(title: string, description: string) {
    const message = `${title}:\n\n`
        + description
    this.createSuccess(message);
  }

  createSuccess(message: string) {
    this.success(message, this.options);
  }

  createWarn(message: string) {
    this.warn(message, this.options);
  }

  createError(message: string) {
    this.error(message, this.options);
  }

  success(message: string, options?: AlertOptions) {
    this.alert({...options, type: AlertType.Success, message} as Alert);
  }

  error(message: string, options?: AlertOptions) {
    this.alert({...options, type: AlertType.Error, message} as Alert);
  }

  info(message: string, options?: AlertOptions) {
    this.alert({...options, type: AlertType.Info, message} as Alert);
  }

  warn(message: string, options?: AlertOptions) {
    this.alert({...options, type: AlertType.Warning, message} as Alert);
  }

  alert(alert: Alert) {
    alert.id = alert.id || this.defaultId;
    this.subject.next(alert);
  }

  clear(id = this.defaultId) {
    this.subject.next({id} as Alert);
  }
}

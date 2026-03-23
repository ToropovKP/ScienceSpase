export enum AlertType {
  Success,
  Error,
  Info,
  Warning
}

export interface Alert {
  id?: string;
  type?: AlertType;
  message?: string;
  autoClose?: boolean;
  keepAfterRouteChange?: boolean;
  fade?: boolean;
}

export interface AlertOptions {
  id?: string;
  autoClose?: boolean;
  keepAfterRouteChange?: boolean;
}

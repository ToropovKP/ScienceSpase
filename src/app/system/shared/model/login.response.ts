export class LoginResponse {

  private _role: string = "";
  private _access_token: string = "";

  constructor() {
  }

  get role(): string {
    return this._role;
  }

  set role(value: string) {
    this._role = value;
  }

  get access_token(): string {
    return this._access_token;
  }

  set access_token(value: string) {
    this._access_token = value;
  }
}

export class Registration {
  private _fullName!: string;
  private _phone!: string;
  private _email!: string;
  private _organization!: string;
  private _academicDegree!: string;
  private _academicTitle!: string;
  private _password!: string;

  constructor() {
  }

  get academicTitle(): string {
    return this._academicTitle;
  }

  set academicTitle(value: string) {
    this._academicTitle = value;
  }

  get academicDegree(): string {
    return this._academicDegree;
  }

  set academicDegree(value: string) {
    this._academicDegree = value;
  }

  get organization(): string {
    return this._organization;
  }

  set organization(value: string) {
    this._organization = value;
  }

  get phone(): string {
    return this._phone;
  }

  set phone(value: string) {
    this._phone = value;
  }

  get password(): string {
    return this._password;
  }

  set password(value: string) {
    this._password = value;
  }

  get fullName(): string {
    return this._fullName;
  }

  set fullName(value: string) {
    this._fullName = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }
}

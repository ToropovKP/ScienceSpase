export class UserBase {

  private _id!: bigint;
  private _firstName!: string;
  private _lastName!: string;
  private _middleName!: string;
  private _role!: string;
  private _status!: string;

  constructor() {
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get id(): bigint {
    return this._id;
  }

  set id(value: bigint) {
    this._id = value;
  }

  get firstName(): string {
    return this._firstName;
  }

  set firstName(value: string) {
    this._firstName = value;
  }

  get lastName(): string {
    return this._lastName;
  }

  set lastName(value: string) {
    this._lastName = value;
  }

  get middleName(): string {
    return this._middleName;
  }

  set middleName(value: string) {
    this._middleName = value;
  }

  get role(): string {
    return this._role;
  }

  set role(value: string) {
    this._role = value;
  }

  get fullName() {
    return this.lastName + " " + this.firstName + " " + this.middleName
  }
}

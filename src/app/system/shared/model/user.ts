export class User {

  private _id!: bigint;
  private _firstName!: string;
  private _lastName!: string;
  private _middleName!: string;
  private _phone!: string;
  private _email!: string;
  private _organization!: string;
  private _academicDegree!: string;
  private _academicTitle!: string;
  private _orcId!: string;
  private _rincId!: string;
  private _role!: string;
  private _status!: string;
  private _verified!: boolean;

  constructor() {
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get rincId(): string {
    return this._rincId;
  }

  set rincId(value: string) {
    this._rincId = value;
  }

  get orcId(): string {
    return this._orcId;
  }

  set orcId(value: string) {
    this._orcId = value;
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

  get phone(): string {
    return this._phone;
  }

  set phone(value: string) {
    this._phone = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get role(): string {
    return this._role;
  }

  set role(value: string) {
    this._role = value;
  }

  get verified(): boolean {
    return this._verified;
  }

  get fullName() {
    return this.lastName + " " + this.firstName + (this.middleName != null ? " " + this.middleName : "");
  }
}

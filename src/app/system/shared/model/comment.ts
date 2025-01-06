export class Comment {
  private _id!: string;
  private _jobId!: bigint;
  private _userId!: bigint;
  private _firstName!: string;
  private _lastName!: string;
  private _middleName!: string;
  private _message!: string;
  private _dateTime!: Date;

  constructor() {
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get jobId(): bigint {
    return this._jobId;
  }

  set jobId(value: bigint) {
    this._jobId = value;
  }

  get userId(): bigint {
    return this._userId;
  }

  set userId(value: bigint) {
    this._userId = value;
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

  get message(): string {
    return this._message;
  }

  set message(value: string) {
    this._message = value;
  }

  get dateTime(): Date {
    return this._dateTime;
  }

  set dateTime(value: Date) {
    this._dateTime = value;
  }
}

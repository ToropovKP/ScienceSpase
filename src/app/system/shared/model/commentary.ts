import {UserBase} from "./user.base";

export class Commentary {
    private _id!: bigint;
    private _jobId!: bigint;
    private _user!: UserBase;
    private _message!: string;
    private _dateTime!: Date;

    constructor() {
      }

      get id(): bigint {
        return this._id;
      }

      set id(value: bigint) {
        this._id = value;
      }

      get jobId(): bigint {
        return this._jobId;
      }

      set jobId(value: bigint) {
        this._jobId = value;
      }

      get user(): UserBase {
        return this._user;
      }

      set user(value: UserBase) {
        this._user = value;
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

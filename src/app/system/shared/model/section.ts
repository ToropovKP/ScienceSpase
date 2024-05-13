import {UserBase} from "./user.base";

export class Section {
  private _id!: bigint;
  private _title!: string;
  private _leaders!: UserBase[];
  private _conferenceId!: bigint;

  constructor() {
  }

  get id(): bigint {
    return this._id;
  }

  set id(value: bigint) {
    this._id = value;
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  get leaders(): UserBase[] {
    return this._leaders;
  }

  set leaders(value: UserBase[]) {
    this._leaders = value;
  }

  get conferenceId(): bigint {
    return this._conferenceId;
  }

  set conferenceId(value: bigint) {
    this._conferenceId = value;
  }
}

import {Section} from "./section";
import {UserBase} from "./user.base";

export class Conference {

  private _id!: bigint;
  private _title!: string;
  private _organization!: string;
  private _description!: string;
  private _sections!: Section[];
  private _status!: string;
  private _admins!: UserBase[];
  private _tags!: string[];
  private _startDate!: Date;
  private _endDate!: Date;

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

  get organization(): string {
    return this._organization;
  }

  set organization(value: string) {
    this._organization = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get sections(): Section[] {
    return this._sections;
  }

  set sections(value: Section[]) {
    this._sections = value;
  }

  get status(): string {
    return this._status;
  }

  set status(value: string) {
    this._status = value;
  }

  get admins(): UserBase[] {
    return this._admins;
  }

  set admins(value: UserBase[]) {
    this._admins = value;
  }

  get tags(): string[] {
    return this._tags;
  }

  set tags(value: string[]) {
    this._tags = value;
  }

  get startDate(): Date {
    return this._startDate;
  }

  set startDate(value: Date) {
    this._startDate = value;
  }

  get endDate(): Date {
    return this._endDate;
  }

  set endDate(value: Date) {
    this._endDate = value;
  }


}


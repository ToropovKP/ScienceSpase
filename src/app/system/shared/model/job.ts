import {Commentary} from "./commentary";

export class Job {
  private _id!: bigint;
  private _title!: string;
  private _description!: string;
  private _coAuthors!: string;
  private _userName!: string;
  private _conferenceTitle!: string;
  private _sectionTitle!: string;
  private _userId!: bigint;
  private _conferenceId!: bigint;
  private _sectionId!: bigint;
  private _comments!: Commentary[];
  private _dateTime!: Date;
  private _fileName!: string;

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

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get coAuthors(): string {
    return this._coAuthors;
  }

  set coAuthors(value: string) {
    this._coAuthors = value;
  }

  get userName(): string {
    return this._userName;
  }

  set userName(value: string) {
    this._userName = value;
  }

  get conferenceTitle(): string {
    return this._conferenceTitle;
  }

  set conferenceTitle(value: string) {
    this._conferenceTitle = value;
  }

  get sectionTitle(): string {
    return this._sectionTitle;
  }

  set sectionTitle(value: string) {
    this._sectionTitle = value;
  }

  get userId(): bigint {
    return this._userId;
  }

  set userId(value: bigint) {
    this._userId = value;
  }

  get conferenceId(): bigint {
    return this._conferenceId;
  }

  set conferenceId(value: bigint) {
    this._conferenceId = value;
  }

  get sectionId(): bigint {
    return this._sectionId;
  }

  set sectionId(value: bigint) {
    this._sectionId = value;
  }

  get comments(): Commentary[] {
    return this._comments;
  }

  set comments(value: Commentary[]) {
    this._comments = value;
  }

  get dateTime(): Date {
    return this._dateTime;
  }

  set dateTime(value: Date) {
    this._dateTime = value;
  }

  get fileName(): string {
    return this._fileName;
  }

  set fileName(value: string) {
    this._fileName = value;
  }
}

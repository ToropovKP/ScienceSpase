export class Review {
  private _id!: bigint;
  private _userId!: bigint;
  private _text!: string;
  private _reviews!: Record<string, number>;
  private _dateTime!: Date;

  constructor() {
  }

  get id(): bigint {
    return this._id;
  }

  set id(value: bigint) {
    this._id = value;
  }

  get userId(): bigint {
    return this._userId;
  }

  set userId(value: bigint) {
    this._userId = value;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
  }

  get reviews(): Record<string, number> {
    return this._reviews;
  }

  set reviews(value: Record<string, number>) {
    this._reviews = value;
  }

  get dateTime(): Date {
    return this._dateTime;
  }

  set dateTime(value: Date) {
    this._dateTime = value;
  }
}

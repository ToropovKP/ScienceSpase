export class FileMetadata {
  private _id!: bigint;
  private _uuid!: string;
  private _originalName!: string;
  private _uploadTime!: Date;

  constructor() {
  }

  get id(): bigint {
    return this._id;
  }

  set id(value: bigint) {
    this._id = value;
  }

  get uuid(): string {
    return this._uuid;
  }

  set uuid(value: string) {
    this._uuid = value;
  }

  get originalName(): string {
    return this._originalName;
  }

  set originalName(value: string) {
    this._originalName = value;
  }

  get uploadTime(): Date {
    return this._uploadTime;
  }

  set uploadTime(value: Date) {
    this._uploadTime = value;
  }
}

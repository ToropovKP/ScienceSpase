export class UploadResponse {
  private _fileName!: string;
  private _fileDownloadUri!: string;
  private _fileType!: string;
  private _size!: number;

  constructor() {
  }

  get fileName(): string {
    return this._fileName;
  }

  set fileName(value: string) {
    this._fileName = value;
  }

  get fileDownloadUri(): string {
    return this._fileDownloadUri;
  }

  set fileDownloadUri(value: string) {
    this._fileDownloadUri = value;
  }

  get fileType(): string {
    return this._fileType;
  }

  set fileType(value: string) {
    this._fileType = value;
  }

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }
}

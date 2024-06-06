import {Author} from "../model/author";

export class AuthorDto {

  private id!: bigint;
  private fullName!: string;
  private organization!: string;
  private email!: string;

  constructor() {
  }

  createFromAuthor(author: Author) {
    const base = new AuthorDto()
    base.id = author.id
    base.fullName = author.fullName
    base.organization = author.organization
    base.email = author.email
    return base
  }

  getId(): bigint {
    return this.id;
  }

  setId(value: bigint) {
    this.id = value;
  }

  getFullName(): string {
    return this.fullName;
  }

  setFullName(value: string) {
    this.fullName = value;
  }

  getOrganization(): string {
    return this.organization;
  }

  setOrganization(value: string) {
    this.organization = value;
  }

  getEmail(): string {
    return this.email;
  }

  setEmail(value: string) {
    this.email = value;
  }
}

import {UserBase} from "../../entities/user/model/user.base";
import {User} from "../../entities/user/model/user";

export class UserBaseDto {

  private id!: bigint;
  private firstName!: string;
  private lastName!: string;
  private middleName!: string;
  private role!: string;
  private status!: string;

  constructor() {
  }

  createFromUser(user: User) {
    const base = new UserBaseDto()
    base.id = user.id
    base.firstName = user.firstName
    base.lastName = user.lastName
    base.middleName = user.middleName
    base.role = user.role
    base.status = user.status
    return base
  }

  createFromUserBase(user: UserBase) {
    const base = new UserBaseDto()
    base.id = user.id
    base.firstName = user.firstName
    base.lastName = user.lastName
    base.middleName = user.middleName
    base.role = user.role
    base.status = user.status
    return base
  }

  getStatus(): string {
    return this.status;
  }

  setStatus(value: string) {
    this.status = value;
  }

  getId(): bigint {
    return this.id;
  }

  setId(value: bigint) {
    this.id = value;
  }

  getFirstName(): string {
    return this.firstName;
  }

  setFirstName(value: string) {
    this.firstName = value;
  }

  getLastName(): string {
    return this.lastName;
  }

  setLastName(value: string) {
    this.lastName = value;
  }

  getMiddleName(): string {
    return this.middleName;
  }

  setMiddleName(value: string) {
    this.middleName = value;
  }

  getRole(): string {
    return this.role;
  }

  setRole(value: string) {
    this.role = value;
  }

  get fullName() {
    return this.lastName + " " + this.firstName + (this.middleName != null ? " " + this.middleName : "")
  }
}

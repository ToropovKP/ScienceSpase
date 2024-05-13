import {Section} from "../model/section";
import {UserBaseDto} from "./user.base.dto";

export class SectionDto {
  private id!: bigint;
  private title!: string;
  private leaders!: UserBaseDto[];
  private conferenceId!: bigint;

  constructor(section: Section) {
    this.id = section.id
    this.title = section.title

    let leadersDto: UserBaseDto[] = []
    section.leaders.forEach((e) => {
      leadersDto.push(new UserBaseDto().createFromUserBase(e))
    })

    this.leaders = leadersDto
    this.conferenceId = section.conferenceId
  }

  getId(): bigint {
    return this.id;
  }

  setId(value: bigint) {
    this.id = value;
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(value: string) {
    this.title = value;
  }

  getLeaders(): UserBaseDto[] {
    return this.leaders;
  }

  setLeaders(value: UserBaseDto[]) {
    this.leaders = value;
  }

  getConferenceId(): bigint {
    return this.conferenceId;
  }

  setConferenceId(value: bigint) {
    this.conferenceId = value;
  }
}

import {Section} from "../../entities/conference/model/section";
import {UserBaseDto} from "./user.base.dto";

export class SectionDto {
  private id!: bigint;
  private title!: string;
  private leaders!: UserBaseDto[];
  private reviewers!: UserBaseDto[];
  private conferenceId!: bigint;

  constructor(section: Section) {
    this.id = section.id
    this.title = section.title

    let leadersDto: UserBaseDto[] = []
    section.leaders.forEach((e) => {
      leadersDto.push(new UserBaseDto().createFromUserBase(e))
    })

    let reviewersDto: UserBaseDto[] = []
    section.reviewers.forEach((e) => {
      reviewersDto.push(new UserBaseDto().createFromUserBase(e))
    })

    this.leaders = leadersDto
    this.reviewers = reviewersDto
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

  getReviewers(): UserBaseDto[] {
    return this.reviewers;
  }

  setReviewers(value: UserBaseDto[]) {
    this.reviewers = value;
  }

  getConferenceId(): bigint {
    return this.conferenceId;
  }

  setConferenceId(value: bigint) {
    this.conferenceId = value;
  }
}

import {UserBase} from "./user.base";

export interface Section {
  id: bigint;
  title: string;
  leaders: UserBase[];
  reviewers: UserBase[];
  conferenceId: bigint;
}

import {UserBase} from "../../user/model/user.base";

export interface Section {
  id: bigint;
  title: string;
  leaders: UserBase[];
  reviewers: UserBase[];
  conferenceId: bigint;
}

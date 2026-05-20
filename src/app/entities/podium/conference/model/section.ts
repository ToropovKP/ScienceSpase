import {UserBase} from "../../../shared/user/model/user.base";

export interface Section {
  id: bigint;
  title: string;
  leaders: UserBase[];
  reviewers: UserBase[];
  conferenceId: bigint;
}

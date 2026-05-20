import {Section} from "./section";
import {UserBase} from "../../../shared/user/model/user.base";

export interface Conference {
  id: bigint;
  title: string;
  organization: string;
  description: string;
  sections: Section[];
  status: string;
  moderators: UserBase[];
  admins?: UserBase[];
  staffJobEmailRecipients: UserBase[];
  tags: string[];
  startDate: Date;
  endDate: Date;
}

import {Section} from "./section";
import {UserBase} from "./user.base";

export interface Conference {
  id: bigint;
  title: string;
  organization: string;
  description: string;
  sections: Section[];
  status: string;
  admins: UserBase[];
  tags: string[];
  startDate: Date;
  endDate: Date;
}

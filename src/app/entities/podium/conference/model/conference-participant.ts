import { UserBase } from '../../../shared/user/model/user.base';

export interface ConferenceParticipant {
  user: UserBase;
  hasSubmittedJob: boolean;
}

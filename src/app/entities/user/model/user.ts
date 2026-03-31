export interface User {
  id: bigint;
  firstName: string;
  lastName: string;
  middleName: string;
  phone?: string;
  countryCode?: 'RU' | 'BY' | 'KZ';
  phoneNumber?: string;
  email: string;
  organization: string;
  academicDegree: string;
  academicTitle: string;
  orcId: string;
  rincId: string;
  role: string;
  status: string;
  verified: boolean;
}

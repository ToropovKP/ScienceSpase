export type PhoneCountryCode = 'RU' | 'BY' | 'KZ';

export interface PhoneCountryConfig {
  code: PhoneCountryCode;
  label: string;
  dialCode: string;
  flag: string;
  mask: string;
  numberLength: number;
}

export const PHONE_COUNTRIES: PhoneCountryConfig[] = [
  {
    code: 'RU',
    label: 'Россия',
    dialCode: '+7',
    flag: '🇷🇺',
    mask: '(000) 000-00-00',
    numberLength: 10
  },
  {
    code: 'BY',
    label: 'Беларусь',
    dialCode: '+375',
    flag: '🇧🇾',
    mask: '(00) 000-00-00',
    numberLength: 9
  },
  {
    code: 'KZ',
    label: 'Казахстан',
    dialCode: '+7',
    flag: '🇰🇿',
    mask: '(000) 000-00-00',
    numberLength: 10
  }
];

export const DEFAULT_PHONE_COUNTRY_CODE: PhoneCountryCode = 'RU';

export const PHONE_COUNTRY_MAP = PHONE_COUNTRIES.reduce(
  (acc, country) => {
    acc[country.code] = country;
    return acc;
  },
  {} as Record<PhoneCountryCode, PhoneCountryConfig>
);

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type PhoneCountryId = 'RU' | 'BY' | 'KZ';

export interface PhoneCountryOption {
  id: PhoneCountryId;
  label: string;
  flag: string;
  prefix: string;
  mask: string;
  dialPrefix: string;
  nationalLength: number;
}

export const PHONE_COUNTRIES: PhoneCountryOption[] = [
  {
    id: 'RU',
    label: 'Россия',
    flag: '🇷🇺',
    prefix: '+7 ',
    mask: '(000) 000-0000',
    dialPrefix: '7',
    nationalLength: 10
  },
  {
    id: 'KZ',
    label: 'Казахстан',
    flag: '🇰🇿',
    prefix: '+7 ',
    mask: '(000) 000-0000',
    dialPrefix: '7',
    nationalLength: 10
  },
  {
    id: 'BY',
    label: 'Беларусь',
    flag: '🇧🇾',
    prefix: '+375 ',
    mask: '(00) 000-00-00',
    dialPrefix: '375',
    nationalLength: 9
  }
];

export function getPhoneCountry(id: PhoneCountryId): PhoneCountryOption {
  return PHONE_COUNTRIES.find((c) => c.id === id) ?? PHONE_COUNTRIES[0];
}

/** Разбор номера с бэкенда (только цифры с кодом страны) в страну и национальную часть. */
export function parseStoredPhoneDigits(phone: string): { countryId: PhoneCountryId; national: string } {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) {
    return { countryId: 'RU', national: '' };
  }
  if (d.startsWith('375')) {
    return { countryId: 'BY', national: d.slice(3) };
  }
  if (d.startsWith('7') && d.length >= 11) {
    return { countryId: 'RU', national: d.slice(1) };
  }
  if (d.startsWith('8') && d.length === 11) {
    return { countryId: 'RU', national: d.slice(1) };
  }
  if (d.length === 10) {
    return { countryId: 'RU', national: d };
  }
  return { countryId: 'RU', national: d };
}

function stripDialPrefixIfPresent(countryId: PhoneCountryId, digits: string): string {
  const d = (digits || '').replace(/\D/g, '');
  if (!d) return '';
  if (countryId === 'BY') {
    return d.startsWith('375') && d.length > 9 ? d.slice(3) : d;
  }
  return d.startsWith('7') && d.length > 10 ? d.slice(1) : d;
}

export function parseUserPhone(params: {
  countryCode?: PhoneCountryId | null;
  phoneNumber?: string | null;
  phone?: string | null;
}): { countryId: PhoneCountryId; national: string } {
  const countryId = (params.countryCode ?? undefined) as PhoneCountryId | undefined;
  const phoneNumberDigits = (params.phoneNumber ?? '').replace(/\D/g, '');
  const phoneDigits = (params.phone ?? '').replace(/\D/g, '');

  if (countryId && phoneNumberDigits) {
    return { countryId, national: stripDialPrefixIfPresent(countryId, phoneNumberDigits) };
  }

  if (countryId && phoneDigits) {
    const c = getPhoneCountry(countryId);
    const stripped = stripDialPrefixIfPresent(countryId, phoneDigits);
    if (stripped.length === c.nationalLength) {
      return { countryId, national: stripped };
    }
  }

  if (phoneDigits) {
    return parseStoredPhoneDigits(phoneDigits);
  }

  return { countryId: countryId ?? 'RU', national: '' };
}

export function buildFullPhoneDigits(countryId: PhoneCountryId, nationalDigits: string): string {
  const c = getPhoneCountry(countryId);
  return c.dialPrefix + nationalDigits.replace(/\D/g, '');
}

/** Форматирует национальный номер по маске страны: 9991234567 → (999) 123-4567 */
function formatNationalByMask(countryId: PhoneCountryId, nationalDigits: string): string {
  const { mask } = getPhoneCountry(countryId);
  const digits = nationalDigits.replace(/\D/g, '');
  let i = 0;
  let out = '';
  for (const ch of mask) {
    if (ch === '0') {
      if (i >= digits.length) break;
      out += digits[i++];
    } else {
      if (i >= digits.length) break;
      out += ch;
    }
  }
  return out + (i < digits.length ? digits.slice(i) : '');
}

/** Готовая строка для отображения номера телефона: «+7 (999) 123-4567». Возвращает пустую строку, если номера нет. */
export function formatPhoneForDisplay(params: {
  countryCode?: PhoneCountryId | null;
  phoneNumber?: string | null;
  phone?: string | null;
}): string {
  const { countryId, national } = parseUserPhone(params);
  if (!national) return '';
  const country = getPhoneCountry(countryId);
  return `${country.prefix}${formatNationalByMask(countryId, national)}`.trim();
}

export function nationalPhoneValidator(getCountry: () => PhoneCountryId | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const countryId = getCountry();
    if (!countryId) {
      return null;
    }
    const c = getPhoneCountry(countryId);
    const digits = String(control.value ?? '').replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    if (digits.length !== c.nationalLength) {
      return { phoneIncomplete: true };
    }
    return null;
  };
}

// Phone number normalisation helpers for booking forms.
// Numbers are always stored in E.164 format (e.g. +447700900123).

export interface CountryDialCode {
  code: string; // ISO code
  name: string;
  dial: string; // e.g. "+44"
  nationalDigits: number[]; // acceptable national significant number lengths
  example: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: 'GB', name: 'United Kingdom', dial: '+44', nationalDigits: [10], example: '7700 900123' },
  { code: 'IE', name: 'Ireland', dial: '+353', nationalDigits: [9], example: '87 1234567' },
  { code: 'US', name: 'United States / Canada', dial: '+1', nationalDigits: [10], example: '415 555 0123' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', nationalDigits: [8, 9], example: '50 123 4567' },
  { code: 'PK', name: 'Pakistan', dial: '+92', nationalDigits: [10], example: '300 1234567' },
  { code: 'IN', name: 'India', dial: '+91', nationalDigits: [10], example: '98765 43210' },
  { code: 'NG', name: 'Nigeria', dial: '+234', nationalDigits: [10], example: '803 123 4567' },
  { code: 'ZA', name: 'South Africa', dial: '+27', nationalDigits: [9], example: '82 123 4567' },
  { code: 'AU', name: 'Australia', dial: '+61', nationalDigits: [9], example: '412 345 678' },
  { code: 'FR', name: 'France', dial: '+33', nationalDigits: [9], example: '6 12 34 56 78' },
  { code: 'DE', name: 'Germany', dial: '+49', nationalDigits: [10, 11], example: '151 23456789' },
  { code: 'ES', name: 'Spain', dial: '+34', nationalDigits: [9], example: '612 345 678' },
];

export const DEFAULT_DIAL_CODE = '+44';

export const getCountryByDial = (dial: string) =>
  COUNTRY_DIAL_CODES.find((c) => c.dial === dial) ?? COUNTRY_DIAL_CODES[0];

/** Strips everything except digits. */
export const digitsOnly = (value: string) => value.replace(/\D/g, '');

/**
 * Removes trunk prefixes / duplicated country code from a locally typed number.
 * e.g. "07700 900123" with +44 -> "7700900123"
 */
export const toNationalNumber = (input: string, dial: string): string => {
  let digits = digitsOnly(input);
  const dialDigits = digitsOnly(dial);

  if (digits.startsWith('00' + dialDigits)) digits = digits.slice(2 + dialDigits.length);
  else if (dialDigits !== '1' && digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);

  // Drop national trunk prefix "0" (UK, IE, AU, ZA, FR, DE, NG ...)
  while (digits.startsWith('0')) digits = digits.slice(1);

  return digits;
};

/** Builds an E.164 number from a dial code and a locally typed number. */
export const normalisePhone = (input: string, dial: string): string => {
  const national = toNationalNumber(input, dial);
  return national ? `${dial}${national}` : '';
};

/** Validates the national part against the selected country's expected lengths. */
export const validatePhone = (input: string, dial: string): { valid: boolean; error?: string } => {
  const country = getCountryByDial(dial);
  const national = toNationalNumber(input, dial);

  if (!national) return { valid: false, error: 'Phone number is required' };
  if (!/^\d+$/.test(national)) return { valid: false, error: 'Phone number can only contain digits' };
  if (!country.nationalDigits.includes(national.length)) {
    const expected = country.nationalDigits.join(' or ');
    return {
      valid: false,
      error: `Enter a valid ${country.name} number (${expected} digits, e.g. ${country.example})`,
    };
  }
  return { valid: true };
};

/** Splits a stored E.164 number back into dial code + national part. */
export const splitPhone = (value: string): { dial: string; national: string } => {
  const trimmed = (value || '').trim();
  if (trimmed.startsWith('+')) {
    const match = [...COUNTRY_DIAL_CODES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => trimmed.startsWith(c.dial));
    if (match) return { dial: match.dial, national: digitsOnly(trimmed.slice(match.dial.length)) };
  }
  return { dial: DEFAULT_DIAL_CODE, national: digitsOnly(trimmed) };
};

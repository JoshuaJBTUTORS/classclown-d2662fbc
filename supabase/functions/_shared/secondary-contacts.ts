// Helpers for sending to a parent's primary and optional secondary contacts.

export function buildEmailRecipients(
  ...emails: Array<string | null | undefined>
): string[] {
  const list: string[] = [];
  for (const raw of emails) {
    const value = (raw || '').trim();
    if (!value) continue;
    if (list.some((e) => e.toLowerCase() === value.toLowerCase())) continue;
    list.push(value);
  }
  return list;
}

const digitsOnly = (value: string) => value.replace(/\D/g, '');

export function buildPhoneRecipients(
  ...phones: Array<string | null | undefined>
): string[] {
  const list: string[] = [];
  for (const raw of phones) {
    const value = (raw || '').trim();
    if (!value) continue;
    const digits = digitsOnly(value);
    if (!digits) continue;
    if (list.some((p) => digitsOnly(p) === digits)) continue;
    list.push(value);
  }
  return list;
}

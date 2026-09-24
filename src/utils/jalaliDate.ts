export type JalaliDateParts = { year: number; month: number; day: number };

function div(a: number, b: number): number { return Math.floor(a / b); }

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDateParts {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gy + 1;
  if (gm <= 2) gy2 = gy;
  let days = 355666 + 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) { jy += div(days - 1, 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month: jm, day: jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): string {
  const jy2 = jy + 1595;
  let days = -355668 + 365 * jy2 + div(jy2, 33) * 8 + div((jy2 % 33) + 3, 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  const gy = 400 * div(days, 146097);
  days %= 146097;
  let gy2 = days >= 36525 ? 100 * div(--days, 36524) : 0;
  if (gy2 > 0) days %= 36524;
  if (days >= 365) days++;
  gy2 += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) { gy2 += div(days - 1, 365); days = (days - 1) % 365; }
  const year = gy + gy2;
  const dayOfYear = days + 1;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 1;
  let remaining = dayOfYear;
  for (const length of lengths) { if (remaining <= length) break; remaining -= length; month++; }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(remaining).padStart(2, "0")}`;
}

export function isoToJalali(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return "";
  const p = gregorianToJalali(Number(match[1]), Number(match[2]), Number(match[3]));
  return `${p.year}/${String(p.month).padStart(2, "0")}/${String(p.day).padStart(2, "0")}`;
}

export function jalaliToIso(value: string): string {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value.trim().replace(/-/g, "/"));
  if (!match) return "";
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > (month <= 6 ? 31 : month <= 11 ? 30 : 30)) return "";
  return jalaliToGregorian(year, month, day);
}

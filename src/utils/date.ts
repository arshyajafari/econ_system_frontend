const jalaliDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" });
const jalaliDateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
export function formatJalaliDate(value: string | Date | null | undefined): string { if (!value) return "—"; const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value); if (Number.isNaN(date.getTime())) return "—"; return jalaliDateFormatter.format(date); }
export function formatJalaliDateTime(value: string | Date | null | undefined): string { if (!value) return "—"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "—"; return jalaliDateTimeFormatter.format(date); }
function div(a: number, b: number) { return Math.floor(a / b); }
function mod(a: number, b: number) { return a - Math.floor(a / b) * b; }
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] { const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; const gy2 = gm > 2 ? gy + 1 : gy; let days = 355666 + 365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) + gd + gDaysInMonth[gm - 1]; let jy = -1595 + 33 * div(days, 12053); days = mod(days, 12053); jy += 4 * div(days, 1461); days = mod(days, 1461); if (days > 365) { jy += div(days - 1, 365); days = mod(days - 1, 365); } const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30); const jd = 1 + (days < 186 ? mod(days, 31) : mod(days - 186, 30)); return [jy, jm, jd]; }
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] { jy += 1595; let days = -355668 + 365 * jy + div(jy, 33) * 8 + div(mod(jy, 33) + 3, 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186); let gy = 400 * div(days, 146097); days = mod(days, 146097); if (days > 36524) { gy += 100 * div(--days, 36524); days = mod(days, 36524); if (days >= 365) days++; } gy += 4 * div(days, 1461); days = mod(days, 1461); if (days > 365) { gy += div(days - 1, 365); days = mod(days - 1, 365); } let gd = days + 1; const sal = [0, 31, (gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let gm = 0; while (gm < 12 && gd > sal[gm + 1]) { gd -= sal[gm + 1]; gm++; } return [gy, gm + 1, gd]; }
export function gregorianStringToJalali(value: string): string { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return ""; const [jy, jm, jd] = gregorianToJalali(Number(match[1]), Number(match[2]), Number(match[3])); return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`; }
export function jalaliStringToGregorian(value: string): string { const normalized = value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/-/g, "/").trim(); const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized); if (!match) return ""; const jy = Number(match[1]), jm = Number(match[2]), jd = Number(match[3]); if (jy < 1200 || jm < 1 || jm > 12 || jd < 1 || jd > (jm <= 6 ? 31 : 30)) return ""; const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd); const [checkJy, checkJm, checkJd] = gregorianToJalali(gy, gm, gd); if (checkJy !== jy || checkJm !== jm || checkJd !== jd) return ""; return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`; }

/**
 * Stable, display-only sorting for operational tables.
 * Pending/draft records appear first; dates are descending within each status group.
 */
export function sortTableRecords<T extends object>(records: readonly T[]): T[] {
  const statusRank = (value: unknown): number => {
    const status = String(value ?? "").trim().toLowerCase().replace(/[ _-]+/g, "");
    if (["draft", "pending", "awaitingapproval", "submitted", "unconfirmed", "unapproved"].includes(status)) return 0;
    if (["confirmed", "approved", "issued", "active", "prepared", "shipped", "received"].includes(status)) return 1;
    if (["completed", "complete", "delivered", "paid"].includes(status)) return 2;
    if (["cancelled", "canceled", "rejected", "inactive", "failed"].includes(status)) return 3;
    return 1;
  };
  const dateValue = (record: T): number => {
    const keys = ["completed_at", "confirmed_at", "approved_at", "delivered_at", "received_at", "issued_at", "payment_date", "transaction_at", "visit_date", "ordered_at", "expense_date", "record_date", "date", "created_at", "updated_at"];
    for (const key of keys) {
      const value = (record as Record<string, unknown>)[key];
      if (typeof value === "string" || value instanceof Date) {
        const time = Date.parse(String(value));
        if (Number.isFinite(time)) return time;
      }
    }
    return 0;
  };
  return [...records].sort((a, b) => {
    const statusA = (a as Record<string, unknown>).status;
    const statusB = (b as Record<string, unknown>).status;
    if (statusA != null || statusB != null) {
      const rankDifference = statusRank(statusA) - statusRank(statusB);
      if (rankDifference !== 0) return rankDifference;
    }
    return dateValue(b) - dateValue(a);
  });
}

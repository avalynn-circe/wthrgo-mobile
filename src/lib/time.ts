/**
 * Time helpers that work in the *forecast location's* time zone rather than
 * the device's. All inputs are epoch seconds plus the location's UTC offset.
 */

const DAY = 86400;

export function localParts(epoch: number, offsetSeconds: number) {
  const d = new Date((epoch + offsetSeconds) * 1000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

export function dateKey(epoch: number, offsetSeconds: number): string {
  const p = localParts(epoch, offsetSeconds);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function localHour(epoch: number, offsetSeconds: number): number {
  return Math.floor((((epoch + offsetSeconds) % DAY) + DAY) % DAY / 3600);
}

/** "12a", "3a", "12p", "3p" */
export function hourChip(hour: number): string {
  const h = hour % 24;
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/** "3 PM" / "3:30 PM" */
export function formatClock(epoch: number, offsetSeconds: number, withMinutes = false): string {
  const p = localParts(epoch, offsetSeconds);
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const ampm = p.hour < 12 ? 'AM' : 'PM';
  return withMinutes ? `${h12}:${String(p.minute).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today · Sep 20", "Tomorrow · Sep 21", "Tuesday · Sep 22" */
export function dayLabel(key: string, todayKey: string, tomorrowKey: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const md = `${MONTHS[m - 1]} ${d}`;
  if (key === todayKey) return `Today · ${md}`;
  if (key === tomorrowKey) return `Tomorrow · ${md}`;
  return `${WEEKDAYS[dt.getUTCDay()]} · ${md}`;
}

export const nowEpoch = (): number => Math.floor(Date.now() / 1000);

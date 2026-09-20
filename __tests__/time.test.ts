import { dateKey, dayLabel, formatClock, hourChip, localHour } from '../src/lib/time';
import { degreesToCompass, formatTemp } from '../src/lib/units';
import { uuid } from '../src/lib/uuid';

describe('time helpers', () => {
  const t = Date.UTC(2026, 8, 20, 22, 30) / 1000; // 22:30Z
  it('respects the location offset, not the device zone', () => {
    expect(dateKey(t, 0)).toBe('2026-09-20');
    expect(dateKey(t, 2 * 3600)).toBe('2026-09-21');
    expect(localHour(t, 0)).toBe(22);
    expect(localHour(t, -5 * 3600)).toBe(17);
    expect(formatClock(t, -5 * 3600)).toBe('5 PM');
    expect(formatClock(t, 2 * 3600, true)).toBe('12:30 AM');
  });
  it('labels days and hour chips', () => {
    expect(hourChip(0)).toBe('12a');
    expect(hourChip(12)).toBe('12p');
    expect(hourChip(15)).toBe('3p');
    expect(dayLabel('2026-09-20', '2026-09-20', '2026-09-21')).toBe('Today · Sep 20');
    expect(dayLabel('2026-09-21', '2026-09-20', '2026-09-21')).toBe('Tomorrow · Sep 21');
    expect(dayLabel('2026-09-22', '2026-09-20', '2026-09-21')).toBe('Tuesday · Sep 22');
  });
});

describe('units', () => {
  it('converts and formats', () => {
    expect(formatTemp(0, 'F')).toBe('32°');
    expect(formatTemp(21.6, 'C')).toBe('22°');
    expect(degreesToCompass(0)).toBe('N');
    expect(degreesToCompass(359)).toBe('N');
    expect(degreesToCompass(225)).toBe('SW');
  });
});

describe('uuid', () => {
  it('produces v4-shaped ids', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid()).not.toBe(id);
  });
});

import { describe,expect,it } from 'vitest';
import { eventDateParts, eventTimestamp, formatEventDate } from './event-date';

describe('event date helpers',()=>{
  it('keeps a custom date range exactly as entered',()=>{
    expect(formatEventDate('11 - 15 Aug')).toBe('11 - 15 Aug');
    expect(eventDateParts('11 - 15 Aug')).toEqual({day:'11–15',month:'AUG',weekday:''});
  });

  it('formats existing ISO dates',()=>{
    expect(formatEventDate('2026-08-11')).toMatch(/11 Aug/i);
  });

  it('uses end of day when an ISO event has no time',()=>{
    expect(eventTimestamp('2026-08-11','')).toBe(new Date('2026-08-11T23:59:00+05:30').getTime());
    expect(eventTimestamp('11 - 15 Aug','')).toBeNull();
  });
});

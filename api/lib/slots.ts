/**
 * Slot generation — pure function, no side effects.
 * Generates available time slots from availability rules,
 * filtering out slots that overlap existing bookings.
 */

export interface SlotRule {
  day_of_week: number;   // 0=Sunday … 6=Saturday
  start_time: string;    // HH:MM
  end_time: string;      // HH:MM
  buffer_minutes: number;
}

export interface ExistingBooking {
  start_time: string;    // ISO datetime or YYYY-MM-DD HH:MM
  end_time: string;
  status: string;        // 'pending' | 'confirmed' | 'cancelled'
}

export interface TimeSlot {
  start: string;  // ISO datetime
  end: string;
}

/**
 * Parse HH:MM into total minutes from midnight.
 */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format a Date as ISO string (UTC).
 */
function toISO(d: Date): string {
  return d.toISOString();
}

/**
 * Check if two time ranges overlap.
 * Overlap: slotStart < bookingEnd AND slotEnd > bookingStart
 */
function overlaps(
  slotStart: Date,
  slotEnd: Date,
  bookingStart: Date,
  bookingEnd: Date
): boolean {
  return slotStart < bookingEnd && slotEnd > bookingStart;
}

/**
 * Generate available time slots for a given date range.
 *
 * Algorithm:
 * 1. For each day in [startDate, endDate]:
 *    a. Find availability rules matching that day_of_week
 *    b. For each rule, generate candidate slots of `sessionDurationMinutes`
 *       stepping by (sessionDurationMinutes + bufferMinutes)
 *    c. Filter out slots that overlap any non-cancelled booking
 *    d. Filter out slots in the past
 * 2. Return all remaining slots sorted by start time
 */
export function generateSlots(
  rules: SlotRule[],
  existingBookings: ExistingBooking[],
  sessionDurationMinutes: number,
  startDate: Date,
  endDate: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();

  // Only consider non-cancelled bookings
  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled');

  // Iterate each day in the range
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const matchingRules = rules.filter(r => r.day_of_week === dayOfWeek);

    for (const rule of matchingRules) {
      const ruleStartMins = timeToMinutes(rule.start_time);
      const ruleEndMins = timeToMinutes(rule.end_time);
      const step = sessionDurationMinutes + rule.buffer_minutes;

      let slotStartMins = ruleStartMins;

      while (slotStartMins + sessionDurationMinutes <= ruleEndMins) {
        const slotStart = new Date(current);
        slotStart.setHours(Math.floor(slotStartMins / 60), slotStartMins % 60, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + sessionDurationMinutes);

        // Skip past slots
        if (slotStart > now) {
          // Check for overlap with any active booking
          const hasConflict = activeBookings.some(booking => {
            const bStart = new Date(booking.start_time);
            const bEnd = new Date(booking.end_time);
            return overlaps(slotStart, slotEnd, bStart, bEnd);
          });

          if (!hasConflict) {
            slots.push({ start: toISO(slotStart), end: toISO(slotEnd) });
          }
        }

        slotStartMins += step;
      }
    }

    // Advance to next day
    current.setDate(current.getDate() + 1);
  }

  // Sort by start time
  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

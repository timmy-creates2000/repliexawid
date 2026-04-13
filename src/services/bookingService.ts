import { api } from './api';
import type { TimeSlot } from '../lib/types';

/**
 * Fetch available time slots for a user within a date range.
 */
export async function fetchSlots(
  userId: string,
  startDate: string,
  endDate: string,
  sessionTypeId?: string
): Promise<TimeSlot[]> {
  const result = await api.slots.get(userId, startDate, endDate, sessionTypeId);
  return result.slots;
}

/**
 * Create a booking for a visitor.
 */
export async function createBooking(payload: {
  userId: string;
  sessionTypeId: string;
  startTime: string;
  visitorName: string;
  visitorEmail: string;
}): Promise<any> {
  return api.bookings.create(payload);
}

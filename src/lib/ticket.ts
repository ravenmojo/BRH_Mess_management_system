/**
 * Utility functions for Grievance Ticket Numbers
 * Format: <room no><two letter category code><date><count>
 * Example: D-515MS1908261, D-515DW1908261
 */

export const CATEGORY_CODES: Record<string, string> = {
  REGULAR_MESS: 'MS',
  NIGHT_CANTEEN: 'NC',
  MAINTENANCE_WASHROOM: 'WR',
  MAINTENANCE_WATER: 'DW',
  MAINTENANCE_ELECTRICAL: 'EL',
  MAINTENANCE_CIVIL: 'CV',
  MAINTENANCE_CLEANING: 'CL',
  MAINTENANCE_OUTDOOR: 'OD',
};

export const CODE_LABELS: Record<string, string> = {
  MS: 'Mess',
  NC: 'Night Canteen',
  WR: 'Washroom',
  DW: 'Drinking Water',
  EL: 'Electrical',
  CV: 'Civil',
  CL: 'Cleaning',
  OD: 'Outdoor',
  OT: 'Other',
};

/**
 * Returns the 2-letter uppercase category code for a given facility type
 */
export function getCategoryCode(facilityType: string): string {
  if (!facilityType) return 'OT';
  const cleanType = facilityType.trim().toUpperCase();
  return CATEGORY_CODES[cleanType] || 'OT';
}

/**
 * Formats a Date object or ISO string into 6-digit DDMMYY string in IST (Asia/Kolkata)
 */
export function formatTicketDate(dateInput?: Date | string | null): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  
  // Format in IST (Asia/Kolkata)
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).formatToParts(d);

    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const year = parts.find((p) => p.type === 'year')?.value || '26';

    return `${day}${month}${year}`;
  } catch (err) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  }
}

/**
 * Constructs a ticket number from components
 */
export function buildTicketNumber(
  roomNo: string,
  facilityType: string,
  dateInput: Date | string | null = null,
  count: number = 1
): string {
  const cleanRoom = (roomNo || 'A-000').trim().toUpperCase();
  const catCode = getCategoryCode(facilityType);
  const dateStr = formatTicketDate(dateInput);
  const cleanCount = Math.max(1, count || 1);
  return `${cleanRoom}${catCode}${dateStr}${cleanCount}`;
}

/**
 * Ensures any feedback item has a valid ticket number (used for fallback/legacy items)
 */
export function ensureTicketNumber(feedback: any, index: number = 1): string {
  if (feedback.ticketNumber && typeof feedback.ticketNumber === 'string' && feedback.ticketNumber.trim()) {
    return feedback.ticketNumber;
  }
  const room = feedback.roomNo || feedback.hallRoll || 'A-000';
  const facility = feedback.facilityType || 'REGULAR_MESS';
  const date = feedback.createdAt || new Date();
  return buildTicketNumber(room, facility, date, index);
}

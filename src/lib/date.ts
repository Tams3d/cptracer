// Formats an ISO date key (`YYYY-MM-DD`) as `DD/MM`.
export function formatDayMonth(date: string): string {
  const [, month, day] = date.split("-");

  if (!month || !day) return date;

  return `${day}/${month}`;
}

// Formats a local date as an ISO date key (`YYYY-MM-DD`).
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

export function getToday(): Date {
  return new Date();
}

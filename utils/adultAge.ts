export function calendarDate(isoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return isoDate;
}

export function adultLimit(now: Date): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()),
  );
  return date.toISOString().slice(0, 10);
}

export function isAtLeast18(isoDate: string, now = new Date()): boolean {
  const normalized = calendarDate(isoDate);
  if (!normalized) {
    return false;
  }

  return normalized <= adultLimit(now);
}

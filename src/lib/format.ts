/**
 * Date formatting, in one place so every page renders a date the same way.
 *
 * Everything is forced to en-GB and Europe/London. Without that, the server
 * formats in whatever locale the deployment region happens to use while the
 * browser formats in the visitor's — and React logs a hydration mismatch for a
 * date that merely looked slightly different on each side.
 */

const LOCALE = "en-GB";
const TIME_ZONE = "Europe/London";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/** "14 March 2026" */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** "14 March 2026, 09:32" */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

/**
 * "3 days ago". Rough on purpose — nobody needs "2 days, 7 hours" on a list of
 * potholes, and the exact timestamp is always available in the title attribute.
 */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** How long an issue has been open, in whole days. */
export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

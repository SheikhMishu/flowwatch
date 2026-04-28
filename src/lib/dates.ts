import { format, formatDistanceToNow } from "date-fns";
import { TZDate } from "@date-fns/tz";

const TZ = "Australia/Melbourne";

function melb(date: Date | string | number): TZDate {
  return new TZDate(new Date(date), TZ);
}

export function fmtMelb(date: Date | string | number, pattern: string): string {
  return format(melb(date), pattern);
}

export function distanceMelb(date: Date | string | number): string {
  return formatDistanceToNow(melb(date), { addSuffix: true });
}

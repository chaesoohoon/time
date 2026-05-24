import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ko } from "date-fns/locale";
import { KOREAN_DAYS, TIME_ZONE } from "./constants";

export function getKstNow(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return new Date(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
}

export function getKoreanDayOfWeek(date: Date): string {
  return KOREAN_DAYS[date.getDay()];
}

export function isSaturdayDate(date: Date): boolean {
  return date.getDay() === 6;
}

export function isSundayDate(date: Date): boolean {
  return date.getDay() === 0;
}

export function isWeekendDate(date: Date): boolean {
  return isSaturdayDate(date) || isSundayDate(date);
}

export function parseDate(dateText: string | null | undefined): Date | null {
  const text = String(dateText || "").trim();
  if (!text) return null;

  const normalized = text
    .replace(/^\uFEFF/, "")
    .replace(/[./]/g, "-")
    .replace(/\s+/g, "")
    .replace(/년|월/g, "-")
    .replace(/일/g, "");

  const patterns = ["yyyy-MM-dd", "yyyy-M-d", "yy-MM-dd", "yy-M-d"];
  for (const pattern of patterns) {
    const parsed = parse(normalized, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }

  const native = new Date(normalized);
  return isValid(native) ? native : null;
}

export function normalizeDateText(dateText: string | null | undefined): string {
  const date = parseDate(dateText);
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function parseTime(timeText: string | null | undefined): string {
  const text = String(timeText || "").trim();
  if (!text) return "";
  const compact = text
    .replace(/^\uFEFF/, "")
    .replace(/[시]/g, ":")
    .replace(/[분]/g, "")
    .replace(/\s+/g, "");
  const match = compact.match(/^(\d{1,2})(?::?(\d{1,2}))?/);
  if (!match) return "";
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2] || "0")));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function combineDateTime(date: Date, timeText: string | null | undefined): Date {
  const normalizedTime = parseTime(timeText) || "00:00";
  const [hours, minutes] = normalizedTime.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

export function formatKoreanDate(date: Date): string {
  return format(date, "yyyy년 M월 d일 EEEE", { locale: ko });
}

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return {
    start,
    end,
    dates: eachDayOfInterval({ start, end }),
  };
}

export function getMonthRange(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    start,
    end,
    dates: eachDayOfInterval({ start, end }),
  };
}

export function getMonthCalendarRange(date: Date) {
  const month = getMonthRange(date);
  const start = startOfWeek(month.start, { weekStartsOn: 1 });
  const end = endOfWeek(month.end, { weekStartsOn: 1 });
  return {
    start,
    end,
    dates: eachDayOfInterval({ start, end }),
  };
}

export function getYearRange(date: Date) {
  const start = startOfYear(date);
  const end = endOfYear(date);
  return {
    start,
    end,
    dates: eachDayOfInterval({ start, end }),
  };
}

export function addDateDays(date: Date, amount: number): Date {
  return addDays(date, amount);
}

export function minutesFromTime(timeText: string): number {
  const normalized = parseTime(timeText);
  if (!normalized) return 0;
  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}

export function humanizeDuration(minutes: number): string {
  if (minutes <= 0) return "0분";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}시간 ${rest}분`;
  if (hours) return `${hours}시간`;
  return `${rest}분`;
}

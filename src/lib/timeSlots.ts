import type { Schedule } from "@/types";
import { isTimeOverlapping } from "./conflictUtils";

export type TimeSlotKey = "morning" | "afternoon" | "evening";

export type TimeSlot = {
  key: TimeSlotKey;
  label: string;
  description: string;
  start: string;
  end: string;
};

export const TIME_SLOTS: TimeSlot[] = [
  { key: "morning", label: "오전", description: "09:00-13:00", start: "09:00", end: "13:00" },
  { key: "afternoon", label: "오후", description: "14:00-18:00", start: "14:00", end: "18:00" },
  { key: "evening", label: "저녁", description: "18:00-22:00", start: "18:00", end: "22:00" },
];

export function scheduleOverlapsTimeSlot(schedule: Pick<Schedule, "start_time" | "end_time">, slot: TimeSlot) {
  return isTimeOverlapping(schedule.start_time, schedule.end_time, slot.start, slot.end);
}

export function scheduleSlotKeys(schedule: Pick<Schedule, "start_time" | "end_time">): TimeSlotKey[] {
  return TIME_SLOTS.filter((slot) => scheduleOverlapsTimeSlot(schedule, slot)).map((slot) => slot.key);
}

export function slotToneClass(key: TimeSlotKey) {
  if (key === "morning") return "bg-blue-50 text-blue-700";
  if (key === "afternoon") return "bg-emerald-50 text-emerald-700";
  return "bg-violet-50 text-violet-700";
}

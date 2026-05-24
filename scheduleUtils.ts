import type { Closure } from "@/types";
import { formatDateKey, minutesFromTime } from "./dateUtils";

export function getClosuresForDate(date: Date, closures: Closure[] = []): Closure[] {
  const key = formatDateKey(date);
  return closures.filter((closure) => closure.date === key);
}

export function isRoomClosed(
  roomId: string,
  date: Date,
  startTime: string,
  endTime: string,
  closures: Closure[] = [],
): Closure | null {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  return (
    getClosuresForDate(date, closures).find((closure) => {
      if (closure.room_id !== roomId) return false;
      const closureStart = minutesFromTime(closure.start_time || "00:00");
      const closureEnd = minutesFromTime(closure.end_time || "23:59");
      return start < closureEnd && end > closureStart;
    }) || null
  );
}

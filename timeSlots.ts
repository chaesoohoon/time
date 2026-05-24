import type { Course, Instructor, Room, Schedule, ScheduleConflict } from "@/types";
import { getYearRange, parseDate, minutesFromTime } from "./dateUtils";
import { expandSchedulesByDate } from "./scheduleUtils";

export function isTimeOverlapping(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date,
): boolean {
  const toMinute = (value: string | Date) => {
    if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
    const [hours, minutes] = value.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  return toMinute(startA) < toMinute(endB) && toMinute(endA) > toMinute(startB);
}

function getConflictDateRange(schedules: Schedule[]) {
  const dates = schedules
    .flatMap((schedule) => [parseDate(schedule.start_date), parseDate(schedule.end_date)])
    .filter((date): date is Date => Boolean(date));
  if (dates.length === 0) return getYearRange(new Date());
  const start = new Date(Math.min(...dates.map((date) => date.getTime())));
  const end = new Date(Math.max(...dates.map((date) => date.getTime())));
  return {
    start,
    end,
    dates: Array.from({ length: Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    }),
  };
}

function detectConflicts(
  schedules: Schedule[],
  targetKey: "room_id" | "instructor_id",
  targetName: (id: string) => string,
  courses: Course[] = [],
): ScheduleConflict[] {
  const expanded = expandSchedulesByDate(schedules, getConflictDateRange(schedules));

  // Pre-calculate start and end minutes for all expanded schedules once
  const expandedWithMinutes = expanded.map((schedule) => ({
    ...schedule,
    startMinutes: minutesFromTime(schedule.start_time),
    endMinutes: minutesFromTime(schedule.end_time),
  }));

  const conflicts: ScheduleConflict[] = [];
  const groups = new Map<string, typeof expandedWithMinutes>();

  expandedWithMinutes.forEach((schedule) => {
    const key = `${schedule.date}:${schedule[targetKey]}`;
    groups.set(key, [...(groups.get(key) || []), schedule]);
  });

  for (const [key, daySchedules] of groups) {
    const targetId = key.split(":")[1];
    if (!targetId || targetId === "R006" || targetId === "I005") {
      continue;
    }

    // Skip if there's only 1 schedule on this day for this target (conflict impossible)
    if (daySchedules.length <= 1) {
      continue;
    }

    const sorted = [...daySchedules].sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const overlapping = sorted.filter(
        (candidate) =>
          candidate.schedule_id !== current.schedule_id &&
          current.startMinutes < candidate.endMinutes &&
          current.endMinutes > candidate.startMinutes,
      );

      if (overlapping.length > 0) {
        const allSchedules = [current, ...overlapping].sort((a, b) => a.schedule_id.localeCompare(b.schedule_id));
        const uniqueIds = [...new Set(allSchedules.map((schedule) => schedule.schedule_id))];
        const id = `${targetKey}-${current.date}-${targetId}-${uniqueIds.join("-")}`;
        if (conflicts.some((conflict) => conflict.id === id)) continue;

        conflicts.push({
          id,
          type: targetKey === "room_id" ? "room" : "instructor",
          date: current.date,
          start_time: allSchedules.reduce((min, schedule) => (schedule.start_time < min ? schedule.start_time : min), current.start_time),
          end_time: allSchedules.reduce((max, schedule) => (schedule.end_time > max ? schedule.end_time : max), current.end_time),
          target_id: targetId,
          target_name: targetName(targetId),
          schedules: allSchedules,
          course_names: allSchedules.map((schedule) => courses.find((course) => course.course_id === schedule.course_id)?.course_name || "미확인 과정"),
          memo: allSchedules.map((schedule) => schedule.memo).filter(Boolean).join(" / "),
        });
      }
    }
  }

  return conflicts.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
}

export function detectRoomConflicts(schedules: Schedule[], rooms: Room[] = [], courses: Course[] = []): ScheduleConflict[] {
  return detectConflicts(
    schedules,
    "room_id",
    (roomId) => rooms.find((room) => room.room_id === roomId)?.room_name || "미확인 강의실",
    courses,
  );
}

export function detectInstructorConflicts(
  schedules: Schedule[],
  instructors: Instructor[] = [],
  courses: Course[] = [],
): ScheduleConflict[] {
  return detectConflicts(
    schedules,
    "instructor_id",
    (instructorId) => instructors.find((instructor) => instructor.instructor_id === instructorId)?.instructor_name || "미확인 강사",
    courses,
  );
}

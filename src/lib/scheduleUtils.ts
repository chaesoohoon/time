import type {
  Closure,
  Course,
  ExpandedSchedule,
  Instructor,
  JoinedSchedule,
  Room,
  RoomStatus,
  Schedule,
} from "@/types";
import { KOREAN_DAY_ORDER } from "./constants";
import {
  combineDateTime,
  formatDateKey,
  formatTime,
  getMonthRange,
  humanizeDuration,
  minutesFromTime,
  parseDate,
  parseTime,
} from "./dateUtils";
import { isRoomClosed } from "./closureUtils";

const DAY_TO_JS_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

export function parseDaysOfWeek(daysText: string): number[] {
  const text = daysText.trim().replace(/\s+/g, "");
  if (!text || text === "매일") return [0, 1, 2, 3, 4, 5, 6];

  const days = new Set<number>();
  const normalized = text.replace(/~/g, "-").replace(/，/g, ",");
  for (const part of normalized.split(",")) {
    if (!part) continue;
    if (part.includes("-")) {
      const [startLabel, endLabel] = part.split("-");
      const start = KOREAN_DAY_ORDER.indexOf(startLabel as (typeof KOREAN_DAY_ORDER)[number]);
      const end = KOREAN_DAY_ORDER.indexOf(endLabel as (typeof KOREAN_DAY_ORDER)[number]);
      if (start >= 0 && end >= 0) {
        const ordered = start <= end ? KOREAN_DAY_ORDER.slice(start, end + 1) : [...KOREAN_DAY_ORDER.slice(start), ...KOREAN_DAY_ORDER.slice(0, end + 1)];
        ordered.forEach((day) => days.add(DAY_TO_JS_INDEX[day]));
      }
    } else if (DAY_TO_JS_INDEX[part] !== undefined) {
      days.add(DAY_TO_JS_INDEX[part]);
    }
  }

  return days.size > 0 ? [...days] : [0, 1, 2, 3, 4, 5, 6];
}

export function isScheduleOnDate(schedule: Schedule, date: Date): boolean {
  const start = parseDate(schedule.start_date);
  const end = parseDate(schedule.end_date);
  if (!start || !end) return false;

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (dayStart < startDay || dayStart > endDay) return false;

  return parseDaysOfWeek(schedule.days_of_week).includes(dayStart.getDay());
}

export function expandSchedulesByDate(
  schedules: Schedule[],
  dateRange: { start: Date; end: Date; dates: Date[] },
): ExpandedSchedule[] {
  const expanded: ExpandedSchedule[] = [];

  // Pre-generate midnight date info for the dateRange dates to avoid doing it inside the loop
  const dateRangeMidnights = dateRange.dates.map((date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return {
      original: date,
      time: d.getTime(),
      day: d.getDay(),
      dateKey: formatDateKey(date),
    };
  });

  for (const schedule of schedules) {
    if (!schedule.start_time || !schedule.end_time) continue;

    const start = parseDate(schedule.start_date);
    const end = parseDate(schedule.end_date);
    if (!start || !end) continue;

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const startTimeMs = startDay.getTime();
    const endTimeMs = endDay.getTime();

    const targetDays = parseDaysOfWeek(schedule.days_of_week);
    const needsDayReview = schedule.days_of_week.trim().length === 0;

    for (const d of dateRangeMidnights) {
      if (d.time < startTimeMs || d.time > endTimeMs) continue;
      if (!targetDays.includes(d.day)) continue;

      expanded.push({
        ...schedule,
        date: d.dateKey,
        dateObj: new Date(d.original.getFullYear(), d.original.getMonth(), d.original.getDate()),
        startDateTime: combineDateTime(d.original, schedule.start_time),
        endDateTime: combineDateTime(d.original, schedule.end_time),
        needsDayReview,
      });
    }
  }
  return expanded.sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
}

export function joinScheduleWithRelations(
  schedule: ExpandedSchedule,
  courses: Course[],
  rooms: Room[],
  instructors: Instructor[],
): JoinedSchedule {
  const course = courses.find((item) => item.course_id === schedule.course_id) || null;
  const room = rooms.find((item) => item.room_id === schedule.room_id) || null;
  const instructor = instructors.find((item) => item.instructor_id === schedule.instructor_id) || null;
  return {
    ...schedule,
    course,
    room,
    instructor,
    courseName: course?.course_name || "미확인 과정",
    category: course?.category || "기타",
    roomName: room?.room_name || "미확인 강의실",
    instructorName: instructor?.instructor_name || "미확인 강사",
  };
}

export function getSchedulesForDate(
  date: Date,
  schedules: Schedule[] = [],
  courses: Course[] = [],
  rooms: Room[] = [],
  instructors: Instructor[] = [],
): JoinedSchedule[] {
  const range = { start: date, end: date, dates: [date] };
  return expandSchedulesByDate(schedules, range).map((schedule) =>
    joinScheduleWithRelations(schedule, courses, rooms, instructors),
  );
}

export function findCurrentSchedule(
  roomId: string,
  dateTime: Date,
  schedules: JoinedSchedule[] = [],
): JoinedSchedule | null {
  return (
    schedules.find(
      (schedule) =>
        schedule.room_id === roomId &&
        dateTime >= schedule.startDateTime &&
        dateTime < schedule.endDateTime,
    ) || null
  );
}

export function findNextSchedule(
  roomId: string,
  dateTime: Date,
  schedules: JoinedSchedule[] = [],
): JoinedSchedule | null {
  return (
    schedules
      .filter((schedule) => schedule.room_id === roomId && schedule.startDateTime > dateTime)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())[0] || null
  );
}

export function getTodayRoomStatus(
  room: Room,
  schedules: Schedule[],
  courses: Course[],
  instructors: Instructor[],
  closures: Closure[],
  dateTime: Date = new Date(),
): RoomStatus {
  const todaySchedules = getSchedulesForDate(dateTime, schedules, courses, [room], instructors).filter(
    (schedule) => schedule.room_id === room.room_id,
  );
  const currentTime = formatTime(dateTime);
  const currentClosure = isRoomClosed(room.room_id, dateTime, currentTime, currentTime || "23:59", closures);
  const currentSchedules = todaySchedules.filter(
    (schedule) => dateTime >= schedule.startDateTime && dateTime < schedule.endDateTime,
  );
  const conflictCount = currentSchedules.length > 1 ? currentSchedules.length : 0;
  const current = currentSchedules[0] || null;
  const next = findNextSchedule(room.room_id, dateTime, todaySchedules);
  const remaining = todaySchedules.filter((schedule) => schedule.endDateTime > dateTime);

  if (currentClosure) {
    return {
      kind: "closed",
      label: "휴강/점검",
      message: "사용 제한",
      currentSchedule: null,
      nextSchedule: next,
      remainingSchedules: remaining,
      closure: currentClosure,
      conflictCount,
      availableUntil: null,
      progress: null,
    };
  }

  if (conflictCount > 1) {
    return {
      kind: "conflict",
      label: "중복 경고",
      message: "일정 확인 필요",
      currentSchedule: current,
      nextSchedule: next,
      remainingSchedules: remaining,
      closure: null,
      conflictCount,
      availableUntil: null,
      progress: null,
    };
  }

  if (current) {
    const total = current.endDateTime.getTime() - current.startDateTime.getTime();
    const done = dateTime.getTime() - current.startDateTime.getTime();
    const minutesLeft = Math.round((current.endDateTime.getTime() - dateTime.getTime()) / 60000);
    return {
      kind: minutesLeft <= 30 ? "ending-soon" : "in-use",
      label: minutesLeft <= 30 ? "곧 종료" : "사용 중",
      message: minutesLeft <= 30 ? "30분 이내 종료" : "현재 수업 진행 중",
      currentSchedule: current,
      nextSchedule: next,
      remainingSchedules: remaining,
      closure: null,
      conflictCount,
      availableUntil: null,
      progress: total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : null,
    };
  }

  if (todaySchedules.length === 0) {
    return {
      kind: "no-reservation",
      label: "예약 없음",
      message: "오늘 예약 없음",
      currentSchedule: null,
      nextSchedule: null,
      remainingSchedules: [],
      closure: null,
      conflictCount: 0,
      availableUntil: null,
      progress: null,
    };
  }

  return {
    kind: "available",
    label: "비어 있음",
    message: next ? "현재 사용 가능" : "오늘 남은 일정 없음",
    currentSchedule: null,
    nextSchedule: next,
    remainingSchedules: remaining,
    closure: null,
    conflictCount: 0,
    availableUntil: next ? next.start_time : null,
    progress: null,
  };
}

export function findAvailableRooms(
  date: Date,
  startTime: string,
  endTime: string,
  rooms: Room[] = [],
  schedules: Schedule[] = [],
  courses: Course[] = [],
  instructors: Instructor[] = [],
  closures: Closure[] = [],
) {
  const normalizedStart = parseTime(startTime);
  const normalizedEnd = parseTime(endTime);
  if (!normalizedStart || !normalizedEnd) return [];
  const daySchedules = getSchedulesForDate(date, schedules, courses, rooms, instructors);
  const requestStart = minutesFromTime(normalizedStart);
  const requestEnd = minutesFromTime(normalizedEnd);

  return rooms
    .filter((room) => room.is_active)
    .map((room) => {
      const closed = isRoomClosed(room.room_id, date, normalizedStart, normalizedEnd, closures);
      const conflicts = daySchedules.filter((schedule) => {
        if (schedule.room_id !== room.room_id) return false;
        const start = minutesFromTime(schedule.start_time);
        const end = minutesFromTime(schedule.end_time);
        return requestStart < end && requestEnd > start;
      });
      const later = daySchedules
        .filter((schedule) => schedule.room_id === room.room_id && minutesFromTime(schedule.start_time) >= requestEnd)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
      const nextStartMinutes = later ? minutesFromTime(later.start_time) : 24 * 60;
      const usableUntilMinutes = Math.min(nextStartMinutes, requestEnd);

      return {
        room,
        available: !closed && conflicts.length === 0,
        closed,
        conflicts,
        nextSchedule: later || null,
        usableMinutes: Math.max(0, usableUntilMinutes - requestStart),
        usableText: humanizeDuration(Math.max(0, usableUntilMinutes - requestStart)),
      };
    })
    .filter((result) => result.available);
}

export function getMonthlySchedules(
  date: Date,
  schedules: Schedule[],
  courses: Course[],
  rooms: Room[],
  instructors: Instructor[],
): JoinedSchedule[] {
  return expandSchedulesByDate(schedules, getMonthRange(date)).map((schedule) =>
    joinScheduleWithRelations(schedule, courses, rooms, instructors),
  );
}

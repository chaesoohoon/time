"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Building2, CalendarDays, CheckCircle2, Clock3, DoorOpen, UsersRound } from "lucide-react";
import type { JoinedSchedule, Room, SheetData } from "@/types";
import { isRoomClosed } from "@/lib/closureUtils";
import { isTimeOverlapping } from "@/lib/conflictUtils";
import { formatDateKey, getKstNow, parseDate } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";

type TimeSlotOverviewProps = {
  data: SheetData;
  now: Date;
};

type TimeSlot = {
  key: "morning" | "afternoon" | "evening";
  label: string;
  description: string;
  start: string;
  end: string;
};

type DateRange = {
  start: Date;
  end: Date;
  dates: Date[];
};

const timeSlots: TimeSlot[] = [
  { key: "morning", label: "오전", description: "09:00-13:00", start: "09:00", end: "13:00" },
  { key: "afternoon", label: "오후", description: "14:00-18:00", start: "14:00", end: "18:00" },
  { key: "evening", label: "저녁", description: "18:00-22:00", start: "18:00", end: "22:00" },
];

function compact(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateInput(value: string, fallback: Date) {
  const parsed = parseDate(value);
  return parsed || fallback;
}

function buildSingleDayRange(date: Date): DateRange {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start: day, end: day, dates: [day] };
}

function buildLookaheadRange(startDate: Date, data: SheetData): DateRange {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const scheduleEnds = data.schedules.map((schedule) => parseDate(schedule.end_date)).filter((date): date is Date => Boolean(date));
  const closureDates = data.closures.map((closure) => parseDate(closure.date)).filter((date): date is Date => Boolean(date));
  const sourceEnd = [...scheduleEnds, ...closureDates].sort((a, b) => b.getTime() - a.getTime())[0];
  const fallbackEnd = addDays(start, 180);
  const rawEnd = sourceEnd && sourceEnd > start ? sourceEnd : fallbackEnd;
  const end = rawEnd.getTime() - start.getTime() > 370 * 86400000 ? addDays(start, 370) : rawEnd;
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

  return {
    start,
    end,
    dates: Array.from({ length: Math.max(1, dayCount) }, (_, index) => addDays(start, index)),
  };
}

function scheduleOverlapsSlot(schedule: JoinedSchedule, slot: TimeSlot) {
  return isTimeOverlapping(schedule.start_time, schedule.end_time, slot.start, slot.end);
}

function instructorMatches(schedule: JoinedSchedule, instructorName: string, instructorId: string) {
  return schedule.instructor_id === instructorId || compact(schedule.instructorName).includes(compact(instructorName));
}

function daySchedulesFor(date: Date, data: SheetData) {
  return expandSchedulesByDate(data.schedules, buildSingleDayRange(date)).map((schedule) =>
    joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
  );
}

function isRoomBusyOnSlot(room: Room, date: Date, slot: TimeSlot, schedules: JoinedSchedule[], data: SheetData) {
  const closed = isRoomClosed(room.room_id, date, slot.start, slot.end, data.closures);
  const overlapped = schedules.filter((schedule) => schedule.room_id === room.room_id && scheduleOverlapsSlot(schedule, slot));
  return { closed, schedules: overlapped, busy: Boolean(closed || overlapped.length) };
}

function describeFreeUntil(room: Room, slot: TimeSlot, selectedDate: Date, lookahead: DateRange, schedulesByDate: Map<string, JoinedSchedule[]>, data: SheetData) {
  let firstBusyDate: Date | null = null;

  for (const date of lookahead.dates) {
    const dayKey = formatDateKey(date);
    const result = isRoomBusyOnSlot(room, date, slot, schedulesByDate.get(dayKey) || [], data);
    if (result.busy) {
      firstBusyDate = date;
      break;
    }
  }

  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const until = firstBusyDate ? addDays(firstBusyDate, -1) : lookahead.end;
  const dayCount = Math.max(1, Math.floor((until.getTime() - selectedDay.getTime()) / 86400000) + 1);

  if (firstBusyDate && formatDateKey(firstBusyDate) === formatDateKey(selectedDay)) {
    return "이 시간대 사용 가능 여부 확인 필요";
  }

  if (dayCount <= 1) return "오늘 이 시간대 비어 있음";
  return `${format(until, "M월 d일")}까지 비어 있음 · ${dayCount}일`;
}

function slotTone(slot: TimeSlot) {
  if (slot.key === "morning") return "bg-blue-50 text-blue-700";
  if (slot.key === "afternoon") return "bg-emerald-50 text-emerald-700";
  return "bg-violet-50 text-violet-700";
}

function EmptySlot({ label = "수업 없음" }: { label?: string }) {
  return (
    <div className="min-h-[96px] rounded-[18px] bg-white p-4 text-sm font-bold text-toss-gray-tertiary ring-1 ring-toss-border">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        {label}
      </div>
    </div>
  );
}

function SchedulePill({ schedule }: { schedule: JoinedSchedule }) {
  const style = categoryStyle(schedule.category);
  return (
    <div className="rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-toss-border">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
        <span className="text-xs font-black text-toss-gray-secondary">
          {schedule.start_time}-{schedule.end_time}
        </span>
        <Badge className={cn("ring-0", style.soft, style.text)}>{schedule.category}</Badge>
      </div>
      <p className="mt-2 break-words text-sm font-black leading-snug text-toss-gray-primary">{schedule.courseName}</p>
      <p className="mt-1 break-words text-xs font-bold leading-relaxed text-toss-gray-secondary">
        {schedule.roomName} · {schedule.instructorName}
      </p>
      <p className="mt-2 text-[11px] font-bold text-toss-gray-tertiary">
        {schedule.start_date} - {schedule.end_date}
      </p>
    </div>
  );
}

export default function TimeSlotOverview({ data, now }: TimeSlotOverviewProps) {
  const [dateText, setDateText] = useState(toDateInputValue(now));
  const selectedDate = parseDateInput(dateText, now);
  const daySchedules = useMemo(() => daySchedulesFor(selectedDate, data), [data, selectedDate]);
  const lookahead = useMemo(() => buildLookaheadRange(selectedDate, data), [data, selectedDate]);
  const schedulesByDate = useMemo(() => {
    const expanded = expandSchedulesByDate(data.schedules, lookahead).map((schedule) =>
      joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
    );
    return expanded.reduce<Map<string, JoinedSchedule[]>>((map, schedule) => {
      const items = map.get(schedule.date) || [];
      map.set(schedule.date, [...items, schedule]);
      return map;
    }, new Map());
  }, [data, lookahead]);

  const instructors = data.instructors.filter((instructor) => instructor.is_active);
  const rooms = data.rooms.filter((room) => room.is_active);

  const activeInstructorCount = instructors.filter((instructor) =>
    timeSlots.some((slot) =>
      daySchedules.some((schedule) => instructorMatches(schedule, instructor.instructor_name, instructor.instructor_id) && scheduleOverlapsSlot(schedule, slot)),
    ),
  ).length;
  const freeRoomSlotCount = rooms.reduce(
    (count, room) =>
      count +
      timeSlots.filter((slot) => !isRoomBusyOnSlot(room, selectedDate, slot, daySchedules, data).busy).length,
    0,
  );

  return (
    <section className="space-y-5">
      <div className="rounded-[24px] bg-white p-6 shadow-toss">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-toss-gray-primary">시간대별 한눈표</h2>
              <p className="text-sm font-semibold text-toss-gray-secondary">
                강사와 강의실을 오전·오후·저녁 기준으로 한 번에 확인합니다.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_120px]">
            <input
              type="date"
              value={dateText}
              onChange={(event) => setDateText(event.target.value)}
              className="rounded-[14px] bg-toss-bg px-4 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
            <button
              type="button"
              onClick={() => setDateText(toDateInputValue(getKstNow()))}
              className="rounded-[14px] bg-toss-gray-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-toss-gray-secondary active:scale-[0.98]"
            >
              오늘 보기
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] bg-toss-bg p-4">
            <p className="text-xs font-bold text-toss-gray-tertiary">조회 날짜</p>
            <p className="mt-1 text-lg font-black text-toss-gray-primary">{format(selectedDate, "yyyy년 M월 d일")}</p>
          </div>
          <div className="rounded-[18px] bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-600">수업 있는 강사</p>
            <p className="mt-1 text-lg font-black text-blue-700">{activeInstructorCount}명</p>
          </div>
          <div className="rounded-[18px] bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-600">비어 있는 강의실 시간대</p>
            <p className="mt-1 text-lg font-black text-emerald-700">{freeRoomSlotCount}칸</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-6 shadow-toss">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-[14px] bg-blue-50 p-2.5 text-blue-700">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-toss-gray-primary">강사 기준 시간표</h3>
              <p className="text-sm font-semibold text-toss-gray-tertiary">각 강사가 시간대별로 어떤 수업을 하는지 봅니다.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <span key={slot.key} className={cn("rounded-full px-3 py-1 text-xs font-black", slotTone(slot))}>
                {slot.label} {slot.description}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="hidden grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-3 px-1 text-xs font-black text-toss-gray-tertiary lg:grid">
            <span>강사</span>
            {timeSlots.map((slot) => (
              <span key={slot.key}>{slot.label}</span>
            ))}
          </div>
          {instructors.map((instructor) => (
            <div key={instructor.instructor_id} className="grid gap-3 rounded-[22px] bg-toss-bg p-3 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
              <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-4 ring-1 ring-toss-border lg:block">
                <div>
                  <p className="text-base font-black text-toss-gray-primary">{instructor.instructor_name}</p>
                  <p className="mt-1 text-xs font-bold text-toss-gray-tertiary">{instructor.field || "분야 미정"}</p>
                </div>
              </div>
              {timeSlots.map((slot) => {
                const items = daySchedules.filter(
                  (schedule) => instructorMatches(schedule, instructor.instructor_name, instructor.instructor_id) && scheduleOverlapsSlot(schedule, slot),
                );
                return (
                  <div key={slot.key} className="space-y-2">
                    <p className="text-xs font-black text-toss-gray-tertiary lg:hidden">{slot.label} {slot.description}</p>
                    {items.length === 0 ? <EmptySlot /> : null}
                    {items.map((schedule) => (
                      <SchedulePill key={`${instructor.instructor_id}-${slot.key}-${schedule.schedule_id}`} schedule={schedule} />
                    ))}
                    {items.length > 1 ? (
                      <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-black text-red-600">같은 시간대 {items.length}개 일정</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-6 shadow-toss">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-[14px] bg-emerald-50 p-2.5 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-toss-gray-primary">강의실 기준 시간표</h3>
              <p className="text-sm font-semibold text-toss-gray-tertiary">비어 있는 강의실은 해당 시간대가 언제까지 비는지 표시합니다.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="hidden grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-3 px-1 text-xs font-black text-toss-gray-tertiary lg:grid">
            <span>강의실</span>
            {timeSlots.map((slot) => (
              <span key={slot.key}>{slot.label}</span>
            ))}
          </div>
          {rooms.map((room) => (
            <div key={room.room_id} className="grid gap-3 rounded-[22px] bg-toss-bg p-3 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
              <div className="rounded-[18px] bg-white p-4 ring-1 ring-toss-border">
                <p className="text-base font-black text-toss-gray-primary">{room.room_name}</p>
                <p className="mt-1 text-xs font-bold text-toss-gray-tertiary">{room.room_type} {room.floor ? `· ${room.floor}` : ""}</p>
              </div>
              {timeSlots.map((slot) => {
                const result = isRoomBusyOnSlot(room, selectedDate, slot, daySchedules, data);
                return (
                  <div key={slot.key} className="space-y-2">
                    <p className="text-xs font-black text-toss-gray-tertiary lg:hidden">{slot.label} {slot.description}</p>
                    {result.closed ? (
                      <div className="min-h-[110px] rounded-[18px] bg-purple-50 p-4 text-purple-800 ring-1 ring-purple-100">
                        <div className="flex items-center gap-2 text-sm font-black">
                          <Clock3 className="h-4 w-4" />
                          사용 제한
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed">
                          {result.closed.closure_type} · {result.closed.start_time || "00:00"}-{result.closed.end_time || "23:59"}
                        </p>
                        {result.closed.memo ? <p className="mt-2 text-xs font-semibold">{result.closed.memo}</p> : null}
                      </div>
                    ) : null}
                    {!result.closed && result.schedules.length === 0 ? (
                      <div className="min-h-[110px] rounded-[18px] bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100">
                        <div className="flex items-center gap-2 text-sm font-black">
                          <DoorOpen className="h-4 w-4" />
                          비어 있음
                        </div>
                        <p className="mt-2 text-xs font-bold leading-relaxed">
                          {describeFreeUntil(room, slot, selectedDate, lookahead, schedulesByDate, data)}
                        </p>
                      </div>
                    ) : null}
                    {!result.closed && result.schedules.map((schedule) => (
                      <SchedulePill key={`${room.room_id}-${slot.key}-${schedule.schedule_id}`} schedule={schedule} />
                    ))}
                    {!result.closed && result.schedules.length > 1 ? (
                      <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-black text-red-600">강의실 중복 {result.schedules.length}건</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  DoorOpen,
  ListFilter,
  Search,
  UsersRound,
} from "lucide-react";
import type { JoinedSchedule, Room, SheetData } from "@/types";
import { isRoomClosed } from "@/lib/closureUtils";
import { formatDateKey, getKstNow, parseDate } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, slotToneClass, type TimeSlot } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type TimeSlotOverviewProps = {
  data: SheetData;
  now: Date;
};

type DateRange = {
  start: Date;
  end: Date;
  dates: Date[];
};

type ViewMode = "room" | "instructor";
type RowFilter = "all" | "busy" | "free";

type InstructorRow = {
  id: string;
  label: string;
  meta: string;
  scheduleCount: number;
  slotItems: Array<{ slot: TimeSlot; schedules: JoinedSchedule[] }>;
};

type RoomSlotResult = ReturnType<typeof isRoomBusyOnSlot> & {
  slot: TimeSlot;
};

type RoomRow = {
  id: string;
  room: Room;
  label: string;
  meta: string;
  freeSlotCount: number;
  busySlotCount: number;
  slotResults: RoomSlotResult[];
};

const ROW_PREVIEW_LIMIT = 10;

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
  const overlapped = schedules.filter((schedule) => schedule.room_id === room.room_id && scheduleOverlapsTimeSlot(schedule, slot));
  return { closed, schedules: overlapped, busy: Boolean(closed || overlapped.length) };
}

function describeFreeUntil(
  room: Room,
  slot: TimeSlot,
  selectedDate: Date,
  lookahead: DateRange,
  schedulesByDate: Map<string, JoinedSchedule[]>,
  data: SheetData,
) {
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

function textMatches(parts: string[], query: string) {
  if (!query) return true;
  return parts.join(" ").toLowerCase().includes(query);
}

function EmptySlot({ label = "수업 없음" }: { label?: string }) {
  return (
    <div className="min-h-[86px] rounded-[18px] bg-white p-4 text-sm font-bold text-toss-gray-tertiary ring-1 ring-toss-border">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

function SchedulePill({ schedule, mode }: { schedule: JoinedSchedule; mode: ViewMode }) {
  const style = categoryStyle(schedule.category);
  return (
    <article className="rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-toss-border">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} aria-hidden="true" />
        <span className="text-xs font-black text-toss-gray-secondary">
          {schedule.start_time}-{schedule.end_time}
        </span>
        <Badge className={cn("ring-0", style.soft, style.text)}>{schedule.category}</Badge>
      </div>
      <p className="mt-2 break-words text-sm font-black leading-snug text-toss-gray-primary">{schedule.courseName}</p>
      <p className="mt-1 break-words text-xs font-bold leading-relaxed text-toss-gray-secondary">
        {mode === "room" ? `담당 ${schedule.instructorName}` : schedule.roomName}
      </p>
      <p className="mt-2 text-[11px] font-bold text-toss-gray-tertiary">
        {schedule.start_date} - {schedule.end_date}
      </p>
    </article>
  );
}

function buildInstructorRows(data: SheetData, daySchedules: JoinedSchedule[]): InstructorRow[] {
  return data.instructors
    .filter((instructor) => instructor.is_active)
    .map((instructor) => {
      const slotItems = TIME_SLOTS.map((slot) => ({
        slot,
        schedules: daySchedules.filter(
          (schedule) =>
            instructorMatches(schedule, instructor.instructor_name, instructor.instructor_id) &&
            scheduleOverlapsTimeSlot(schedule, slot),
        ),
      }));
      const scheduleCount = slotItems.reduce((count, item) => count + item.schedules.length, 0);

      return {
        id: instructor.instructor_id,
        label: instructor.instructor_name,
        meta: instructor.field || "분야 미정",
        scheduleCount,
        slotItems,
      };
    });
}

function buildRoomRows(
  data: SheetData,
  selectedDate: Date,
  daySchedules: JoinedSchedule[],
): RoomRow[] {
  return data.rooms
    .filter((room) => room.is_active)
    .map((room) => {
      const slotResults = TIME_SLOTS.map((slot) => ({
        slot,
        ...isRoomBusyOnSlot(room, selectedDate, slot, daySchedules, data),
      }));
      const freeSlotCount = slotResults.filter((result) => !result.busy).length;
      const busySlotCount = slotResults.length - freeSlotCount;

      return {
        id: room.room_id,
        room,
        label: room.room_name,
        meta: [room.room_type || "강의실", room.floor].filter(Boolean).join(" · "),
        freeSlotCount,
        busySlotCount,
        slotResults,
      };
    });
}

function rowFilterLabel(mode: ViewMode, filter: RowFilter) {
  if (filter === "all") return "전체 대상";
  if (filter === "busy") return mode === "room" ? "사용 중 포함" : "수업 있는 강사";
  return mode === "room" ? "빈 시간대 있음" : "여유 시간 있음";
}

export default function TimeSlotOverview({ data, now }: TimeSlotOverviewProps) {
  const [dateText, setDateText] = useState(toDateInputValue(now));
  const [viewMode, setViewMode] = useState<ViewMode>("room");
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [query, setQuery] = useState("");
  const [showAllRows, setShowAllRows] = useState(false);

  const selectedDate = useMemo(() => parseDateInput(dateText, now), [dateText, now]);
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

  const instructorRows = useMemo(() => buildInstructorRows(data, daySchedules), [data, daySchedules]);
  const roomRows = useMemo(() => buildRoomRows(data, selectedDate, daySchedules), [data, daySchedules, selectedDate]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredInstructorRows = instructorRows
    .filter((row) => {
      if (rowFilter === "busy" && row.scheduleCount === 0) return false;
      if (rowFilter === "free" && row.slotItems.every((item) => item.schedules.length > 0)) return false;
      return textMatches(
        [row.label, row.meta, ...row.slotItems.flatMap((item) => item.schedules.flatMap((schedule) => [schedule.courseName, schedule.roomName]))],
        normalizedQuery,
      );
    })
    .toSorted((a, b) => b.scheduleCount - a.scheduleCount || a.label.localeCompare(b.label));

  const filteredRoomRows = roomRows
    .filter((row) => {
      if (rowFilter === "busy" && row.busySlotCount === 0) return false;
      if (rowFilter === "free" && row.freeSlotCount === 0) return false;
      return textMatches(
        [row.label, row.meta, ...row.slotResults.flatMap((result) => result.schedules.flatMap((schedule) => [schedule.courseName, schedule.instructorName]))],
        normalizedQuery,
      );
    })
    .toSorted((a, b) => b.freeSlotCount - a.freeSlotCount || b.busySlotCount - a.busySlotCount || a.label.localeCompare(b.label));

  const rows = viewMode === "room" ? filteredRoomRows : filteredInstructorRows;
  const visibleRows = showAllRows ? rows : rows.slice(0, ROW_PREVIEW_LIMIT);
  const hiddenRows = Math.max(0, rows.length - visibleRows.length);
  const activeInstructorCount = instructorRows.filter((row) => row.scheduleCount > 0).length;
  const freeRoomSlotCount = roomRows.reduce((count, row) => count + row.freeSlotCount, 0);

  return (
    <section className="space-y-5" aria-labelledby="slot-overview-title">
      <div className="rounded-[28px] bg-white p-5 shadow-toss md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="slot-overview-title" className="text-2xl font-black tracking-tight text-toss-gray-primary">시간대별 운영 현황</h2>
              <p className="text-sm font-semibold text-toss-gray-secondary">
                강의실 또는 강사를 선택해 오전, 오후, 저녁 상태만 간단히 봅니다.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_120px]">
            <label className="sr-only" htmlFor="time-slot-date">조회 날짜</label>
            <input
              id="time-slot-date"
              type="date"
              value={dateText}
              onChange={(event) => {
                setDateText(event.target.value);
                setShowAllRows(false);
              }}
              className="rounded-[14px] bg-toss-bg px-4 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
            <button
              type="button"
              onClick={() => {
                setDateText(toDateInputValue(getKstNow()));
                setShowAllRows(false);
              }}
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
            <p className="text-xs font-bold text-blue-700">수업 있는 강사</p>
            <p className="mt-1 text-lg font-black text-blue-900">{activeInstructorCount}명</p>
          </div>
          <div className="rounded-[18px] bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">비어 있는 강의실 시간대</p>
            <p className="mt-1 text-lg font-black text-emerald-900">{freeRoomSlotCount}칸</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-toss md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-[14px] p-2.5", viewMode === "room" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>
              {viewMode === "room" ? <Building2 className="h-5 w-5" aria-hidden="true" /> : <UsersRound className="h-5 w-5" aria-hidden="true" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-toss-gray-primary">{viewMode === "room" ? "강의실 기준 한눈표" : "강사 기준 한눈표"}</h3>
              <p className="text-sm font-semibold text-toss-gray-tertiary">
                {viewMode === "room" ? "비어 있는 시간대와 사용 중인 수업을 함께 확인합니다." : "강사별로 오전, 오후, 저녁 수업을 확인합니다."}
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-[16px] bg-toss-bg p-1.5 sm:grid-cols-2 xl:w-[280px]" role="tablist" aria-label="시간대 현황 기준">
            {[
              { key: "room" as const, label: "강의실 기준", icon: Building2 },
              { key: "instructor" as const, label: "강사 기준", icon: UsersRound },
            ].map((item) => {
              const Icon = item.icon;
              const active = viewMode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setViewMode(item.key);
                    setRowFilter("all");
                    setShowAllRows(false);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-black transition",
                    active ? "bg-white text-toss-blue shadow-sm" : "text-toss-gray-secondary hover:text-toss-gray-primary",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
          <label className="relative block">
            <span className="sr-only">강의실, 강사, 과정명 검색</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowAllRows(false);
              }}
              placeholder="강의실, 강사, 과정명 검색"
              className="w-full rounded-[14px] bg-toss-bg py-3 pl-9 pr-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">표시 조건</span>
            <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
            <select
              value={rowFilter}
              onChange={(event) => {
                setRowFilter(event.target.value as RowFilter);
                setShowAllRows(false);
              }}
              className="w-full appearance-none rounded-[14px] bg-toss-bg py-3 pl-9 pr-9 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              {(["all", "busy", "free"] as RowFilter[]).map((filter) => (
                <option key={filter} value={filter}>
                  {rowFilterLabel(viewMode, filter)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
          </label>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {TIME_SLOTS.map((slot) => (
              <span key={slot.key} className={cn("rounded-full px-3 py-2 text-xs font-black", slotToneClass(slot.key))}>
                {slot.label} {slot.description}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="hidden grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-3 px-1 text-xs font-black text-toss-gray-tertiary lg:grid">
            <span>{viewMode === "room" ? "강의실" : "강사"}</span>
            {TIME_SLOTS.map((slot) => (
              <span key={slot.key}>{slot.label}</span>
            ))}
          </div>

          {visibleRows.length === 0 ? (
            <EmptyState title="조건에 맞는 시간대 현황이 없습니다." description="검색어 또는 표시 조건을 바꿔 주세요." />
          ) : null}

          {viewMode === "instructor"
            ? (visibleRows as InstructorRow[]).map((row) => (
                <article key={row.id} className="grid gap-3 rounded-[22px] bg-toss-bg p-3 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-4 ring-1 ring-toss-border lg:block">
                    <div>
                      <p className="text-base font-black text-toss-gray-primary">{row.label}</p>
                      <p className="mt-1 text-xs font-bold text-toss-gray-tertiary">{row.meta}</p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 ring-0 lg:mt-3">{row.scheduleCount}건</Badge>
                  </div>
                  {row.slotItems.map(({ slot, schedules }) => (
                    <div key={slot.key} className="space-y-2">
                      <p className="text-xs font-black text-toss-gray-tertiary lg:hidden">
                        {slot.label} {slot.description}
                      </p>
                      {schedules.length === 0 ? <EmptySlot /> : null}
                      {schedules.map((schedule) => (
                        <SchedulePill key={`${row.id}-${slot.key}-${schedule.schedule_id}`} schedule={schedule} mode={viewMode} />
                      ))}
                      {schedules.length > 1 ? (
                        <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                          같은 시간대 {schedules.length}개 일정
                        </p>
                      ) : null}
                    </div>
                  ))}
                </article>
              ))
            : (visibleRows as RoomRow[]).map((row) => (
                <article key={row.id} className="grid gap-3 rounded-[22px] bg-toss-bg p-3 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))]">
                  <div className="rounded-[18px] bg-white p-4 ring-1 ring-toss-border">
                    <p className="text-base font-black text-toss-gray-primary">{row.label}</p>
                    <p className="mt-1 text-xs font-bold text-toss-gray-tertiary">{row.meta}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-emerald-50 text-emerald-700 ring-0">빈 시간 {row.freeSlotCount}</Badge>
                      <Badge className="bg-slate-100 text-slate-600 ring-0">사용/제한 {row.busySlotCount}</Badge>
                    </div>
                  </div>
                  {row.slotResults.map((result) => (
                    <div key={result.slot.key} className="space-y-2">
                      <p className="text-xs font-black text-toss-gray-tertiary lg:hidden">
                        {result.slot.label} {result.slot.description}
                      </p>
                      {result.closed ? (
                        <div className="min-h-[100px] rounded-[18px] bg-purple-50 p-4 text-purple-800 ring-1 ring-purple-100">
                          <div className="flex items-center gap-2 text-sm font-black">
                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                            사용 제한
                          </div>
                          <p className="mt-2 text-xs font-bold leading-relaxed">
                            {result.closed.closure_type} · {result.closed.start_time || "00:00"}-{result.closed.end_time || "23:59"}
                          </p>
                          {result.closed.memo ? <p className="mt-2 text-xs font-semibold">{result.closed.memo}</p> : null}
                        </div>
                      ) : null}
                      {!result.closed && result.schedules.length === 0 ? (
                        <div className="min-h-[100px] rounded-[18px] bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100">
                          <div className="flex items-center gap-2 text-sm font-black">
                            <DoorOpen className="h-4 w-4" aria-hidden="true" />
                            비어 있음
                          </div>
                          <p className="mt-2 text-xs font-bold leading-relaxed">
                            {describeFreeUntil(row.room, result.slot, selectedDate, lookahead, schedulesByDate, data)}
                          </p>
                        </div>
                      ) : null}
                      {!result.closed &&
                        result.schedules.map((schedule) => (
                          <SchedulePill key={`${row.id}-${result.slot.key}-${schedule.schedule_id}`} schedule={schedule} mode={viewMode} />
                        ))}
                      {!result.closed && result.schedules.length > 1 ? (
                        <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                          강의실 중복 {result.schedules.length}건
                        </p>
                      ) : null}
                    </div>
                  ))}
                </article>
              ))}
        </div>

        {hiddenRows > 0 || showAllRows ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllRows((current) => !current)}
              className="inline-flex items-center gap-2 rounded-[14px] bg-toss-gray-primary px-5 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
              aria-expanded={showAllRows}
            >
              {showAllRows ? (
                <>
                  접어서 보기 <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  {hiddenRows}개 더 보기 <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

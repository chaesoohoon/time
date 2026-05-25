"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Building2, Search, UserRound } from "lucide-react";
import type { Schedule, SheetData } from "@/types";
import { formatDateKey, getKstNow, getYearRange, parseDate } from "@/lib/dateUtils";
import { TIME_SLOTS, scheduleSlotKeys, slotToneClass, type TimeSlotKey } from "@/lib/timeSlots";
import { cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type FocusMode = "room" | "instructor";
type SlotFilter = "all" | TimeSlotKey;

type Segment = {
  id: string;
  courseId: string;
  courseName: string;
  category: string;
  status: string;
  slotKeys: TimeSlotKey[];
  times: string[];
  start: Date;
  end: Date;
  color: string;
  details: string[];
};

type PackedSegment = Segment & {
  row: number;
};

type Gap = {
  start: Date;
  end: Date;
  days: number;
  isCurrent: boolean;
};

type Lane = {
  id: string;
  label: string;
  meta: string;
  segments: Segment[];
  gaps: Gap[];
  longestGap: Gap | null;
  currentOrNextGap: Gap | null;
};

type MonthBand = {
  label: string;
  left: number;
  width: number;
};

const COURSE_COLORS = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#4f46e5",
  "#be185d",
  "#65a30d",
  "#9333ea",
  "#0f766e",
  "#c2410c",
  "#1d4ed8",
  "#b45309",
  "#047857",
  "#6d28d9",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetweenInclusive(start: Date, end: Date) {
  return Math.max(1, Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS) + 1);
}

function overlapsYear(schedule: Schedule, yearStart: Date, yearEnd: Date) {
  const start = parseDate(schedule.start_date);
  const end = parseDate(schedule.end_date);
  if (!start || !end) return null;
  if (start > yearEnd || end < yearStart) return null;
  return {
    start: new Date(Math.max(startOfDay(start).getTime(), startOfDay(yearStart).getTime())),
    end: new Date(Math.min(startOfDay(end).getTime(), startOfDay(yearEnd).getTime())),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatShortDate(date: Date) {
  return format(date, "M.d");
}

function formatGap(gap: Gap | null) {
  if (!gap) return "빈 구간 없음";
  const range =
    formatDateKey(gap.start) === formatDateKey(gap.end)
      ? formatShortDate(gap.start)
      : `${formatShortDate(gap.start)}-${formatShortDate(gap.end)}`;
  return `${range} · ${gap.days}일`;
}

function positionInYear(start: Date, end: Date, yearStart: Date, yearEnd: Date) {
  const totalDays = daysBetweenInclusive(yearStart, yearEnd);
  const leftDays = Math.max(0, Math.floor((startOfDay(start).getTime() - startOfDay(yearStart).getTime()) / DAY_MS));
  const widthDays = daysBetweenInclusive(start, end);
  const left = (leftDays / totalDays) * 100;
  const width = Math.max(1.4, (widthDays / totalDays) * 100);
  return { left, width: Math.min(width, 100 - left) };
}

function buildMonthBands(yearStart: Date, yearEnd: Date): MonthBand[] {
  const year = yearStart.getFullYear();
  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(year, index, 1);
    const monthEnd = new Date(year, index + 1, 0);
    const start = new Date(Math.max(startOfDay(monthStart).getTime(), startOfDay(yearStart).getTime()));
    const end = new Date(Math.min(startOfDay(monthEnd).getTime(), startOfDay(yearEnd).getTime()));
    const position = positionInYear(start, end, yearStart, yearEnd);
    return {
      label: `${index + 1}월`,
      left: position.left,
      width: position.width,
    };
  });
}

function packSegments(segments: Segment[]): PackedSegment[] {
  const rowEnds: Date[] = [];

  return segments
    .toSorted((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime())
    .map((segment) => {
      const row = rowEnds.findIndex((end) => segment.start > end);
      const targetRow = row >= 0 ? row : rowEnds.length;
      rowEnds[targetRow] = segment.end;
      return { ...segment, row: targetRow };
    });
}

function buildGaps(segments: Segment[], yearStart: Date, yearEnd: Date, now: Date): Gap[] {
  const intervals = segments
    .map((segment) => ({ start: startOfDay(segment.start), end: startOfDay(segment.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: Array<{ start: Date; end: Date }> = [];
  intervals.forEach((interval) => {
    const last = merged.at(-1);
    if (!last || interval.start.getTime() > addDays(last.end, 1).getTime()) {
      merged.push({ ...interval });
      return;
    }
    if (interval.end > last.end) last.end = interval.end;
  });

  const gaps: Gap[] = [];
  let cursor = startOfDay(yearStart);
  const today = startOfDay(now);

  merged.forEach((interval) => {
    if (interval.start > cursor) {
      const gapEnd = addDays(interval.start, -1);
      gaps.push({
        start: cursor,
        end: gapEnd,
        days: daysBetweenInclusive(cursor, gapEnd),
        isCurrent: cursor <= today && today <= gapEnd,
      });
    }
    cursor = interval.end >= cursor ? addDays(interval.end, 1) : cursor;
  });

  if (cursor <= yearEnd) {
    gaps.push({
      start: cursor,
      end: startOfDay(yearEnd),
      days: daysBetweenInclusive(cursor, yearEnd),
      isCurrent: cursor <= today && today <= yearEnd,
    });
  }

  return gaps;
}

function getCourseColorMap(data: SheetData) {
  const ids = unique(data.schedules.map((schedule) => schedule.course_id));
  return new Map(ids.map((courseId, index) => [courseId, COURSE_COLORS[index % COURSE_COLORS.length]]));
}

function buildLanes(data: SheetData, mode: FocusMode, yearStart: Date, yearEnd: Date, now: Date): Lane[] {
  const courseColorMap = getCourseColorMap(data);
  const sources =
    mode === "room"
      ? data.rooms.filter((room) => room.is_active).map((room) => ({
          id: room.room_id,
          label: room.room_name,
          meta: [room.room_type, room.floor, room.capacity ? `${room.capacity}명` : ""].filter(Boolean).join(" · ") || "강의실 정보 없음",
        }))
      : data.instructors.filter((instructor) => instructor.is_active).map((instructor) => ({
          id: instructor.instructor_id,
          label: instructor.instructor_name,
          meta: instructor.field || "분야 미정",
        }));

  return sources.map((source) => {
    const grouped = new Map<string, Segment>();
    data.schedules.forEach((schedule) => {
      const matches = mode === "room" ? schedule.room_id === source.id : schedule.instructor_id === source.id;
      if (!matches) return;
      const range = overlapsYear(schedule, yearStart, yearEnd);
      if (!range) return;
      const course = data.courses.find((item) => item.course_id === schedule.course_id) || null;
      const room = data.rooms.find((item) => item.room_id === schedule.room_id) || null;
      const instructor = data.instructors.find((item) => item.instructor_id === schedule.instructor_id) || null;
      const key = `${schedule.course_id}-${formatDateKey(range.start)}-${formatDateKey(range.end)}`;
      const detail =
        mode === "room"
          ? `${instructor?.instructor_name || "미확인 강사"} · ${schedule.start_time}-${schedule.end_time}`
          : `${room?.room_name || "미확인 강의실"} · ${schedule.start_time}-${schedule.end_time}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.details = unique([...existing.details, detail]);
        existing.slotKeys = [...new Set([...existing.slotKeys, ...scheduleSlotKeys(schedule)])];
        existing.times = unique([...existing.times, `${schedule.start_time}-${schedule.end_time}`]);
        return;
      }

      grouped.set(key, {
        id: key,
        courseId: schedule.course_id,
        courseName: course?.course_name || "미확인 과정",
        category: course?.category || "기타",
        status: course?.status || schedule.status || "상태 미정",
        slotKeys: scheduleSlotKeys(schedule),
        times: [`${schedule.start_time}-${schedule.end_time}`],
        start: range.start,
        end: range.end,
        color: courseColorMap.get(schedule.course_id) || COURSE_COLORS[0],
        details: [detail],
      });
    });

    const segments = [...grouped.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
    const gaps = buildGaps(segments, yearStart, yearEnd, now);
    const longestGap = gaps.toSorted((a, b) => b.days - a.days)[0] || null;
    const currentOrNextGap = gaps.find((gap) => gap.isCurrent) || gaps.find((gap) => gap.start >= startOfDay(now)) || null;

    return {
      ...source,
      segments,
      gaps,
      longestGap,
      currentOrNextGap,
    };
  });
}

function laneMatches(lane: Lane, query: string) {
  if (!query) return true;
  const haystack = [
    lane.label,
    lane.meta,
    ...lane.segments.flatMap((segment) => [segment.courseName, segment.category, ...segment.details]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function rebuildLane(lane: Lane, segments: Segment[], yearStart: Date, yearEnd: Date, now: Date): Lane {
  const gaps = buildGaps(segments, yearStart, yearEnd, now);
  const longestGap = gaps.toSorted((a, b) => b.days - a.days)[0] || null;
  const currentOrNextGap = gaps.find((gap) => gap.isCurrent) || gaps.find((gap) => gap.start >= startOfDay(now)) || null;
  return { ...lane, segments, gaps, longestGap, currentOrNextGap };
}

function segmentRangeLabel(segment: Segment) {
  if (formatDateKey(segment.start) === formatDateKey(segment.end)) return formatShortDate(segment.start);
  return `${formatShortDate(segment.start)}-${formatShortDate(segment.end)}`;
}

function segmentTimeLabel(segment: Segment) {
  return segment.times.length > 1 ? `${segment.times[0]} 외 ${segment.times.length - 1}` : segment.times[0] || "";
}

function annualSegmentLabel(segment: Segment, width: number) {
  const range = segmentRangeLabel(segment);
  const time = segmentTimeLabel(segment);
  if (width < 4) return formatShortDate(segment.start);
  if (width < 8) return range;
  if (width < 16) return `${range} · ${time}`;
  return `${range} · ${time} · ${segment.courseName}`;
}

function MonthAxis({ bands }: { bands: MonthBand[] }) {
  return (
    <div className="relative h-7 text-center text-[10px] font-black text-toss-gray-tertiary">
      {bands.map((band) => (
        <span
          key={band.label}
          className="absolute top-0 flex h-full items-center justify-center rounded-full bg-white/70 px-1"
          style={{ left: `${band.left}%`, width: `${band.width}%` }}
        >
          {band.label}
        </span>
      ))}
    </div>
  );
}

export default function AnnualOccupancyInfographic({ data }: { data: SheetData }) {
  const [mode, setMode] = useState<FocusMode>("room");
  const [targetId, setTargetId] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const now = getKstNow();
  const year = getYearRange(now);
  const monthBands = useMemo(() => buildMonthBands(year.start, year.end), [year.end, year.start]);

  const lanes = useMemo(() => buildLanes(data, mode, year.start, year.end, now), [data, mode, now, year.end, year.start]);
  const categories = useMemo(() => unique(data.courses.map((course) => course.category || "기타")), [data.courses]);
  const statuses = useMemo(
    () => unique([...data.courses.map((course) => course.status || "상태 미정"), ...data.schedules.map((schedule) => schedule.status || "상태 미정")]),
    [data.courses, data.schedules],
  );
  const filteredLanes = useMemo(
    () =>
      lanes.map((lane) => {
        const segments = lane.segments.filter((segment) => {
          if (categoryFilter !== "all" && segment.category !== categoryFilter) return false;
          if (statusFilter !== "all" && segment.status !== statusFilter) return false;
          if (slotFilter !== "all" && !segment.slotKeys.includes(slotFilter)) return false;
          return true;
        });
        return rebuildLane(lane, segments, year.start, year.end, now);
      }),
    [categoryFilter, lanes, now, slotFilter, statusFilter, year.end, year.start],
  );
  const targetOptions = lanes.map((lane) => ({ id: lane.id, label: lane.label }));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLanes = filteredLanes
    .filter((lane) => targetId === "all" || lane.id === targetId)
    .filter((lane) => laneMatches(lane, normalizedQuery))
    .sort((a, b) => b.segments.length - a.segments.length || a.label.localeCompare(b.label));

  const visibleSegments = visibleLanes.flatMap((lane) => lane.segments);
  const visibleCourses = unique(visibleSegments.map((segment) => segment.courseId)).map((courseId) => {
    const segment = visibleSegments.find((item) => item.courseId === courseId);
    return segment
      ? { courseId, courseName: segment.courseName, color: segment.color }
      : { courseId, courseName: "미확인 과정", color: COURSE_COLORS[0] };
  });
  const currentFreeCount = visibleLanes.filter((lane) => lane.currentOrNextGap?.isCurrent).length;
  const longestGap = visibleLanes.flatMap((lane) => lane.gaps).toSorted((a, b) => b.days - a.days)[0] || null;

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-toss md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
            {mode === "room" ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-toss-gray-primary">연간 운영 지도</h2>
            <p className="text-sm font-semibold text-toss-gray-secondary">
              초록 바탕은 비어 있는 기간, 색 막대는 과정이 배정된 기간입니다.
            </p>
          </div>
        </div>
        <div className="grid gap-2 rounded-[16px] bg-toss-bg p-1.5 sm:grid-cols-2 xl:w-[280px]">
          {[
            { key: "room" as const, label: "강의실 기준", icon: Building2 },
            { key: "instructor" as const, label: "강사 기준", icon: UserRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key);
                  setTargetId("all");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-black transition",
                  active ? "bg-white text-toss-blue shadow-sm" : "text-toss-gray-secondary hover:text-toss-gray-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_150px_150px_150px]">
        <label className="relative">
          <span className="sr-only">과정, 강사, 강의실 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="과정명, 강사, 강의실 검색"
            className="w-full rounded-[14px] bg-toss-bg py-3 pl-9 pr-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
          />
        </label>
        <select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          aria-label={mode === "room" ? "강의실 선택" : "강사 선택"}
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          <option value="all">{mode === "room" ? "전체 강의실" : "전체 강사"}</option>
          {targetOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="분야 필터"
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          <option value="all">전체 분야</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="상태 필터"
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          <option value="all">전체 상태</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={slotFilter}
          onChange={(event) => setSlotFilter(event.target.value as SlotFilter)}
          aria-label="시간대 필터"
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          <option value="all">전체 시간대</option>
          {TIME_SLOTS.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
        <div className="rounded-[16px] bg-emerald-50 p-3">
          <p className="text-xs font-bold text-emerald-700">현재 빈 대상</p>
          <p className="mt-1 text-xl font-black text-emerald-900">{currentFreeCount}개</p>
        </div>
        <div className="rounded-[16px] bg-blue-50 p-3">
          <p className="text-xs font-bold text-blue-700">가장 긴 빈 기간</p>
          <p className="mt-1 text-sm font-black text-blue-900">{formatGap(longestGap)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] bg-toss-bg p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">빈 기간</span>
          {TIME_SLOTS.map((slot) => (
            <span key={slot.key} className={cn("rounded-full px-3 py-1 text-xs font-black", slotToneClass(slot.key))}>
              {slot.label} {slot.description}
            </span>
          ))}
          {visibleCourses.slice(0, 12).map((course) => (
            <span
              key={course.courseId}
              className="inline-flex max-w-[260px] items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-toss-gray-secondary"
              title={course.courseName}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: course.color }} />
              <span className="truncate">{course.courseName}</span>
            </span>
          ))}
          {visibleCourses.length > 12 ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-toss-gray-tertiary">
              외 {visibleCourses.length - 12}개 과정
            </span>
          ) : null}
        </div>

        {visibleLanes.length === 0 ? (
          <EmptyState title="조건에 맞는 연간 운영 대상이 없습니다." description="검색어 또는 기준을 바꿔 주세요." />
        ) : (
          <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
            <div className="hidden grid-cols-[220px_1fr] gap-4 px-3 text-xs font-black text-toss-gray-tertiary lg:grid">
              <span>{mode === "room" ? "강의실" : "강사"}</span>
              <MonthAxis bands={monthBands} />
            </div>
            {visibleLanes.map((lane) => {
              const packedSegments = packSegments(lane.segments);
              const rowCount = Math.max(1, Math.max(...packedSegments.map((segment) => segment.row + 1), 0));
              const timelineHeight = 104 + rowCount * 46;

              return (
                <article key={lane.id} className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-toss-border">
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="min-w-0 lg:pt-6">
                      <p className="break-words text-base font-black text-toss-gray-primary">{lane.label}</p>
                      <p className="mt-1 break-words text-xs font-bold text-toss-gray-tertiary">{lane.meta}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className={cn("ring-0", lane.currentOrNextGap?.isCurrent ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          {lane.currentOrNextGap?.isCurrent ? "현재 비어 있음" : "다음 빈 구간"}
                        </Badge>
                        <Badge className="bg-toss-bg text-toss-gray-secondary ring-0">{formatGap(lane.currentOrNextGap)}</Badge>
                      </div>
                    </div>

                    <div className="overflow-x-auto pb-1">
                      <div className="min-w-[960px]">
                        <div className="mb-2">
                          <MonthAxis bands={monthBands} />
                        </div>
                        <div className="relative overflow-hidden rounded-[18px] bg-white ring-1 ring-toss-border" style={{ height: timelineHeight }}>
                          <div className="absolute inset-0">
                            {monthBands.map((band, index) => (
                              <div
                                key={band.label}
                                className={cn(
                                  "absolute bottom-0 top-0 border-r border-toss-border/70 last:border-r-0",
                                  index % 2 === 0 ? "bg-slate-50/50" : "bg-white",
                                )}
                                style={{ left: `${band.left}%`, width: `${band.width}%` }}
                              />
                            ))}
                          </div>

                          <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                            빈 기간
                          </div>
                          <div className="absolute left-3 right-3 top-10 h-6 rounded-full bg-slate-100">
                            {lane.gaps.length === 0 ? (
                              <div className="flex h-full items-center justify-center text-[10px] font-black text-slate-500">빈 구간 없음</div>
                            ) : null}
                            {lane.gaps.map((gap) => {
                              const { left, width } = positionInYear(gap.start, gap.end, year.start, year.end);
                              return (
                                <div
                                  key={`${lane.id}-gap-${formatDateKey(gap.start)}-${formatDateKey(gap.end)}`}
                                  className={cn(
                                    "absolute top-0 flex h-6 items-center justify-center overflow-hidden rounded-full px-2 text-[10px] font-black",
                                    gap.isCurrent ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800",
                                  )}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={`빈 기간 · ${formatGap(gap)}`}
                                >
                                  <span className="truncate">{gap.days}일</span>
                                </div>
                              );
                            })}
                          </div>

                          {lane.segments.length === 0 ? (
                            <div className="absolute inset-x-3 bottom-4 top-[82px] flex items-center justify-center rounded-[16px] bg-emerald-50 text-sm font-black text-emerald-800">
                              연간 배정 없음
                            </div>
                          ) : null}

                          {packedSegments.map((segment) => {
                            const { left, width } = positionInYear(segment.start, segment.end, year.start, year.end);
                            const top = 84 + segment.row * 46;
                            return (
                              <div
                                key={segment.id}
                                className="absolute flex h-9 items-center overflow-hidden rounded-[11px] px-3 text-[11px] font-black text-white shadow-sm ring-1 ring-white/50"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  top,
                                  backgroundColor: segment.color,
                                }}
                                title={`${segment.courseName} · ${segmentRangeLabel(segment)} · ${segment.times.join(", ")} · ${segment.details.join(", ")}`}
                              >
                                <span className="truncate">{annualSegmentLabel(segment, width)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lane.segments.slice(0, 4).map((segment) => (
                            <span key={`${lane.id}-${segment.id}-caption`} className="inline-flex items-center gap-1.5 rounded-full bg-toss-bg px-2.5 py-1 text-[11px] font-black text-toss-gray-secondary">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                              {segmentRangeLabel(segment)} · {segmentTimeLabel(segment)}
                            </span>
                          ))}
                          {lane.segments.length > 4 ? (
                            <span className="rounded-full bg-toss-bg px-2.5 py-1 text-[11px] font-black text-toss-gray-tertiary">
                              외 {lane.segments.length - 4}개 배정
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

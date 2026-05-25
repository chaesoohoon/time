"use client";

import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Building2, CalendarRange, DoorOpen, Search, UserRound } from "lucide-react";
import type { Closure, JoinedSchedule, SheetData } from "@/types";
import { isTimeOverlapping } from "@/lib/conflictUtils";
import { formatDateKey, getKoreanDayOfWeek, getKstNow, isSaturdayDate, isSundayDate } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, type TimeSlotKey } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type DateRange = {
  start: Date;
  end: Date;
  dates: Date[];
};

type FocusMode = "room" | "instructor";
type PeriodKind = "week" | "month";

type Segment = {
  id: string;
  slotKey: TimeSlotKey;
  laneId: string;
  sourceId: string;
  startIndex: number;
  endIndex: number;
  startTime: string;
  endTime: string;
  title: string;
  detail: string;
  category: string;
  isClosure: boolean;
};

type PackedSegment = Segment & {
  row: number;
};

type Lane = {
  id: string;
  label: string;
  meta: string;
  segments: Segment[];
  busyUnits: number;
  freeUnits: number;
};

type PeriodOccupancyInfographicProps = {
  data: SheetData;
  defaultMode?: FocusMode;
  period: PeriodKind;
  range: DateRange;
  subtitle: string;
  title: string;
};

const SLOT_ROW_GAP = 10;
const SEGMENT_HEIGHT = 34;
const SEGMENT_GAP = 8;
const LANE_PREVIEW_LIMIT = 8;
const SLOT_LABEL_WIDTH = 56;

function compact(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function scheduleStatus(schedule: JoinedSchedule) {
  return schedule.course?.status || schedule.status || "상태 미정";
}

function dateIndexMap(range: DateRange) {
  return new Map(range.dates.map((date, index) => [formatDateKey(date), index]));
}

function sourceOptions(data: SheetData, mode: FocusMode) {
  if (mode === "room") {
    return data.rooms
      .filter((room) => room.is_active)
      .map((room) => ({
        id: room.room_id,
        label: room.room_name,
        meta: [room.room_type || "강의실", room.floor].filter(Boolean).join(" · "),
      }));
  }

  return data.instructors
    .filter((instructor) => instructor.is_active)
    .map((instructor) => ({
      id: instructor.instructor_id,
      label: instructor.instructor_name,
      meta: instructor.field || "분야 미정",
    }));
}

function scheduleMatchesSource(schedule: JoinedSchedule, mode: FocusMode, sourceId: string) {
  return mode === "room" ? schedule.room_id === sourceId : schedule.instructor_id === sourceId;
}

function closureOverlapsSlot(closure: Closure, slotKey: TimeSlotKey) {
  const slot = TIME_SLOTS.find((item) => item.key === slotKey);
  if (!slot) return false;
  const start = closure.start_time || "00:00";
  const end = closure.end_time || "23:59";
  return isTimeOverlapping(start, end, slot.start, slot.end);
}

function splitConsecutiveSegments(items: Segment[]) {
  const grouped = new Map<string, Segment[]>();

  items.forEach((item) => {
    const key = [item.sourceId, item.slotKey, item.title, item.detail, item.category, item.isClosure ? "closure" : "schedule"].join("|");
    grouped.set(key, [...(grouped.get(key) || []), item]);
  });

  return [...grouped.entries()].flatMap(([key, values]) => {
    const sorted = values.toSorted((a, b) => a.startIndex - b.startIndex);
    const runs: Segment[] = [];
    let current: Segment | null = null;

    sorted.forEach((item) => {
      if (!current || item.startIndex > current.endIndex + 1) {
        current = { ...item, id: `${key}-${item.startIndex}` };
        runs.push(current);
        return;
      }
      current.endIndex = item.endIndex;
    });

    return runs;
  });
}

function buildScheduleSegments(data: SheetData, mode: FocusMode, sourceId: string, range: DateRange, schedules: JoinedSchedule[]) {
  const dayIndexes = dateIndexMap(range);
  const rawSegments: Segment[] = [];

  schedules
    .filter((schedule) => scheduleMatchesSource(schedule, mode, sourceId))
    .forEach((schedule) => {
      const dayIndex = dayIndexes.get(schedule.date);
      if (dayIndex === undefined) return;

      TIME_SLOTS.forEach((slot) => {
        if (!scheduleOverlapsTimeSlot(schedule, slot)) return;
        rawSegments.push({
          id: `${sourceId}-${schedule.schedule_id}-${slot.key}-${dayIndex}`,
          slotKey: slot.key,
          laneId: sourceId,
          sourceId: schedule.schedule_id,
          startIndex: dayIndex,
          endIndex: dayIndex,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          title: schedule.courseName,
          detail: mode === "room" ? schedule.instructorName : schedule.roomName,
          category: schedule.category,
          isClosure: false,
        });
      });
    });

  if (mode === "room") {
    data.closures
      .filter((closure) => closure.room_id === sourceId)
      .forEach((closure) => {
        const dayIndex = dayIndexes.get(closure.date);
        if (dayIndex === undefined) return;
        TIME_SLOTS.forEach((slot) => {
          if (!closureOverlapsSlot(closure, slot.key)) return;
          rawSegments.push({
            id: `${sourceId}-${closure.closure_id}-${slot.key}-${dayIndex}`,
            slotKey: slot.key,
            laneId: sourceId,
            sourceId: closure.closure_id,
            startIndex: dayIndex,
            endIndex: dayIndex,
            startTime: closure.start_time || "00:00",
            endTime: closure.end_time || "23:59",
            title: closure.closure_type || "사용 제한",
            detail: closure.memo || "휴강/점검",
            category: "기타",
            isClosure: true,
          });
        });
      });
  }

  return splitConsecutiveSegments(rawSegments);
}

function buildLanes(data: SheetData, mode: FocusMode, range: DateRange, schedules: JoinedSchedule[]): Lane[] {
  return sourceOptions(data, mode).map((source) => {
    const segments = buildScheduleSegments(data, mode, source.id, range, schedules);
    const busyKeys = new Set<string>();

    segments.forEach((segment) => {
      for (let index = segment.startIndex; index <= segment.endIndex; index += 1) {
        busyKeys.add(`${segment.slotKey}-${index}`);
      }
    });

    const totalUnits = range.dates.length * TIME_SLOTS.length;

    return {
      ...source,
      segments,
      busyUnits: busyKeys.size,
      freeUnits: Math.max(0, totalUnits - busyKeys.size),
    };
  });
}

function packSegments(segments: Segment[]) {
  const bySlot = new Map<TimeSlotKey, PackedSegment[]>();
  const slotHeights = new Map<TimeSlotKey, number>();

  TIME_SLOTS.forEach((slot) => {
    const rowEnds: number[] = [];
    const packed = segments
      .filter((segment) => segment.slotKey === slot.key)
      .toSorted((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex)
      .map((segment) => {
        const row = rowEnds.findIndex((end) => segment.startIndex > end);
        const targetRow = row >= 0 ? row : rowEnds.length;
        rowEnds[targetRow] = segment.endIndex;
        return { ...segment, row: targetRow };
      });
    bySlot.set(slot.key, packed);
    slotHeights.set(slot.key, Math.max(1, rowEnds.length) * (SEGMENT_HEIGHT + SEGMENT_GAP));
  });

  return { bySlot, slotHeights };
}

function laneMatches(lane: Lane, query: string) {
  if (!query) return true;
  return compact([lane.label, lane.meta, ...lane.segments.flatMap((segment) => [segment.title, segment.detail])].join(" ")).includes(compact(query));
}

function timelineMinWidth(period: PeriodKind, dateCount: number) {
  if (period === "week") return Math.max(760, dateCount * 110);
  return Math.max(1240, dateCount * 40);
}

function dateLabel(date: Date, period: PeriodKind) {
  if (period === "week") return `${format(date, "M.d")} ${getKoreanDayOfWeek(date)}`;
  return date.getDate() === 1 ? format(date, "M월 d일") : `${format(date, "d")}일`;
}

function shouldShowDateTick(date: Date, index: number, period: PeriodKind, totalCount: number) {
  if (period === "week") return true;
  const day = date.getDate();
  return day === 1 || day % 5 === 0 || index === totalCount - 1;
}

function weekendTextClass(date: Date) {
  if (isSundayDate(date)) return "text-rose-600";
  if (isSaturdayDate(date)) return "text-sky-600";
  return "";
}

function weekendColumnClass(date: Date) {
  if (isSundayDate(date)) return "bg-rose-50/70";
  if (isSaturdayDate(date)) return "bg-sky-50/70";
  return "";
}

function segmentDateRange(segment: Segment, range: DateRange) {
  const start = range.dates[segment.startIndex];
  const end = range.dates[segment.endIndex];
  if (!start || !end) return "";
  if (formatDateKey(start) === formatDateKey(end)) return format(start, "M.d");
  return `${format(start, "M.d")}-${format(end, "M.d")}`;
}

function segmentLabel(segment: Segment, width: number, range: DateRange) {
  const dateText = segmentDateRange(segment, range);
  const timeText = `${segment.startTime}-${segment.endTime}`;
  if (segment.isClosure) return width < 9 ? `제한 ${segment.startTime}` : `제한 · ${dateText} · ${timeText}`;
  if (width < 4.5) return segment.startTime;
  if (width < 9) return `${dateText} ${segment.startTime}`;
  if (width < 16) return `${dateText} · ${timeText}`;
  return `${dateText} · ${timeText} · ${segment.title}`;
}

function DateAxis({
  inset = false,
  period,
  range,
  today,
}: {
  inset?: boolean;
  period: PeriodKind;
  range: DateRange;
  today: Date;
}) {
  return (
    <div
      className={cn("grid text-center text-[10px] font-black text-toss-gray-tertiary", inset ? "mr-3" : "")}
      style={{
        gridTemplateColumns: `repeat(${range.dates.length}, minmax(0, 1fr))`,
        marginLeft: inset ? SLOT_LABEL_WIDTH : undefined,
      }}
    >
      {range.dates.map((date, index) => {
        const showTick = shouldShowDateTick(date, index, period, range.dates.length);
        return (
          <span
            key={formatDateKey(date)}
            className={cn(
              "min-w-0 rounded-full px-1 py-0.5",
              !showTick ? "opacity-0" : "",
              weekendTextClass(date),
              isSundayDate(date) ? "bg-rose-50" : "",
              isSaturdayDate(date) ? "bg-sky-50" : "",
              isSameDay(date, today) ? "bg-blue-50 text-toss-blue" : "",
            )}
          >
            {showTick ? dateLabel(date, period) : "-"}
          </span>
        );
      })}
    </div>
  );
}

export default function PeriodOccupancyInfographic({
  data,
  defaultMode = "room",
  period,
  range,
  subtitle,
  title,
}: PeriodOccupancyInfographicProps) {
  const [mode, setMode] = useState<FocusMode>(defaultMode);
  const [targetId, setTargetId] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(() => unique(data.courses.map((course) => course.category || "기타")), [data.courses]);
  const statuses = useMemo(
    () => unique([...data.courses.map((course) => course.status || "상태 미정"), ...data.schedules.map((schedule) => schedule.status || "상태 미정")]),
    [data.courses, data.schedules],
  );

  const schedules = useMemo(() => {
    const joined = expandSchedulesByDate(data.schedules, range).map((schedule) =>
      joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
    );

    return joined.filter((schedule) => {
      if (categoryFilter !== "all" && schedule.category !== categoryFilter) return false;
      if (statusFilter !== "all" && scheduleStatus(schedule) !== statusFilter && schedule.status !== statusFilter) return false;
      return true;
    });
  }, [categoryFilter, data, range, statusFilter]);

  const lanes = useMemo(() => buildLanes(data, mode, range, schedules), [data, mode, range, schedules]);
  const options = sourceOptions(data, mode);
  const visibleLanes = lanes
    .filter((lane) => targetId === "all" || lane.id === targetId)
    .filter((lane) => laneMatches(lane, query))
    .toSorted((a, b) => b.busyUnits - a.busyUnits || a.label.localeCompare(b.label));
  const displayLanes = showAll ? visibleLanes : visibleLanes.slice(0, LANE_PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, visibleLanes.length - displayLanes.length);
  const currentFree = visibleLanes.filter((lane) => lane.busyUnits === 0).length;
  const totalBusyUnits = visibleLanes.reduce((sum, lane) => sum + lane.busyUnits, 0);
  const today = getKstNow();
  const timelineWidth = timelineMinWidth(period, range.dates.length);

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-toss md:p-6" aria-labelledby={`${period}-occupancy-title`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
            <CalendarRange className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id={`${period}-occupancy-title`} className="text-2xl font-black tracking-tight text-toss-gray-primary">
              {title}
            </h2>
            <p className="text-sm font-semibold text-toss-gray-secondary">{subtitle}</p>
          </div>
        </div>

        <div className="grid gap-2 rounded-[16px] bg-toss-bg p-1.5 sm:grid-cols-2 xl:w-[280px]" role="tablist" aria-label={`${title} 기준`}>
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
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setMode(item.key);
                  setTargetId("all");
                  setShowAll(false);
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

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_150px_150px_130px_130px]">
        <label className="relative block">
          <span className="sr-only">과정, 강사, 강의실 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowAll(false);
            }}
            placeholder="과정명, 강사, 강의실 검색"
            className="w-full rounded-[14px] bg-toss-bg py-3 pl-9 pr-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
          />
        </label>
        <select
          value={targetId}
          onChange={(event) => {
            setTargetId(event.target.value);
            setShowAll(false);
          }}
          aria-label={mode === "room" ? "강의실 선택" : "강사 선택"}
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          <option value="all">{mode === "room" ? "전체 강의실" : "전체 강사"}</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setShowAll(false);
          }}
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
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setShowAll(false);
          }}
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
        <div className="rounded-[16px] bg-emerald-50 p-3">
          <p className="text-xs font-bold text-emerald-700">완전 여유 대상</p>
          <p className="mt-1 text-xl font-black text-emerald-900">{currentFree}개</p>
        </div>
        <div className="rounded-[16px] bg-blue-50 p-3">
          <p className="text-xs font-bold text-blue-700">운영 칸</p>
          <p className="mt-1 text-xl font-black text-blue-900">{totalBusyUnits}칸</p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] bg-toss-bg p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">비어 있음</span>
          {TIME_SLOTS.map((slot) => (
            <span key={slot.key} className="rounded-full bg-white px-3 py-1 text-toss-gray-secondary">
              {slot.label} {slot.description}
            </span>
          ))}
          <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">휴강/점검</span>
        </div>

        {visibleLanes.length === 0 ? (
          <EmptyState title="조건에 맞는 운영 지도가 없습니다." description="검색어 또는 기준을 바꿔 주세요." />
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[220px_1fr] gap-4 px-3 text-xs font-black text-toss-gray-tertiary lg:grid">
              <span>{mode === "room" ? "강의실" : "강사"}</span>
              <div className="overflow-hidden">
                <DateAxis inset period={period} range={range} today={today} />
              </div>
            </div>

            {displayLanes.map((lane) => {
              const { bySlot, slotHeights } = packSegments(lane.segments);
              const totalHeight =
                20 +
                TIME_SLOTS.reduce((sum, slot) => sum + (slotHeights.get(slot.key) || SEGMENT_HEIGHT + SEGMENT_GAP) + SLOT_ROW_GAP, 0);
              let cursorTop = 18;

              return (
                <article key={lane.id} className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-toss-border">
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="min-w-0">
                      <p className="break-words text-base font-black text-toss-gray-primary">{lane.label}</p>
                      <p className="mt-1 break-words text-xs font-bold text-toss-gray-tertiary">{lane.meta}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 ring-0">
                          <DoorOpen className="mr-1 h-3 w-3" aria-hidden="true" />
                          빈칸 {lane.freeUnits}
                        </Badge>
                        <Badge className="bg-toss-bg text-toss-gray-secondary ring-0">운영 {lane.busyUnits}</Badge>
                      </div>
                    </div>

                    <div className="overflow-x-auto pb-1">
                      <div style={{ minWidth: timelineWidth }}>
                        <div className="mb-2">
                          <DateAxis inset period={period} range={range} today={today} />
                        </div>
                        <div className="relative overflow-hidden rounded-[18px] bg-white ring-1 ring-toss-border" style={{ height: totalHeight }}>
                          <div
                            className="absolute bottom-0 right-3 top-0 grid"
                            style={{
                              gridTemplateColumns: `repeat(${range.dates.length}, minmax(0, 1fr))`,
                              left: SLOT_LABEL_WIDTH,
                            }}
                          >
                            {range.dates.map((date) => (
                              <div
                                key={formatDateKey(date)}
                                className={cn(
                                  "border-r border-toss-border/70 last:border-r-0",
                                  weekendColumnClass(date),
                                  isSameDay(date, today) ? "bg-blue-50/70" : "",
                                )}
                              />
                            ))}
                          </div>

                          {TIME_SLOTS.map((slot) => {
                            const height = slotHeights.get(slot.key) || SEGMENT_HEIGHT + SEGMENT_GAP;
                            const top = cursorTop;
                            cursorTop += height + SLOT_ROW_GAP;
                            const packed = bySlot.get(slot.key) || [];

                            return (
                              <div key={slot.key}>
                                <div
                                  className="absolute left-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-toss-gray-secondary ring-1 ring-toss-border"
                                  style={{ top }}
                                >
                                  {slot.label}
                                </div>
                                <div
                                  className="absolute right-3 overflow-hidden rounded-[14px] bg-emerald-50/70"
                                  style={{ left: SLOT_LABEL_WIDTH, top, height: Math.max(SEGMENT_HEIGHT, height - SEGMENT_GAP) }}
                                >
                                  {packed.length === 0 ? (
                                    <div className="flex h-7 items-center justify-center rounded-full text-[10px] font-black text-emerald-700">
                                      비어 있음
                                    </div>
                                  ) : null}
                                  {packed.map((segment) => {
                                    const style = categoryStyle(segment.category);
                                    const left = (segment.startIndex / range.dates.length) * 100;
                                    const width = ((segment.endIndex - segment.startIndex + 1) / range.dates.length) * 100;
                                    const segmentWidth = Math.min(Math.max(4, width), 100 - left);
                                    const segmentTop = segment.row * (SEGMENT_HEIGHT + SEGMENT_GAP);

                                    return (
                                      <div
                                        key={segment.id}
                                        className={cn(
                                          "absolute flex h-8 items-center overflow-hidden rounded-[10px] px-2.5 text-[10px] font-black text-white shadow-sm ring-1 ring-white/60",
                                          segment.isClosure ? "bg-purple-500" : style.bar,
                                        )}
                                        style={{
                                          left: `${left}%`,
                                          top: segmentTop,
                                          width: `${segmentWidth}%`,
                                        }}
                                        title={`${segmentDateRange(segment, range)} · ${segment.startTime}-${segment.endTime} · ${segment.title} · ${segment.detail}`}
                                        aria-label={`${slot.label} ${segmentDateRange(segment, range)} ${segment.startTime}-${segment.endTime} ${segment.title}, ${segment.detail}`}
                                      >
                                        <span className="truncate">{segmentLabel(segment, width, range)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {hiddenCount > 0 || showAll ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="rounded-[14px] bg-toss-gray-primary px-5 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
              aria-expanded={showAll}
            >
              {showAll ? "접어서 보기" : `${hiddenCount}개 더 보기`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

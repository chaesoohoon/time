"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BookOpenCheck, Building2, Search, SlidersHorizontal, Timeline, UserRound } from "lucide-react";
import type { Course, Schedule, SheetData } from "@/types";
import { formatDateKey, getKstNow, getYearRange, parseDate } from "@/lib/dateUtils";
import { TIME_SLOTS, scheduleSlotKeys, slotToneClass, type TimeSlotKey } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import AnnualOccupancyInfographic from "./AnnualOccupancyInfographic";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type YearlyCoursesProps = {
  data: SheetData;
};

type TimelineMode = "instructor" | "room" | "course";
type SlotFilter = "all" | TimeSlotKey;

type TimelineItem = {
  id: string;
  modeId: string;
  title: string;
  subject: string;
  category: string;
  status: string;
  start: Date;
  end: Date;
  detail: string;
  memo: string;
  slots: TimeSlotKey[];
};

const modeOptions: Array<{ key: TimelineMode; label: string; icon: typeof UserRound }> = [
  { key: "instructor", label: "강사 기준", icon: UserRound },
  { key: "room", label: "강의실 기준", icon: Building2 },
  { key: "course", label: "과정 기준", icon: BookOpenCheck },
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueSlots(schedules: Schedule[]): TimeSlotKey[] {
  const slots = new Set<TimeSlotKey>();
  schedules.forEach((schedule) => {
    scheduleSlotKeys(schedule).forEach((slot) => slots.add(slot));
  });
  return [...slots];
}

function courseOverlapsYear(course: Course, yearStart: Date, yearEnd: Date) {
  const start = parseDate(course.start_date);
  const end = parseDate(course.end_date);
  if (!start || !end) return false;
  return start <= yearEnd && end >= yearStart;
}

function scheduleOverlapsYear(schedule: Schedule, yearStart: Date, yearEnd: Date) {
  const start = parseDate(schedule.start_date);
  const end = parseDate(schedule.end_date);
  if (!start || !end) return false;
  return start <= yearEnd && end >= yearStart;
}

function formatMonthSpan(start: Date, end: Date) {
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return format(start, "M월");
  }
  return `${format(start, "M월")} - ${format(end, "M월")}`;
}

function timelinePosition(start: Date, end: Date, yearStart: Date, yearEnd: Date) {
  const total = Math.max(1, yearEnd.getTime() - yearStart.getTime());
  const clampedStart = new Date(Math.max(start.getTime(), yearStart.getTime()));
  const clampedEnd = new Date(Math.min(end.getTime(), yearEnd.getTime()));
  const left = Math.max(0, ((clampedStart.getTime() - yearStart.getTime()) / total) * 100);
  const width = Math.max(2, ((clampedEnd.getTime() - clampedStart.getTime()) / total) * 100);
  return { left, width: Math.min(width, 100 - left) };
}

function makeScheduleDetail(schedules: Schedule[]) {
  const patterns = unique(schedules.map((schedule) => `${schedule.days_of_week || "요일 확인"} ${schedule.start_time}-${schedule.end_time}`));
  return patterns.slice(0, 3).join(" · ") + (patterns.length > 3 ? ` 외 ${patterns.length - 3}개 시간` : "");
}

function buildCourseItems(data: SheetData, yearStart: Date, yearEnd: Date): TimelineItem[] {
  return data.courses
    .filter((course) => courseOverlapsYear(course, yearStart, yearEnd))
    .map((course) => {
      const start = parseDate(course.start_date) || yearStart;
      const end = parseDate(course.end_date) || yearStart;
      const schedules = data.schedules.filter((schedule) => schedule.course_id === course.course_id);
      const rooms = unique(
        schedules.map((schedule) => data.rooms.find((room) => room.room_id === schedule.room_id)?.room_name || "미확인 강의실"),
      );
      const instructors = unique(
        schedules.map(
          (schedule) => data.instructors.find((instructor) => instructor.instructor_id === schedule.instructor_id)?.instructor_name || "미확인 강사",
        ),
      );

      return {
        id: `course-${course.course_id}`,
        modeId: course.course_id,
        title: course.course_name,
        subject: instructors.length ? instructors.join(", ") : "담당 강사 미정",
        category: course.category || "기타",
        status: course.status || "상태 미정",
        start,
        end,
        detail: `${rooms.length ? rooms.join(", ") : "강의실 미정"} · ${course.total_hours ? `${course.total_hours}시간` : "시수 미정"}`,
        memo: course.memo,
        slots: uniqueSlots(schedules),
      };
    });
}

function buildGroupedScheduleItems(data: SheetData, mode: Exclude<TimelineMode, "course">, yearStart: Date, yearEnd: Date): TimelineItem[] {
  const groups = new Map<string, Schedule[]>();

  data.schedules
    .filter((schedule) => scheduleOverlapsYear(schedule, yearStart, yearEnd))
    .forEach((schedule) => {
      const key = mode === "instructor" ? `${schedule.instructor_id}:${schedule.course_id}` : `${schedule.room_id}:${schedule.course_id}`;
      groups.set(key, [...(groups.get(key) || []), schedule]);
    });

  return [...groups.entries()].flatMap(([key, schedules]) => {
    const first = schedules[0];
    if (!first) return [];
    const course = data.courses.find((item) => item.course_id === first.course_id) || null;
    const starts = schedules.map((schedule) => parseDate(schedule.start_date)).filter((date): date is Date => Boolean(date));
    const ends = schedules.map((schedule) => parseDate(schedule.end_date)).filter((date): date is Date => Boolean(date));
    if (!starts.length || !ends.length) return [];
    const start = new Date(Math.min(...starts.map((date) => date.getTime())));
    const end = new Date(Math.max(...ends.map((date) => date.getTime())));
    const instructor = data.instructors.find((item) => item.instructor_id === first.instructor_id) || null;
    const room = data.rooms.find((item) => item.room_id === first.room_id) || null;
    const rooms = unique(schedules.map((schedule) => data.rooms.find((item) => item.room_id === schedule.room_id)?.room_name || "미확인 강의실"));
    const instructors = unique(
      schedules.map((schedule) => data.instructors.find((item) => item.instructor_id === schedule.instructor_id)?.instructor_name || "미확인 강사"),
    );
    const modeId = mode === "instructor" ? first.instructor_id : first.room_id;

    return {
      id: `${mode}-${key}`,
      modeId,
      title: mode === "instructor" ? instructor?.instructor_name || "미확인 강사" : room?.room_name || "미확인 강의실",
      subject: course?.course_name || "미확인 과정",
      category: course?.category || "기타",
      status: course?.status || first.status || "상태 미정",
      start,
      end,
      detail:
        mode === "instructor"
          ? `${rooms.join(", ")} · ${makeScheduleDetail(schedules)}`
          : `${instructors.join(", ")} · ${makeScheduleDetail(schedules)}`,
      memo: course?.memo || first.memo,
      slots: uniqueSlots(schedules),
    };
  });
}

export default function YearlyCourses({ data }: YearlyCoursesProps) {
  const [mode, setMode] = useState<TimelineMode>("instructor");
  const [targetId, setTargetId] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const [showDetailList, setShowDetailList] = useState(false);
  const year = getYearRange(getKstNow());

  const categories = useMemo(() => ["all", ...unique(data.courses.map((course) => course.category || "기타"))], [data.courses]);
  const statuses = useMemo(() => ["all", ...unique(data.courses.map((course) => course.status || "상태 미정"))], [data.courses]);

  const targetOptions = useMemo(() => {
    if (mode === "instructor") {
      return data.instructors
        .filter((instructor) => instructor.is_active)
        .map((instructor) => ({ id: instructor.instructor_id, label: instructor.instructor_name }));
    }
    if (mode === "room") {
      return data.rooms.filter((room) => room.is_active).map((room) => ({ id: room.room_id, label: room.room_name }));
    }
    return data.courses.map((course) => ({ id: course.course_id, label: course.course_name }));
  }, [data.courses, data.instructors, data.rooms, mode]);

  const allItems = useMemo(() => {
    if (mode === "course") return buildCourseItems(data, year.start, year.end);
    return buildGroupedScheduleItems(data, mode, year.start, year.end);
  }, [data, mode, year.end, year.start]);

  const normalizedQuery = query.trim().toLowerCase();
  const items = allItems
    .filter((item) => targetId === "all" || item.modeId === targetId)
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => slotFilter === "all" || item.slots.includes(slotFilter))
    .filter(
      (item) =>
        !normalizedQuery ||
        [item.title, item.subject, item.detail, item.memo].some((value) => value.toLowerCase().includes(normalizedQuery)),
    )
    .sort((a, b) => `${formatDateKey(a.start)}${a.title}${a.subject}`.localeCompare(`${formatDateKey(b.start)}${b.title}${b.subject}`));

  const modeLabel = modeOptions.find((item) => item.key === mode)?.label || "운영 기준";

  return (
    <section className="space-y-5">
      <AnnualOccupancyInfographic data={data} />

      <div className="rounded-[24px] bg-white p-5 shadow-toss">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-toss-gray-primary">상세 검색 목록</h2>
            <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">
              필요한 경우에만 과정, 상태, 시간대별 상세 리스트를 펼쳐 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDetailList((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-toss-gray-primary px-4 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showDetailList ? "상세 목록 접기" : "상세 목록 열기"}
          </button>
        </div>
      </div>

      {showDetailList ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Timeline className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">연간 운영 타임라인</h2>
              <p className="text-sm text-slate-500">{format(year.start, "yyyy년")} · 강사/강의실/과정 기준으로 이어지는 운영 기간과 시간대를 봅니다.</p>
            </div>
          </div>
          <div className="grid gap-3 xl:w-[760px]">
            <div className="grid gap-2 sm:grid-cols-3">
              {modeOptions.map((item) => {
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
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                      active ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_170px_140px_130px_130px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="과정명, 강사, 강의실 검색"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
                />
              </label>
              <select
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                aria-label={mode === "instructor" ? "강사 선택" : mode === "room" ? "강의실 선택" : "과정 선택"}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">{mode === "instructor" ? "전체 강사" : mode === "room" ? "전체 강의실" : "전체 과정"}</option>
                {targetOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="분야 선택"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "전체 분야" : item}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="상태 선택"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "전체 상태" : item}
                  </option>
                ))}
              </select>
              <select
                value={slotFilter}
                onChange={(event) => setSlotFilter(event.target.value as SlotFilter)}
                aria-label="시간대 선택"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">전체 시간대</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.key} value={slot.key}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <SlidersHorizontal className="h-4 w-4" />
            {modeLabel} · {items.length}개 운영 구간 표시
          </div>
          <div className="hidden grid-cols-12 text-center text-xs font-bold text-slate-400 lg:grid lg:w-[58%]">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index}>{index + 1}월</span>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState title="조건에 맞는 운영 구간이 없습니다." description="검색어 또는 필터를 조정해 주세요." />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const style = categoryStyle(item.category);
              const { left, width } = timelinePosition(item.start, item.end, year.start, year.end);

              return (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[minmax(320px,42%)_1fr] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("ring-0", style.soft, style.text)}>{item.category}</Badge>
                      <Badge className="bg-white text-slate-600 ring-slate-200">{item.status}</Badge>
                      <Badge className="bg-blue-50 text-blue-700 ring-blue-200">{formatMonthSpan(item.start, item.end)}</Badge>
                      {item.slots.map((slotKey) => {
                        const slot = TIME_SLOTS.find((timeSlot) => timeSlot.key === slotKey);
                        if (!slot) return null;
                        return (
                          <Badge key={slotKey} className={cn("ring-0", slotToneClass(slotKey))}>
                            {slot.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <h3 className="mt-3 break-words text-base font-black leading-snug text-slate-950">{item.title}</h3>
                    <p className="mt-1 break-words text-sm font-bold leading-snug text-slate-700">{item.subject}</p>
                    <p className="mt-2 break-words text-sm leading-relaxed text-slate-500">
                      {formatDateKey(item.start)} - {formatDateKey(item.end)} · {item.detail}
                    </p>
                    {item.memo ? <p className="mt-2 rounded-xl bg-white p-2 text-xs font-semibold text-purple-700">{item.memo}</p> : null}
                  </div>
                  <div className="relative h-16 rounded-2xl bg-white ring-1 ring-slate-100">
                    <div className="absolute inset-y-0 grid w-full grid-cols-12">
                      {Array.from({ length: 12 }, (_, index) => (
                        <div key={index} className="border-r border-slate-100 last:border-r-0" />
                      ))}
                    </div>
                    <div
                      className={cn("absolute top-1/2 flex h-7 min-w-16 -translate-y-1/2 items-center rounded-full px-3 text-xs font-black text-white shadow-sm", style.bar)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="whitespace-nowrap">{formatMonthSpan(item.start, item.end)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
        </>
      ) : null}
    </section>
  );
}

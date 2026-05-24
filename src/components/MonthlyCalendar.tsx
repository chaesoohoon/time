"use client";

import { useMemo, useState } from "react";
import { addMonths, format, isSameDay, isSameMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { Building2, CalendarRange, ChevronDown, ChevronLeft, ChevronRight, Layers3, Search, UserRound, X } from "lucide-react";
import type { JoinedSchedule, SheetData } from "@/types";
import {
  formatDateKey,
  formatKoreanDate,
  getKoreanDayOfWeek,
  getKstNow,
  getMonthCalendarRange,
  getMonthRange,
  isSaturdayDate,
  isSundayDate,
  parseDate,
} from "@/lib/dateUtils";
import { getClosuresForDate, isRoomClosed } from "@/lib/closureUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, slotToneClass, type TimeSlot, type TimeSlotKey } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import PeriodOccupancyInfographic from "./PeriodOccupancyInfographic";

type MonthlyCalendarProps = {
  data: SheetData;
};

type ViewMode = "instructor" | "room";
type SlotFilter = "all" | TimeSlotKey;

function dateLabel(date: Date) {
  return format(date, "M.d");
}

function overlapsMonth(startText: string, endText: string, monthStart: Date, monthEnd: Date) {
  const start = parseDate(startText);
  const end = parseDate(endText);
  if (!start || !end) return null;
  if (start > monthEnd || end < monthStart) return null;
  return {
    start,
    end,
    clampedStart: new Date(Math.max(start.getTime(), monthStart.getTime())),
    clampedEnd: new Date(Math.min(end.getTime(), monthEnd.getTime())),
  };
}

function percentInMonth(date: Date, monthStart: Date, monthEnd: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.floor((monthEnd.getTime() - monthStart.getTime()) / dayMs) + 1);
  const offset = Math.max(0, Math.floor((date.getTime() - monthStart.getTime()) / dayMs));
  return (offset / totalDays) * 100;
}

function scheduleTextMatches(schedule: JoinedSchedule, query: string) {
  if (!query) return true;
  return [schedule.courseName, schedule.instructorName, schedule.roomName, schedule.category, schedule.memo]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function monthScheduleCard(schedule: JoinedSchedule, mode: ViewMode) {
  const style = categoryStyle(schedule.category);
  return (
    <article key={`${schedule.schedule_id}-${schedule.date}`} className="rounded-[14px] bg-white p-3 ring-1 ring-toss-border">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} />
        <span className="shrink-0 text-[11px] font-black text-toss-gray-secondary">
          {schedule.start_time}-{schedule.end_time}
        </span>
      </div>
      <p className="mt-1 break-words text-xs font-black leading-snug text-toss-gray-primary">{schedule.courseName}</p>
      <p className="mt-1 break-words text-[11px] font-bold text-toss-gray-secondary">
        {mode === "instructor" ? schedule.roomName : schedule.instructorName}
      </p>
    </article>
  );
}

function getAvailableRooms(data: SheetData, date: Date, slot: TimeSlot, dayItems: JoinedSchedule[], targetRoomId: string) {
  return data.rooms
    .filter((room) => room.is_active)
    .filter((room) => targetRoomId === "all" || room.room_id === targetRoomId)
    .filter((room) => {
      if (isRoomClosed(room.room_id, date, slot.start, slot.end, data.closures)) return false;
      return !dayItems.some((schedule) => schedule.room_id === room.room_id && scheduleOverlapsTimeSlot(schedule, slot));
    });
}

export default function MonthlyCalendar({ data }: MonthlyCalendarProps) {
  const [baseDate, setBaseDate] = useState(getKstNow());
  const [selectedDate, setSelectedDate] = useState(getKstNow());
  const [mode, setMode] = useState<ViewMode>("instructor");
  const [targetId, setTargetId] = useState("all");
  const [category, setCategory] = useState("all");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [query, setQuery] = useState("");
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const [showMonthFlow, setShowMonthFlow] = useState(false);
  const calendarRange = getMonthCalendarRange(baseDate);
  const monthRange = getMonthRange(baseDate);

  const schedules = useMemo(
    () =>
      expandSchedulesByDate(data.schedules, calendarRange).map((schedule) =>
        joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
      ),
    [calendarRange, data],
  );

  const categories = useMemo(() => ["all", ...Array.from(new Set(data.courses.map((course) => course.category || "기타")))], [data.courses]);
  const targetOptions = useMemo(() => {
    if (mode === "instructor") {
      return data.instructors
        .filter((instructor) => instructor.is_active)
        .map((instructor) => ({ id: instructor.instructor_id, label: instructor.instructor_name }));
    }
    return data.rooms.filter((room) => room.is_active).map((room) => ({ id: room.room_id, label: room.room_name }));
  }, [data.instructors, data.rooms, mode]);

  const visibleSlots = TIME_SLOTS.filter((slot) => slotFilter === "all" || slot.key === slotFilter);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSchedules = schedules.filter((schedule) => {
    if (category !== "all" && schedule.category !== category) return false;
    if (mode === "instructor" && targetId !== "all" && schedule.instructor_id !== targetId) return false;
    if (mode === "room" && targetId !== "all" && schedule.room_id !== targetId) return false;
    if (slotFilter !== "all" && !scheduleOverlapsTimeSlot(schedule, TIME_SLOTS.find((slot) => slot.key === slotFilter)!)) return false;
    return scheduleTextMatches(schedule, normalizedQuery);
  });

  const flowItems = useMemo(
    () =>
      data.schedules
        .map((schedule) => {
          const range = overlapsMonth(schedule.start_date, schedule.end_date, monthRange.start, monthRange.end);
          if (!range) return null;
          const course = data.courses.find((item) => item.course_id === schedule.course_id) || null;
          const room = data.rooms.find((item) => item.room_id === schedule.room_id) || null;
          const instructor = data.instructors.find((item) => item.instructor_id === schedule.instructor_id) || null;
          return {
            schedule,
            courseName: course?.course_name || "미확인 과정",
            category: course?.category || "기타",
            roomName: room?.room_name || "미확인 강의실",
            instructorName: instructor?.instructor_name || "미확인 강사",
            ...range,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (!a || !b) return 0;
          return `${formatDateKey(a.clampedStart)}${a.schedule.start_time}${a.courseName}`.localeCompare(
            `${formatDateKey(b.clampedStart)}${b.schedule.start_time}${b.courseName}`,
          );
        }),
    [data, monthRange.end, monthRange.start],
  );

  const selectedSchedules = filteredSchedules.filter((schedule) => schedule.date === formatDateKey(selectedDate));
  const selectedClosures = getClosuresForDate(selectedDate, data.closures);
  const activeDayCount = new Set(filteredSchedules.map((schedule) => schedule.date)).size;
  const overviewDates = monthRange.dates.filter((date) => {
    if (mode === "room" && targetId !== "all") return true;
    const key = formatDateKey(date);
    return filteredSchedules.some((schedule) => schedule.date === key);
  });

  return (
    <section className={cn("grid gap-6", showDailyDetails ? "xl:grid-cols-[1fr_380px]" : "")}>
      <div className="space-y-6">
        {/* Month Switcher Card */}
        <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-purple-50 text-purple-600">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-toss-gray-primary">월간 시간표</h2>
                <p className="text-sm font-semibold text-toss-gray-tertiary">{format(baseDate, "yyyy년 M월", { locale: ko })}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBaseDate(subMonths(baseDate, 1))}
                className="rounded-[12px] bg-toss-bg p-3 text-toss-gray-secondary transition-all hover:bg-toss-border hover:text-toss-gray-primary active:scale-[0.96]"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = getKstNow();
                  setBaseDate(today);
                  setSelectedDate(today);
                }}
                className="rounded-[12px] bg-toss-blue-light px-4 py-2.5 text-sm font-bold text-toss-blue transition-all hover:bg-[#d6e9ff] active:scale-[0.96]"
              >
                오늘로 이동
              </button>
              <button
                type="button"
                onClick={() => setBaseDate(addMonths(baseDate, 1))}
                className="rounded-[12px] bg-toss-bg p-3 text-toss-gray-secondary transition-all hover:bg-toss-border hover:text-toss-gray-primary active:scale-[0.96]"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <PeriodOccupancyInfographic
          data={data}
          defaultMode={mode}
          period="month"
          range={monthRange}
          title="월간 운영 지도"
          subtitle={`${format(baseDate, "yyyy년 M월", { locale: ko })} · 강의실/강사별 오전·오후·저녁 배정 흐름`}
        />

        <div className="rounded-[24px] bg-white p-5 shadow-toss border-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-toss-gray-primary">일자별 상세 보기</h3>
              <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">
                월간 운영 지도만 먼저 보고, 날짜별 카드와 달력은 필요할 때만 펼칩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDailyDetails((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-toss-gray-primary px-4 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
              aria-expanded={showDailyDetails}
            >
              {showDailyDetails ? "상세 닫기" : "상세 열기"}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showDailyDetails ? "rotate-180" : "")} aria-hidden="true" />
            </button>
          </div>
          {!showDailyDetails ? (
            <p className="mt-4 rounded-[18px] bg-toss-bg p-4 text-sm font-bold text-toss-gray-secondary">
              날짜별 상세 목록은 접어두었습니다. 한 달 흐름은 위 운영 지도에서 먼저 확인하세요.
            </p>
          ) : null}
        </div>

        {showDailyDetails ? (
        <>
        {/* Monthly Slot Overview */}
        <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
                {mode === "instructor" ? <UserRound className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-toss-gray-primary">월간 시간대 현황</h3>
                <p className="text-sm font-semibold text-toss-gray-tertiary">
                  강사 또는 강의실 기준으로 오전, 오후, 저녁에 무엇이 운영되는지 한 달 단위로 봅니다.
                </p>
              </div>
            </div>
            <div className="grid gap-2 rounded-[16px] bg-toss-bg p-1.5 sm:grid-cols-2 xl:w-[260px]">
              {[
                { key: "instructor" as const, label: "강사 기준", icon: UserRound },
                { key: "room" as const, label: "강의실 기준", icon: Building2 },
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
                      "flex items-center justify-center gap-1.5 rounded-[12px] px-3 py-2 text-xs font-black transition",
                      active ? "bg-white text-toss-blue shadow-sm" : "text-toss-gray-secondary hover:text-toss-gray-primary",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_150px_150px]">
            <label className="relative">
              <span className="sr-only">과정, 강사, 강의실 검색</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="과정명, 강사, 강의실 검색"
                className="w-full rounded-[12px] bg-toss-bg py-3 pl-9 pr-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
              />
            </label>
            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              aria-label={mode === "instructor" ? "강사 선택" : "강의실 선택"}
              className="rounded-[12px] bg-toss-bg px-3 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              <option value="all">{mode === "instructor" ? "전체 강사" : "전체 강의실"}</option>
              {targetOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={slotFilter}
              onChange={(event) => setSlotFilter(event.target.value as SlotFilter)}
              aria-label="시간대 선택"
              className="rounded-[12px] bg-toss-bg px-3 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              <option value="all">전체 시간대</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="분야 선택"
              className="rounded-[12px] bg-toss-bg px-3 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "전체 분야" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] bg-toss-bg p-4">
              <p className="text-xs font-bold text-toss-gray-secondary">표시 일정</p>
              <p className="mt-1 text-2xl font-black text-toss-gray-primary">{filteredSchedules.length}건</p>
            </div>
            <div className="rounded-[18px] bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">일정 있는 날짜</p>
              <p className="mt-1 text-2xl font-black text-blue-900">{activeDayCount}일</p>
            </div>
            <div className="rounded-[18px] bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-700">현재 기준</p>
              <p className="mt-1 text-base font-black text-emerald-900">{mode === "instructor" ? "강사별 월간 보기" : "강의실별 비어 있음 보기"}</p>
            </div>
          </div>

          {filteredSchedules.length === 0 && mode === "instructor" ? (
            <div className="mt-5">
              <EmptyState title="조건에 맞는 월간 수업이 없습니다." description="강사, 시간대, 검색어를 조정해 주세요." />
            </div>
          ) : null}

          {overviewDates.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="표시할 날짜가 없습니다." description="검색어나 필터를 조정해 주세요." />
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {overviewDates.map((date) => {
              const dayKey = formatDateKey(date);
              const dayItems = filteredSchedules.filter((schedule) => schedule.date === dayKey);
              const allDayItems = schedules.filter((schedule) => schedule.date === dayKey);
              const isToday = isSameDay(date, getKstNow());
              const isSaturday = isSaturdayDate(date);
              const isSunday = isSundayDate(date);

              return (
                <article
                  key={dayKey}
                  className={cn(
                    "rounded-[22px] p-4",
                    isSunday ? "bg-rose-50/80 ring-1 ring-rose-100" : isSaturday ? "bg-sky-50/80 ring-1 ring-sky-100" : "bg-toss-bg",
                    isToday ? "ring-2 ring-toss-blue/30" : "",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className="mb-3 flex w-full items-center justify-between rounded-[16px] bg-white px-4 py-3 text-left transition hover:shadow-sm"
                  >
                    <div>
                      <p
                        className={cn(
                          "text-base font-black",
                          isSunday ? "text-rose-600" : isSaturday ? "text-sky-600" : "text-toss-gray-primary",
                          isToday ? "text-toss-blue" : "",
                        )}
                      >
                        {format(date, "M월 d일")} {getKoreanDayOfWeek(date)}
                      </p>
                      <p className="text-xs font-bold text-toss-gray-tertiary">눌러서 오른쪽 상세 일정 확인</p>
                    </div>
                    <Badge
                      className={cn(
                        "ring-0",
                        isSunday ? "bg-rose-50 text-rose-600" : isSaturday ? "bg-sky-50 text-sky-600" : "bg-toss-bg text-toss-gray-secondary",
                      )}
                    >
                      {dayItems.length}건
                    </Badge>
                  </button>

                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
                    {visibleSlots.map((slot) => {
                      const slotItems = dayItems.filter((schedule) => scheduleOverlapsTimeSlot(schedule, slot));
                      const availableRooms = mode === "room" ? getAvailableRooms(data, date, slot, allDayItems, targetId) : [];
                      const hiddenCount = Math.max(0, slotItems.length - 2);

                      return (
                        <div key={slot.key} className="rounded-[18px] bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", slotToneClass(slot.key))}>{slot.label}</span>
                            <span className="text-[10px] font-bold text-toss-gray-tertiary">{slot.description}</span>
                          </div>
                          <div className="space-y-2">
                            {slotItems.slice(0, 2).map((schedule) => monthScheduleCard(schedule, mode))}
                            {hiddenCount > 0 ? (
                              <p className="rounded-[14px] bg-toss-bg px-3 py-2 text-xs font-black text-toss-gray-secondary">외 {hiddenCount}건 더 있음</p>
                            ) : null}
                            {mode === "room" && availableRooms.length > 0 ? (
                              <div className="rounded-[16px] bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
                                <p className="text-xs font-black">비어 있음 {availableRooms.length}개</p>
                                <p className="mt-1 break-words text-[11px] font-bold leading-relaxed">
                                  {availableRooms.slice(0, 4).map((room) => room.room_name).join(", ")}
                                  {availableRooms.length > 4 ? ` 외 ${availableRooms.length - 4}개` : ""}
                                </p>
                              </div>
                            ) : null}
                            {slotItems.length === 0 && mode === "instructor" ? (
                              <p className="rounded-[16px] bg-toss-bg p-3 text-xs font-bold text-toss-gray-tertiary">수업 없음</p>
                            ) : null}
                            {slotItems.length === 0 && mode === "room" && availableRooms.length === 0 ? (
                              <p className="rounded-[16px] bg-rose-50 p-3 text-xs font-bold text-rose-700">사용 중 또는 제한</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-toss border-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-toss-blue-light text-toss-blue">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-toss-gray-primary">월간 과정 흐름</h3>
                <p className="text-sm font-semibold text-toss-gray-tertiary">필요할 때만 과정별 기간 막대를 펼쳐 봅니다.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMonthFlow((current) => !current)}
              className="rounded-[14px] bg-toss-gray-primary px-4 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
            >
              {showMonthFlow ? "과정 흐름 접기" : "과정 흐름 열기"}
            </button>
          </div>
        </div>

        {showMonthFlow ? (
        <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
                <Layers3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-toss-gray-primary">월간 과정 흐름</h3>
                <p className="text-sm font-semibold text-toss-gray-tertiary">같은 과정이 월 안에서 이어지는 기간을 직관적인 타임라인으로 점검합니다.</p>
              </div>
            </div>
            <Badge className="border-0 ring-0 bg-toss-bg px-3.5 py-1.5 font-bold text-toss-gray-secondary">{flowItems.length}개 운영 흐름</Badge>
          </div>

          {flowItems.length === 0 ? (
            <EmptyState title="이 달에 이어지는 과정이 없습니다." description="다른 달로 이동하거나 schedules 시트를 확인해 주세요." />
          ) : (
            <div className="space-y-4">
              <div className="hidden grid-cols-6 text-center text-xs font-bold text-toss-gray-tertiary md:grid md:pl-[320px]">
                {[1, 6, 11, 16, 21, 26].map((day) => (
                  <span key={day}>{day}일</span>
                ))}
              </div>
              {flowItems.map((item) => {
                if (!item) return null;
                const style = categoryStyle(item.category);
                const left = percentInMonth(item.clampedStart, monthRange.start, monthRange.end);
                const end = percentInMonth(item.clampedEnd, monthRange.start, monthRange.end);
                const width = Math.max(4, end - left + 3);

                return (
                  <article
                    key={item.schedule.schedule_id}
                    className="grid gap-4 rounded-[20px] bg-toss-bg p-5 md:grid-cols-[300px_1fr] md:items-center transition-all hover:scale-[1.005]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("border-0 ring-0 px-2.5 py-1 text-[11px] font-bold", style.soft, style.text)}>{item.category}</Badge>
                        <Badge className="border-0 ring-0 bg-white text-toss-gray-secondary px-2.5 py-1 text-[11px] font-bold">
                          {dateLabel(item.start)} - {dateLabel(item.end)}
                        </Badge>
                      </div>
                      <h4 className="mt-2 text-base font-extrabold leading-snug text-toss-gray-primary">{item.courseName}</h4>
                      <p className="mt-1.5 text-xs font-semibold leading-relaxed text-toss-gray-secondary">
                        {item.schedule.days_of_week || "요일 확인 필요"} · {item.schedule.start_time}-{item.schedule.end_time} · {item.roomName} · {item.instructorName}
                      </p>
                    </div>
                    <div className="relative h-12 rounded-[14px] bg-white">
                      <div className="absolute inset-0 grid grid-cols-6">
                        {Array.from({ length: 6 }, (_, index) => (
                          <div key={index} className="border-r border-toss-border/50 last:border-r-0" />
                        ))}
                      </div>
                      <div
                        className={cn("absolute top-1/2 min-w-12 -translate-y-1/2 rounded-full px-3 py-1 text-[10px] font-black text-white shadow-sm flex items-center justify-center", style.bar)}
                        style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                      >
                        <span className="block whitespace-nowrap truncate">{item.schedule.start_time}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        ) : null}

        {/* Monthly Calendar Grid Card */}
        <div className="rounded-[24px] bg-white p-5 shadow-toss border-0">
          <div className="grid grid-cols-7 border-b border-toss-border pb-3 text-center text-xs font-bold text-toss-gray-secondary">
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
              <div
                key={day}
                className={cn(
                  "rounded-full py-1",
                  day === "토" ? "bg-sky-50 text-sky-600" : "",
                  day === "일" ? "bg-rose-50 text-rose-600" : "",
                )}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-7">
            {calendarRange.dates.map((date) => {
              const key = formatDateKey(date);
              const items = schedules.filter((schedule) => schedule.date === key);
              const closureCount = getClosuresForDate(date, data.closures).length;
              const isToday = isSameDay(date, getKstNow());
              const isSelected = isSameDay(date, selectedDate);
              const inCurrentMonth = isSameMonth(date, baseDate);
              const isSaturday = isSaturdayDate(date);
              const isSunday = isSundayDate(date);

              // To make it extremely clean and prevent visual clutter/overflow inside cell buttons,
              // we only show up to 2 items and summarize the rest.
              const maxVisible = 2;
              const visibleItems = items.slice(0, maxVisible);
              const remainingCount = items.length - maxVisible;

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "min-h-[110px] sm:min-h-[120px] rounded-[20px] p-3 text-left transition-all duration-200 outline-none flex flex-col justify-between border",
                    inCurrentMonth
                      ? isSunday
                        ? "bg-rose-50/70 border-rose-100 hover:border-rose-200 hover:bg-rose-50"
                        : isSaturday
                          ? "bg-sky-50/70 border-sky-100 hover:border-sky-200 hover:bg-sky-50"
                          : "bg-white border-[#f2f4f6] hover:border-toss-blue/40 hover:bg-toss-bg/30"
                      : "bg-[#f9fafb]/50 border-[#f2f4f6]/50 text-toss-gray-tertiary opacity-45",
                    isSelected ? "ring-2 ring-toss-blue border-toss-blue bg-toss-blue/5 shadow-sm" : "",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    {isToday ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-toss-blue text-xs font-bold text-white shadow-sm">
                        {format(date, "d")}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isSunday ? "text-rose-600" : isSaturday ? "text-sky-600" : "text-toss-gray-primary",
                          isSelected ? "text-toss-blue" : "",
                        )}
                      >
                        {format(date, "d")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[10px] font-bold sm:hidden",
                        isSunday ? "text-rose-500" : isSaturday ? "text-sky-500" : "text-toss-gray-tertiary",
                      )}
                    >
                      {getKoreanDayOfWeek(date)}
                    </span>
                  </div>
                  
                  <div className="mt-2 w-full space-y-1 overflow-hidden">
                    {visibleItems.map((schedule) => {
                      const style = categoryStyle(schedule.category);
                      return (
                        <div
                          key={`${schedule.schedule_id}-${schedule.date}`}
                          className={cn("flex items-start gap-1 rounded-[8px] px-1.5 py-1 text-[9px] font-bold leading-snug w-full", style.soft, style.text)}
                        >
                          <span className={cn("mt-1 h-1 w-1 shrink-0 rounded-full", style.dot)} />
                          <span className="break-words">{schedule.start_time} {schedule.courseName}</span>
                        </div>
                      );
                    })}
                    
                    {remainingCount > 0 ? (
                      <div className="text-[9px] font-bold text-toss-gray-secondary pl-1.5">
                        + {remainingCount}개 더보기
                      </div>
                    ) : null}
                    
                    {closureCount ? (
                      <div className="rounded-[6px] bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-600 truncate w-full flex items-center gap-1">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-purple-500" />
                        <span className="truncate">제한 {closureCount}건</span>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </>
        ) : null}
      </div>

      {/* Selected Day Detail Sidebar */}
      {showDailyDetails ? (
      <aside className="rounded-[24px] bg-white p-6 shadow-toss border-0 xl:sticky xl:top-[100px] xl:self-start transition-all duration-300">
        <div className="flex items-start justify-between gap-3 border-b border-toss-border pb-4">
          <div>
            <p className="text-xs font-bold text-toss-gray-tertiary">선택 날짜 일정</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-toss-gray-primary">{formatKoreanDate(selectedDate)}</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(getKstNow())}
            className="rounded-full bg-toss-bg p-2 text-toss-gray-secondary transition-all hover:bg-toss-border hover:text-toss-gray-primary active:scale-[0.90]"
            aria-label="오늘 선택"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {selectedSchedules.length === 0 && selectedClosures.length === 0 ? (
            <EmptyState title="이 날짜에는 일정이 없습니다." description="등록된 수업 또는 휴강/점검 정보가 없습니다." />
          ) : null}
          
          {selectedSchedules.map((schedule: JoinedSchedule) => {
            const style = categoryStyle(schedule.category);
            return (
              <div key={`${schedule.schedule_id}-${schedule.date}`} className="rounded-[20px] bg-toss-bg p-4.5 transition-all hover:scale-[1.01] hover:shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("border-0 ring-0 px-2.5 py-0.5 text-xs font-bold", style.soft, style.text)}>{schedule.category}</Badge>
                  <span className="text-sm font-bold text-toss-gray-primary">{schedule.start_time} - {schedule.end_time}</span>
                </div>
                <p className="mt-3 text-base font-extrabold leading-snug text-toss-gray-primary">{schedule.courseName}</p>
                <p className="mt-2 text-xs font-bold text-toss-gray-secondary">
                  {schedule.roomName} · 담당 {schedule.instructorName}
                </p>
                {schedule.memo ? (
                  <p className="mt-3 rounded-[12px] bg-white p-3 text-xs font-medium text-toss-gray-secondary border border-toss-border/50">
                    {schedule.memo}
                  </p>
                ) : null}
              </div>
            );
          })}
          
          {selectedClosures.map((closure) => (
            <div key={closure.closure_id} className="rounded-[20px] bg-purple-50 p-4.5 text-purple-800 transition-all hover:scale-[1.01]">
              <Badge className="border-0 ring-0 bg-white text-purple-700 px-2.5 py-0.5 text-xs font-bold">{closure.closure_type}</Badge>
              <p className="mt-3 text-sm font-extrabold">{closure.start_time} - {closure.end_time}</p>
              <p className="mt-1 text-xs font-medium text-purple-700">{closure.memo || "사용 제한 일정입니다."}</p>
            </div>
          ))}
        </div>
      </aside>
      ) : null}
    </section>
  );
}

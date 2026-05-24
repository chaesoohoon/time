"use client";

import { useMemo, useState } from "react";
import { addWeeks, format, isSameDay, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import { Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw, UserRound } from "lucide-react";
import type { JoinedSchedule, SheetData } from "@/types";
import { isRoomClosed } from "@/lib/closureUtils";
import { formatDateKey, getKoreanDayOfWeek, getKstNow, getWeekRange } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, slotToneClass, type TimeSlot, type TimeSlotKey } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import PeriodOccupancyInfographic from "./PeriodOccupancyInfographic";

type WeeklyScheduleProps = {
  data: SheetData;
};

type ViewMode = "instructor" | "room";
type SlotFilter = "all" | TimeSlotKey;

function instructorMatches(schedule: JoinedSchedule, instructorId: string) {
  if (instructorId === "all") return true;
  return schedule.instructor_id === instructorId;
}

function roomMatches(schedule: JoinedSchedule, roomId: string) {
  return roomId === "all" || schedule.room_id === roomId;
}

function scheduleCard(schedule: JoinedSchedule, mode: ViewMode) {
  const style = categoryStyle(schedule.category);
  return (
    <article key={`${schedule.schedule_id}-${schedule.date}`} className="rounded-[14px] bg-white p-3 shadow-sm ring-1 ring-toss-border">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} />
        <span className="shrink-0 text-[11px] font-black text-toss-gray-secondary">
          {schedule.start_time}-{schedule.end_time}
        </span>
      </div>
      <p className="mt-1 break-words text-xs font-black leading-snug text-toss-gray-primary">{schedule.courseName}</p>
      <p className="mt-1 break-words text-[11px] font-bold leading-relaxed text-toss-gray-secondary">
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

export default function WeeklySchedule({ data }: WeeklyScheduleProps) {
  const [baseDate, setBaseDate] = useState(getKstNow());
  const [mode, setMode] = useState<ViewMode>("instructor");
  const [targetId, setTargetId] = useState("all");
  const [category, setCategory] = useState("all");
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const [showDailyDetails, setShowDailyDetails] = useState(false);
  const week = getWeekRange(baseDate);

  const categories = useMemo(() => ["all", ...Array.from(new Set(data.courses.map((course) => course.category || "기타")))], [data.courses]);
  const targetOptions = mode === "instructor"
    ? data.instructors.filter((instructor) => instructor.is_active).map((instructor) => ({ id: instructor.instructor_id, label: instructor.instructor_name }))
    : data.rooms.filter((room) => room.is_active).map((room) => ({ id: room.room_id, label: room.room_name }));
  const visibleSlots = TIME_SLOTS.filter((slot) => slotFilter === "all" || slot.key === slotFilter);

  const weeklySchedules = useMemo(() => {
    const expanded = expandSchedulesByDate(data.schedules, week).map((schedule) =>
      joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
    );
    return expanded.filter((schedule) => {
      if (category !== "all" && schedule.category !== category) return false;
      if (mode === "instructor" && !instructorMatches(schedule, targetId)) return false;
      if (mode === "room" && !roomMatches(schedule, targetId)) return false;
      if (slotFilter !== "all" && !scheduleOverlapsTimeSlot(schedule, TIME_SLOTS.find((slot) => slot.key === slotFilter)!)) return false;
      return true;
    });
  }, [category, data, mode, slotFilter, targetId, week]);

  const resetFilters = () => {
    setTargetId("all");
    setCategory("all");
    setSlotFilter("all");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-toss-gray-primary">주간 시간대 현황</h2>
              <p className="text-sm font-semibold text-toss-gray-secondary">
                {format(week.start, "M월 d일", { locale: ko })} - {format(week.end, "M월 d일", { locale: ko })} · 오전/오후/저녁 기준
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setBaseDate(subWeeks(baseDate, 1))} className="rounded-[12px] bg-toss-bg p-3 text-toss-gray-secondary transition hover:bg-toss-border" aria-label="이전 주">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setBaseDate(getKstNow())} className="inline-flex items-center gap-2 rounded-[12px] bg-toss-blue-light px-4 py-2.5 text-sm font-bold text-toss-blue transition hover:bg-[#d6e9ff]">
              <RotateCcw className="h-4 w-4" />
              오늘로
            </button>
            <button type="button" onClick={() => setBaseDate(addWeeks(baseDate, 1))} className="rounded-[12px] bg-toss-bg p-3 text-toss-gray-secondary transition hover:bg-toss-border" aria-label="다음 주">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr_160px_160px_140px]">
          <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-toss-bg p-1.5">
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
          <label className="text-xs font-bold text-toss-gray-secondary">
            {mode === "instructor" ? "강사 선택" : "강의실 선택"}
            <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-1.5 w-full rounded-[12px] bg-toss-bg px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none focus:bg-white focus:ring-2 focus:ring-toss-blue">
              <option value="all">{mode === "instructor" ? "전체 강사" : "전체 강의실"}</option>
              {targetOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-toss-gray-secondary">
            시간대
            <select value={slotFilter} onChange={(event) => setSlotFilter(event.target.value as SlotFilter)} className="mt-1.5 w-full rounded-[12px] bg-toss-bg px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none focus:bg-white focus:ring-2 focus:ring-toss-blue">
              <option value="all">전체 시간대</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.key} value={slot.key}>{slot.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-toss-gray-secondary">
            분야
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full rounded-[12px] bg-toss-bg px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none focus:bg-white focus:ring-2 focus:ring-toss-blue">
              {categories.map((item) => (
                <option key={item} value={item}>{item === "all" ? "전체 분야" : item}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={resetFilters} className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-toss-gray-primary px-3 py-3 text-sm font-bold text-white transition hover:bg-toss-gray-secondary">
              <Filter className="h-4 w-4" />
              초기화
            </button>
          </div>
        </div>
      </div>

      <PeriodOccupancyInfographic
        data={data}
        defaultMode={mode}
        period="week"
        range={week}
        title="주간 운영 지도"
        subtitle={`${format(week.start, "M월 d일", { locale: ko })} - ${format(week.end, "M월 d일", { locale: ko })} · 강의실/강사별 오전·오후·저녁 배정 흐름`}
      />

      <div className="rounded-[24px] bg-white p-5 shadow-toss">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-toss-gray-primary">날짜별 상세 카드</h3>
            <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">필요할 때만 요일별 수업 카드를 펼쳐서 확인합니다.</p>
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
            현재는 주간 운영 지도만 표시 중입니다. 날짜별 전체 카드는 필요할 때만 열어 화면을 가볍게 봅니다.
          </p>
        ) : weeklySchedules.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="이번 주 조건에 맞는 수업이 없습니다." description="기준 또는 시간대 필터를 조정해 주세요." />
          </div>
        ) : (
      <div className="mt-5 grid gap-4 xl:grid-cols-7">
        {week.dates.map((date) => {
          const dayKey = formatDateKey(date);
          const isToday = isSameDay(date, getKstNow());
          const dayItems = weeklySchedules.filter((schedule) => schedule.date === dayKey);
          const allDayItems = expandSchedulesByDate(data.schedules, { start: date, end: date, dates: [date] }).map((schedule) =>
            joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
          );

          return (
            <section key={dayKey} className={cn("rounded-[24px] bg-white p-4 shadow-toss", isToday ? "ring-2 ring-toss-blue/30" : "")}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cn("text-base font-black", isToday ? "text-toss-blue" : "text-toss-gray-primary")}>{getKoreanDayOfWeek(date)}</p>
                  <p className="text-xs font-bold text-toss-gray-tertiary">{format(date, "M.d", { locale: ko })}</p>
                </div>
                <Badge className="bg-toss-bg text-toss-gray-secondary ring-0">{dayItems.length}건</Badge>
              </div>

              <div className="space-y-3">
                {visibleSlots.map((slot) => {
                  const slotItems = dayItems.filter((schedule) => scheduleOverlapsTimeSlot(schedule, slot));
                  const availableRooms = mode === "room" ? getAvailableRooms(data, date, slot, allDayItems, targetId) : [];
                  const previewLimit = targetId === "all" ? 2 : slotItems.length;
                  const visibleSlotItems = slotItems.slice(0, previewLimit);
                  const hiddenCount = Math.max(0, slotItems.length - visibleSlotItems.length);

                  return (
                    <div key={slot.key} className="rounded-[20px] bg-toss-bg p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", slotToneClass(slot.key))}>{slot.label}</span>
                        <span className="text-[10px] font-bold text-toss-gray-tertiary">{slot.description}</span>
                      </div>
                      <div className="space-y-2">
                        {visibleSlotItems.map((schedule) => scheduleCard(schedule, mode))}
                        {hiddenCount > 0 ? (
                          <p className="rounded-[16px] bg-white px-3 py-2 text-xs font-black text-toss-gray-secondary ring-1 ring-toss-border">
                            외 {hiddenCount}건 더 있음
                          </p>
                        ) : null}
                        {mode === "room" && availableRooms.length > 0 ? (
                          <div className="rounded-[18px] bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
                            <p className="text-xs font-black">비어 있음 {availableRooms.length}개</p>
                            <p className="mt-1 break-words text-[11px] font-bold leading-relaxed">
                              {availableRooms.slice(0, 5).map((room) => room.room_name).join(", ")}
                              {availableRooms.length > 5 ? ` 외 ${availableRooms.length - 5}개` : ""}
                            </p>
                          </div>
                        ) : null}
                        {slotItems.length === 0 && mode === "instructor" ? (
                          <p className="rounded-[18px] bg-white p-3 text-xs font-bold text-toss-gray-tertiary ring-1 ring-toss-border">수업 없음</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
        )}
      </div>
    </section>
  );
}

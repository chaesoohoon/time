"use client";

import { useState } from "react";
import { addMonths, format, isSameDay, isSameMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, BookOpenCheck, ChevronLeft, ChevronRight, Clock3, UserRound, UsersRound } from "lucide-react";
import type { JoinedSchedule, Schedule, SheetData } from "@/types";
import { detectInstructorConflicts } from "@/lib/conflictUtils";
import {
  formatDateKey,
  formatKoreanDate,
  getKstNow,
  getMonthCalendarRange,
  getMonthRange,
  humanizeDuration,
} from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, slotToneClass, type TimeSlotKey } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import StatCard from "./StatCard";

type InstructorViewProps = {
  data: SheetData;
  now: Date;
};

type SlotFilter = "all" | TimeSlotKey;

function compact(value: string) {
  return value.replace(/\s+/g, "");
}

function parseScheduleDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getInstructorName(data: SheetData, schedule: Pick<Schedule, "instructor_id">) {
  return data.instructors.find((instructor) => instructor.instructor_id === schedule.instructor_id)?.instructor_name || "미확인 강사";
}

function rawScheduleMatchesSelected(data: SheetData, schedule: Schedule, selectedInstructorIds: string[]) {
  const selected = data.instructors.filter((instructor) => selectedInstructorIds.includes(instructor.instructor_id));
  const scheduleInstructorName = compact(getInstructorName(data, schedule));
  return selected.some((instructor) => {
    const selectedName = compact(instructor.instructor_name);
    return schedule.instructor_id === instructor.instructor_id || (selectedName !== "미정" && scheduleInstructorName.includes(selectedName));
  });
}

function joinedScheduleMatchesSelected(schedule: JoinedSchedule, selectedNames: string[]) {
  const scheduleInstructorName = compact(schedule.instructorName);
  return selectedNames.some((name) => scheduleInstructorName.includes(compact(name)));
}

function findNearestInstructorMonth(data: SheetData, selectedInstructorIds: string[], now: Date) {
  const schedules = data.schedules
    .filter((schedule) => rawScheduleMatchesSelected(data, schedule, selectedInstructorIds))
    .map((schedule) => ({ start: parseScheduleDate(schedule.start_date), end: parseScheduleDate(schedule.end_date) }))
    .filter((item): item is { start: Date; end: Date } => Boolean(item.start && item.end))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const active = schedules.find((item) => item.start <= now && item.end >= now);
  if (active) return now;
  const upcoming = schedules.find((item) => item.end >= now);
  return upcoming?.start || schedules[0]?.start || now;
}

function formatMonthTitle(date: Date) {
  return format(date, "yyyy년 M월", { locale: ko });
}

export default function InstructorView({ data, now }: InstructorViewProps) {
  const instructors = data.instructors.filter((instructor) => instructor.is_active);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);
  const initialMonth = findNearestInstructorMonth(data, [], now);
  const [monthDate, setMonthDate] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialMonth);
  const [monthNotice, setMonthNotice] = useState(`${formatMonthTitle(initialMonth)} 표시 중`);
  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all");
  const selectedInstructors = instructors.filter((instructor) => selectedInstructorIds.includes(instructor.instructor_id));
  const selectedNames = selectedInstructors.map((instructor) => instructor.instructor_name);

  if (instructors.length === 0) {
    return <EmptyState title="등록된 강사가 없습니다." description="instructors 시트에 활성 강사를 추가해 주세요." />;
  }

  const monthRange = getMonthRange(monthDate);
  const calendarRange = getMonthCalendarRange(monthDate);
  const monthSchedules = expandSchedulesByDate(data.schedules, calendarRange)
    .map((schedule) => joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors))
    .filter((schedule) => joinedScheduleMatchesSelected(schedule, selectedNames));
  const selectedSlot = slotFilter === "all" ? null : TIME_SLOTS.find((slot) => slot.key === slotFilter) || null;
  const timeFilteredSchedules = selectedSlot
    ? monthSchedules.filter((schedule) => scheduleOverlapsTimeSlot(schedule, selectedSlot))
    : monthSchedules;
  const schedulesInMonth = timeFilteredSchedules.filter((schedule) => {
    const date = schedule.dateObj;
    return date >= monthRange.start && date <= monthRange.end;
  });
  const selectedSchedules = timeFilteredSchedules.filter((schedule) => schedule.date === formatDateKey(selectedDate));
  const assignedCourseIds = [
    ...new Set(
      data.schedules
        .filter((schedule) => rawScheduleMatchesSelected(data, schedule, selectedInstructorIds))
        .map((schedule) => schedule.course_id),
    ),
  ];
  const assignedCourses = assignedCourseIds.map((courseId) => data.courses.find((course) => course.course_id === courseId)).filter(Boolean);
  const conflicts = detectInstructorConflicts(data.schedules, data.instructors, data.courses).filter((conflict) =>
    selectedInstructors.some(
      (instructor) => conflict.target_id === instructor.instructor_id || compact(conflict.target_name).includes(compact(instructor.instructor_name)),
    ),
  );
  const totalMinutes = schedulesInMonth.reduce(
    (sum, schedule) => sum + Math.max(0, (schedule.endDateTime.getTime() - schedule.startDateTime.getTime()) / 60000),
    0,
  );
  const selectedLabel = selectedNames.length === 0 ? "선택된 강사 없음" : selectedNames.join(", ");
  const calendarSubtitle =
    selectedNames.length === 0 ? "강사를 선택하면 월간 수업표가 표시됩니다." : `${selectedLabel} 월간 수업표`;

  const toggleInstructor = (instructorId: string) => {
    setSelectedInstructorIds((current) => {
      if (current.includes(instructorId)) {
        return current.filter((id) => id !== instructorId);
      }
      return [...current, instructorId];
    });
    setMonthNotice("강사 선택이 변경되었습니다.");
  };

  const moveMonth = (direction: "prev" | "next") => {
    const nextMonth = direction === "prev" ? subMonths(monthDate, 1) : addMonths(monthDate, 1);
    setMonthDate(nextMonth);
    setSelectedDate(nextMonth);
    setMonthNotice(`${formatMonthTitle(nextMonth)}로 이동했습니다.`);
  };

  const moveToNearestMonth = () => {
    if (selectedInstructorIds.length === 0) {
      setMonthNotice("강사를 먼저 선택하면 수업 있는 달로 이동할 수 있습니다.");
      return;
    }

    const nearestMonth = findNearestInstructorMonth(data, selectedInstructorIds, getKstNow());
    setMonthDate(nearestMonth);
    setSelectedDate(nearestMonth);
    setMonthNotice(
      isSameMonth(nearestMonth, monthDate)
        ? `이미 ${formatMonthTitle(nearestMonth)}을 보고 있습니다.`
        : `${formatMonthTitle(nearestMonth)}로 이동했습니다.`,
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-toss-gray-primary">강사별 월간 일정</h2>
              <p className="text-sm font-semibold text-toss-gray-tertiary">강사 여러 명을 선택하여 통합 일정을 확인합니다.</p>
            </div>
          </div>
          <div className="w-full shrink-0 rounded-[20px] bg-toss-bg p-4 xl:w-[360px] space-y-3">
            <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
              <button
                type="button"
                onClick={() => moveMonth("prev")}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-toss-gray-secondary shadow-sm transition-all hover:bg-toss-bg hover:text-toss-gray-primary active:scale-[0.96]"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="rounded-[12px] bg-white px-4 py-2.5 text-center shadow-sm">
                <p className="text-[10px] font-bold text-toss-blue">현재 표시</p>
                <p className="text-base font-black text-toss-gray-primary">{formatMonthTitle(monthDate)}</p>
                <p className="text-xs font-semibold text-toss-gray-tertiary">이 달 수업 {schedulesInMonth.length}건</p>
              </div>
              <button
                type="button"
                onClick={() => moveMonth("next")}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-toss-gray-secondary shadow-sm transition-all hover:bg-toss-bg hover:text-toss-gray-primary active:scale-[0.96]"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={moveToNearestMonth}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-toss-blue py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-toss-blue-hover active:scale-[0.98]"
            >
              <BookOpenCheck className="h-4 w-4" />
              수업 있는 달로 이동
            </button>
            <p className="rounded-[12px] bg-toss-blue-light px-3 py-2 text-center text-xs font-bold text-toss-blue">
              {monthNotice}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[20px] bg-toss-bg p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-toss-gray-primary">강사 목록</p>
            <p className="mt-1 text-xs font-semibold text-toss-gray-tertiary">
              {selectedNames.length === 0 ? "조회할 강사를 선택해 주세요." : `선택된 강사: ${selectedLabel}`}
            </p>
          </div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
            {instructors.map((instructor) => {
              const selected = selectedInstructorIds.includes(instructor.instructor_id);
              return (
                <button
                  key={instructor.instructor_id}
                  type="button"
                  onClick={() => toggleInstructor(instructor.instructor_id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 active:scale-[0.96]",
                    selected
                      ? "bg-toss-blue text-white shadow-sm"
                      : "bg-white text-toss-gray-secondary border border-toss-border hover:bg-toss-border hover:text-toss-gray-primary",
                  )}
                >
                  {instructor.instructor_name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-[20px] bg-toss-bg p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-toss-gray-primary">시간대 필터</p>
              <p className="mt-1 text-xs font-semibold text-toss-gray-tertiary">오전, 오후, 저녁 중 필요한 시간만 좁혀 볼 수 있습니다.</p>
            </div>
            <select
              value={slotFilter}
              onChange={(event) => setSlotFilter(event.target.value as SlotFilter)}
              className="rounded-[12px] bg-white px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary shadow-sm outline-none transition focus:ring-2 focus:ring-toss-blue"
            >
              <option value="all">전체 시간대</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => (
              <span key={slot.key} className={cn("rounded-full px-3 py-1 text-xs font-black", slotToneClass(slot.key))}>
                {slot.label} {slot.description}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} title="선택 강사" value={selectedInstructors.length} description={selectedLabel} tone="blue" />
        <StatCard icon={BookOpenCheck} title="담당 과정" value={assignedCourses.length} description="선택 강사의 전체 담당 과정" tone="green" />
        <StatCard icon={Clock3} title="이번 달 수업" value={humanizeDuration(Math.round(totalMinutes))} description={`${schedulesInMonth.length}개 수업 일정`} tone="purple" />
        <StatCard icon={AlertTriangle} title="중복 배정" value={conflicts.length} description="같은 시간대 겹침" tone={conflicts.length ? "red" : "green"} />
      </div>

      {conflicts.length ? (
        <div className="rounded-[20px] bg-red-50 p-5 text-red-800 flex items-center gap-3 border-0">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-red-900">강사 일정 중복 경고</p>
            <p className="mt-1 text-sm font-semibold text-red-700">선택한 강사 중 동일 일자/시간에 여러 과목이 중복 배정되었습니다.</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="mb-5">
          <h3 className="text-xl font-black tracking-tight text-toss-gray-primary">강사 시간대 요약</h3>
          <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">
            선택한 강사가 이번 달 오전, 오후, 저녁에 어떤 수업을 맡는지 먼저 봅니다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {TIME_SLOTS.map((slot) => {
            const slotSchedules = schedulesInMonth.filter((schedule) => scheduleOverlapsTimeSlot(schedule, slot));
            const courseNames = [...new Set(slotSchedules.map((schedule) => schedule.courseName))];
            return (
              <article key={slot.key} className="rounded-[22px] bg-toss-bg p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-black", slotToneClass(slot.key))}>{slot.label}</span>
                  <span className="text-xs font-bold text-toss-gray-tertiary">{slot.description}</span>
                </div>
                <p className="mt-3 text-2xl font-black text-toss-gray-primary">{slotSchedules.length}건</p>
                <p className="mt-1 text-xs font-bold text-toss-gray-secondary">
                  {courseNames.length ? `${courseNames.length}개 과정 담당` : "이 시간대 수업 없음"}
                </p>
                <div className="mt-4 space-y-2">
                  {slotSchedules.slice(0, 3).map((schedule) => {
                    const style = categoryStyle(schedule.category);
                    return (
                      <div key={`${slot.key}-${schedule.schedule_id}-${schedule.date}`} className="rounded-[16px] bg-white p-3 ring-1 ring-toss-border">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                          <span className="text-[11px] font-black text-toss-gray-secondary">
                            {schedule.date} · {schedule.start_time}-{schedule.end_time}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm font-black leading-snug text-toss-gray-primary">{schedule.courseName}</p>
                        <p className="mt-1 text-xs font-bold text-toss-gray-secondary">{schedule.roomName}</p>
                      </div>
                    );
                  })}
                  {slotSchedules.length > 3 ? (
                    <p className="rounded-[14px] bg-white px-3 py-2 text-xs font-black text-toss-gray-secondary ring-1 ring-toss-border">
                      외 {slotSchedules.length - 3}건 더 있음
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-toss-gray-primary">
                {format(monthDate, "yyyy년 M월", { locale: ko })}
              </h3>
              <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">{calendarSubtitle}</p>
            </div>
            <Badge className="bg-toss-bg text-toss-gray-secondary font-bold ring-0">{schedulesInMonth.length}건</Badge>
          </div>

          <div className="grid grid-cols-7 border-b border-toss-border pb-3 text-center text-xs font-bold text-toss-gray-tertiary">
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 pt-4">
            {calendarRange.dates.map((date) => {
              const key = formatDateKey(date);
              const dayItems = timeFilteredSchedules.filter((schedule) => schedule.date === key);
              const isCurrentMonth = isSameMonth(date, monthDate);
              const isToday = isSameDay(date, now);
              const isSelected = isSameDay(date, selectedDate);
              
              // Grid cell display capping: Show up to 2 items in compact format
              const maxItems = 2;
              const visibleItems = dayItems.slice(0, maxItems);
              const hasMore = dayItems.length > maxItems;

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "min-h-[110px] rounded-[20px] p-3 text-left transition-all border-0 flex flex-col justify-between cursor-pointer",
                    isCurrentMonth ? "bg-white" : "bg-toss-bg/50 text-toss-gray-tertiary",
                    isToday ? "ring-2 ring-toss-blue/30 bg-toss-blue-light/10" : "shadow-sm bg-[#F9FAFB]/60",
                    isSelected ? "ring-2 ring-toss-blue" : "hover:bg-toss-bg",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn(
                      "text-xs font-bold", 
                      isToday ? "text-toss-blue" : isCurrentMonth ? "text-toss-gray-primary" : "text-toss-gray-tertiary"
                    )}>
                      {format(date, "d")}
                    </span>
                    {isToday && <span className="rounded-full bg-toss-blue px-1.5 py-0.5 text-[8px] font-bold text-white leading-none">오늘</span>}
                  </div>
                  
                  <div className="mt-2 space-y-1 w-full flex-grow overflow-hidden">
                    {visibleItems.map((schedule: JoinedSchedule) => {
                      const style = categoryStyle(schedule.category);
                      return (
                        <div 
                          key={`${schedule.schedule_id}-${schedule.date}`} 
                          className="flex items-center gap-1.5 rounded-[8px] bg-white px-2 py-1 shadow-sm border border-toss-border"
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
                          <span className="break-words text-[10px] font-bold leading-tight text-toss-gray-secondary">
                            {schedule.start_time} {schedule.courseName}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="mt-1 text-[9px] font-bold text-toss-blue bg-toss-blue-light rounded-[6px] px-1.5 py-0.5 w-fit leading-none">
                      +{dayItems.length - maxItems}건 더 보기
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <p className="text-xs font-bold text-toss-gray-tertiary uppercase tracking-wider">상세 일정</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-toss-gray-primary">{formatKoreanDate(selectedDate)}</h3>
            <div className="mt-5 space-y-3">
              {selectedSchedules.length === 0 ? (
                <EmptyState title="선택한 날짜에 수업이 없습니다." description="다른 날짜를 선택해 주세요." />
              ) : null}
              {selectedSchedules.map((schedule) => {
                const style = categoryStyle(schedule.category);
                return (
                  <article key={`${schedule.schedule_id}-${schedule.date}`} className="rounded-[20px] bg-[#F9FAFB] p-5 border-0 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("ring-0 font-bold", style.soft, style.text)}>{schedule.instructorName}</Badge>
                      <span className="text-sm font-extrabold text-toss-gray-primary">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                    <h4 className="mt-3.5 font-bold leading-snug text-toss-gray-primary">{schedule.courseName}</h4>
                    <p className="mt-2 text-xs font-semibold text-toss-gray-secondary">
                      {schedule.roomName} · <span className="text-toss-blue">{schedule.category}</span>
                    </p>
                    {schedule.memo && (
                      <div className="mt-3 rounded-[12px] bg-white border border-toss-border p-3 text-xs font-medium text-toss-gray-secondary leading-relaxed">
                        {schedule.memo}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <p className="text-xs font-bold text-toss-gray-tertiary uppercase tracking-wider">담당 과정 목록</p>
            <div className="mt-4 space-y-3">
              {assignedCourses.length === 0 ? (
                <p className="text-sm font-semibold text-toss-gray-tertiary text-center py-4">담당 과목 정보가 없습니다.</p>
              ) : null}
              {assignedCourses.slice(0, 6).map((course) =>
                course ? (
                  <div key={course.course_id} className="rounded-[16px] bg-toss-bg p-4 border-0 shadow-sm">
                    <p className="text-sm font-bold text-toss-gray-primary leading-snug">{course.course_name}</p>
                    <p className="mt-2 text-xs font-semibold text-toss-gray-tertiary">
                      {course.start_date} - {course.end_date}
                    </p>
                  </div>
                ) : null,
              )}
              {assignedCourses.length > 6 ? (
                <p className="text-xs font-bold text-toss-gray-tertiary text-center mt-2">
                  외 {assignedCourses.length - 6}개 과정이 더 있습니다.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { addDays } from "date-fns";
import { Building2, CalendarCheck2, Clock3, DoorOpen, NotebookPen } from "lucide-react";
import type { SheetData } from "@/types";
import { formatDateKey, getKoreanDayOfWeek, getMonthRange, getWeekRange, humanizeDuration } from "@/lib/dateUtils";
import { expandSchedulesByDate, findNextSchedule, getTodayRoomStatus, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { TIME_SLOTS, scheduleOverlapsTimeSlot, slotToneClass } from "@/lib/timeSlots";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import StatCard from "./StatCard";

type RoomViewProps = {
  data: SheetData;
  now: Date;
};

type RangeKey = "today" | "week" | "month" | "all";

function buildRange(range: RangeKey, now: Date, data: SheetData) {
  if (range === "today") return { start: now, end: now, dates: [now] };
  if (range === "week") return getWeekRange(now);
  if (range === "month") return getMonthRange(now);
  const dates = data.schedules.flatMap((schedule) => [schedule.start_date, schedule.end_date]).filter(Boolean).sort();
  const start = dates[0] ? new Date(dates[0]) : now;
  const end = dates.at(-1) ? new Date(dates.at(-1) as string) : addDays(now, 90);
  const list = Array.from({ length: Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  return { start, end, dates: list };
}

export default function RoomView({ data, now }: RoomViewProps) {
  const rooms = data.rooms.filter((room) => room.is_active);
  const [roomId, setRoomId] = useState(rooms[0]?.room_id || "");
  const [range, setRange] = useState<RangeKey>("week");
  const room = rooms.find((item) => item.room_id === roomId) || rooms[0];

  const schedules = room
    ? expandSchedulesByDate(
        data.schedules.filter((schedule) => schedule.room_id === room.room_id),
        buildRange(range, now, data),
      ).map((schedule) => joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors))
    : [];

  if (!room) {
    return <EmptyState title="등록된 강의실이 없습니다." description="rooms 시트에 활성 강의실을 추가해 주세요." />;
  }

  const status = getTodayRoomStatus(room, data.schedules, data.courses, data.instructors, data.closures, now);
  const next = findNextSchedule(room.room_id, now, schedules);
  const totalMinutes = schedules.reduce((sum, schedule) => sum + Math.max(0, (schedule.endDateTime.getTime() - schedule.startDateTime.getTime()) / 60000), 0);
  const notes = data.reviewNotes.filter((note) => schedules.some((schedule) => schedule.course_id === note.related_id || schedule.schedule_id === note.related_id));

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <label className="text-xs font-bold text-toss-gray-secondary">
            강의실 선택
            <select
              value={room.room_id}
              onChange={(event) => setRoomId(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] bg-toss-bg border-0 px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              {rooms.map((item) => (
                <option key={item.room_id} value={item.room_id}>
                  {item.room_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-toss-gray-secondary">
            기간
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RangeKey)}
              className="mt-1.5 w-full rounded-[12px] bg-toss-bg border-0 px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-toss-blue"
            >
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="all">전체 기간</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          title="현재 상태"
          value={status.label}
          description={status.message}
          tone={status.kind === "available" ? "green" : status.kind === "conflict" ? "red" : "blue"}
        />
        <StatCard
          icon={CalendarCheck2}
          title="표시 일정"
          value={schedules.length}
          description={`${range === "all" ? "전체" : "선택 기간"} 일정 수`}
          tone="slate"
        />
        <StatCard
          icon={Clock3}
          title="배정 시간"
          value={humanizeDuration(Math.round(totalMinutes))}
          description="선택 기간 수업 시간 합계"
          tone="purple"
        />
        <StatCard
          icon={NotebookPen}
          title="확인 필요"
          value={notes.length}
          description="관련 검토 메모"
          tone={notes.length ? "amber" : "green"}
        />
      </div>

      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="mb-5">
          <h2 className="text-xl font-black tracking-tight text-toss-gray-primary">강의실 시간대 요약</h2>
          <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">
            선택한 기간 동안 이 강의실이 오전, 오후, 저녁에 어떻게 쓰이는지 먼저 확인합니다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {TIME_SLOTS.map((slot) => {
            const slotSchedules = schedules.filter((schedule) => scheduleOverlapsTimeSlot(schedule, slot));
            const dayCount = new Set(slotSchedules.map((schedule) => schedule.date)).size;
            return (
              <article key={slot.key} className="rounded-[22px] bg-toss-bg p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-black", slotToneClass(slot.key))}>{slot.label}</span>
                  <span className="text-xs font-bold text-toss-gray-tertiary">{slot.description}</span>
                </div>
                <p className="mt-3 text-2xl font-black text-toss-gray-primary">{slotSchedules.length}건</p>
                <p className="mt-1 text-xs font-bold text-toss-gray-secondary">
                  {dayCount ? `선택 기간 ${dayCount}일 배정` : "선택 기간 이 시간대 비어 있음"}
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
                        <p className="mt-1 text-xs font-bold text-toss-gray-secondary">담당 {schedule.instructorName}</p>
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

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="h-fit rounded-[24px] bg-white p-6 shadow-toss border-0 space-y-4">
          <div className="rounded-[20px] bg-toss-bg p-5">
            <h2 className="text-xl font-bold tracking-tight text-toss-gray-primary">{room.room_name}</h2>
            <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">
              {room.room_type} · {room.floor || "층 정보 없음"}
            </p>
            <div className="mt-4 border-t border-toss-border pt-4">
              <p className="text-xs font-bold text-toss-gray-tertiary uppercase tracking-wider mb-1.5">장비 및 비품</p>
              <p className="text-sm font-semibold text-toss-gray-secondary leading-relaxed">
                {room.equipment || "등록된 장비 정보가 없습니다."}
              </p>
            </div>
          </div>
          
          <div className="rounded-[20px] bg-toss-blue-light p-5 text-toss-blue">
            <div className="flex items-center gap-2 font-bold text-sm">
              <DoorOpen className="h-4 w-4" />
              다음 일정
            </div>
            <p className="mt-2.5 text-sm font-bold leading-snug">
              {next ? `${next.date} ${next.start_time} · ${next.courseName}` : "오늘 남은 일정 없음"}
            </p>
          </div>

          {notes.length ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-toss-gray-secondary px-1">검토 필요 사항 ({notes.length})</p>
              {notes.slice(0, 4).map((note) => (
                <div key={note.id} className="rounded-[16px] bg-[#FFF9E6] p-4 text-xs text-[#A66E00]">
                  <p className="font-extrabold">{note.category}</p>
                  <p className="mt-1.5 font-medium leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="space-y-4">
          {schedules.length === 0 ? (
            <EmptyState title="선택한 기간에 등록된 수업이 없습니다." description="다른 기간을 선택하거나 schedules 시트를 확인해 주세요." />
          ) : null}
          {schedules.map((schedule) => (
            <article
              key={`${schedule.schedule_id}-${schedule.date}`}
              className="group rounded-[24px] bg-white p-6 shadow-toss border-0 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-toss-bg text-toss-gray-secondary font-bold ring-0">
                      {schedule.date} {getKoreanDayOfWeek(schedule.dateObj)}
                    </Badge>
                    <Badge className="bg-toss-blue-light text-toss-blue font-bold ring-0">
                      {schedule.start_time} - {schedule.end_time}
                    </Badge>
                    <Badge className="bg-white border border-toss-border text-toss-gray-secondary font-bold">
                      {schedule.status}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-toss-gray-primary group-hover:text-toss-blue transition-colors">
                    {schedule.courseName}
                  </h3>
                  <p className="mt-1.5 text-sm font-semibold text-toss-gray-secondary">
                    담당 강사 <span className="text-toss-gray-primary font-bold">{schedule.instructorName}</span>
                  </p>
                </div>
                <span className="text-xs font-bold text-toss-gray-tertiary">
                  {formatDateKey(schedule.dateObj)}
                </span>
              </div>
              {schedule.memo && (
                <div className="mt-4 rounded-[16px] bg-toss-bg p-4 text-sm font-medium text-toss-gray-secondary leading-relaxed">
                  {schedule.memo}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

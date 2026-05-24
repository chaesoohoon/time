"use client";

import { useMemo, useState } from "react";
import { SearchCheck, Timer, UsersRound } from "lucide-react";
import type { SheetData } from "@/types";
import { formatDateKey, getKstNow, humanizeDuration, minutesFromTime, parseDate } from "@/lib/dateUtils";
import { findAvailableRooms } from "@/lib/scheduleUtils";
import EmptyState from "./EmptyState";

type EmptyRoomFinderProps = {
  data: SheetData;
};

export default function EmptyRoomFinder({ data }: EmptyRoomFinderProps) {
  const today = formatDateKey(getKstNow());
  const [dateText, setDateText] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const date = parseDate(dateText) || getKstNow();

  const results = useMemo(
    () => findAvailableRooms(date, startTime, endTime, data.rooms, data.schedules, data.courses, data.instructors, data.closures),
    [data, date, endTime, startTime],
  );
  const requestMinutes = Math.max(0, minutesFromTime(endTime) - minutesFromTime(startTime));

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-600">
            <SearchCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-toss-gray-primary">빈 강의실 찾기</h2>
            <p className="text-sm font-semibold text-toss-gray-tertiary">휴강/점검과 다른 수업 시간대를 피해서 사용 가능한 강의실 목록을 검색합니다.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="text-xs font-bold text-toss-gray-secondary">
            날짜
            <input
              type="date"
              value={dateText}
              onChange={(event) => setDateText(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] bg-toss-bg border-0 px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
          </label>
          <label className="text-xs font-bold text-toss-gray-secondary">
            시작 시간
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] bg-toss-bg border-0 px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
          </label>
          <label className="text-xs font-bold text-toss-gray-secondary">
            종료 시간
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="mt-1.5 w-full rounded-[12px] bg-toss-bg border-0 px-3.5 py-2.5 text-sm font-bold text-toss-gray-primary outline-none transition-all focus:bg-white focus:ring-2 focus:ring-toss-blue"
            />
          </label>
          <div className="flex items-end">
            <div className="w-full rounded-[12px] bg-toss-bg px-4 py-3 text-sm font-bold text-toss-gray-secondary">
              요청 시간: {humanizeDuration(requestMinutes)}
            </div>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState title="선택한 시간에 사용 가능한 강의실이 없습니다." description="시간대를 조정하거나 일정을 다시 확인해 주세요." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ room, nextSchedule, usableText }) => (
            <article
              key={room.room_id}
              className="group rounded-[24px] bg-white p-6 shadow-toss border-0 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-toss-gray-primary group-hover:text-toss-blue transition-colors">{room.room_name}</h3>
                  <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">{room.room_type} · {room.floor || "층 정보 없음"}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">사용 가능</span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-[16px] bg-emerald-50/40 p-4 font-bold text-emerald-800 text-sm">
                  선택한 시간에 사용 가능
                </div>
                <div className="space-y-2 text-sm font-semibold text-toss-gray-secondary">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-toss-gray-tertiary" />
                    <span>{usableText} 사용 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-toss-gray-tertiary" />
                    <span>수용인원: {room.capacity ? `${room.capacity}명` : "미정"}</span>
                  </div>
                </div>
                {room.equipment && (
                  <p className="text-xs font-medium text-toss-gray-tertiary leading-relaxed border-t border-toss-border pt-3">
                    {room.equipment}
                  </p>
                )}
                <div className="rounded-[16px] bg-toss-bg p-4 text-xs font-semibold text-toss-gray-secondary leading-snug">
                  {nextSchedule ? `다음 일정: ${nextSchedule.start_time} 시작 · ${nextSchedule.courseName}` : "오늘 남은 일정 없음"}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

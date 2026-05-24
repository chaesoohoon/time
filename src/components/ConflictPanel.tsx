"use client";

import { AlertTriangle, CalendarClock } from "lucide-react";
import type { ScheduleConflict, SheetData } from "@/types";
import { detectInstructorConflicts, detectRoomConflicts } from "@/lib/conflictUtils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type ConflictPanelProps = {
  data: SheetData;
};

function ConflictCard({ conflict }: { conflict: ScheduleConflict }) {
  return (
    <article className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-red-50 text-red-700 ring-red-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              {conflict.type === "room" ? "강의실 중복" : "강사 중복"}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{conflict.date}</Badge>
            <Badge className="bg-white text-slate-600 ring-slate-200">{conflict.start_time} - {conflict.end_time}</Badge>
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-950">{conflict.target_name}</h3>
          <p className="mt-1 text-sm text-slate-500">관련 일정 ID: {conflict.schedules.map((schedule) => schedule.schedule_id).join(", ")}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-3 text-red-700">
          <CalendarClock className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {conflict.course_names.map((name, index) => (
          <p key={`${conflict.id}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            {name}
          </p>
        ))}
      </div>
      {conflict.memo ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{conflict.memo}</p> : null}
    </article>
  );
}

export default function ConflictPanel({ data }: ConflictPanelProps) {
  const roomConflicts = detectRoomConflicts(data.schedules, data.rooms, data.courses);
  const instructorConflicts = detectInstructorConflicts(data.schedules, data.instructors, data.courses);
  const conflicts = [...roomConflicts, ...instructorConflicts].sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">중복 예약 경고</h2>
            <p className="mt-1 text-sm text-slate-500">반복 일정을 실제 날짜별로 펼쳐 강의실과 강사 겹침을 검사합니다.</p>
          </div>
          <Badge className={conflicts.length ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}>
            {conflicts.length}건
          </Badge>
        </div>
      </div>

      {conflicts.length === 0 ? (
        <EmptyState title="중복 배정 경고가 없습니다." description="현재 schedules 기준으로 같은 시간대 중복이 발견되지 않았습니다." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {conflicts.map((conflict) => <ConflictCard key={conflict.id} conflict={conflict} />)}
        </div>
      )}
    </section>
  );
}

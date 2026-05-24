"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DoorClosed,
  DoorOpen,
  Hourglass,
  Layers3,
  NotebookTabs,
  TimerReset,
  Users,
} from "lucide-react";
import type { Room, RoomStatus, SheetData } from "@/types";
import { STATUS_STYLES } from "@/lib/constants";
import { detectInstructorConflicts, detectRoomConflicts } from "@/lib/conflictUtils";
import { formatTime } from "@/lib/dateUtils";
import { getTodayRoomStatus } from "@/lib/scheduleUtils";
import { compactName, cn } from "@/lib/utils";
import Badge from "./Badge";
import StatCard from "./StatCard";
import TimeSlotOverview from "./TimeSlotOverview";

type TodayRoomStatusProps = {
  data: SheetData;
  now: Date;
};

const ROOM_PREVIEW_LIMIT = 8;

function statusOrder(status: RoomStatus) {
  const order: Record<RoomStatus["kind"], number> = {
    conflict: 0,
    "ending-soon": 1,
    "in-use": 2,
    available: 3,
    closed: 4,
    "no-reservation": 5,
  };
  return order[status.kind];
}

function briefingMessage({
  inUse,
  available,
  endingSoon,
  noReservation,
}: {
  inUse: number;
  available: number;
  endingSoon: number;
  noReservation: number;
}) {
  if (endingSoon > 0) return `${endingSoon}개 강의실 수업이 곧 종료됩니다`;
  if (inUse > 0) return `${inUse}개 강의실에서 수업이 진행 중입니다`;
  if (available > 0) return `${available}개 강의실을 바로 사용할 수 있습니다`;
  if (noReservation > 0) return "오늘 예약이 없는 강의실이 있습니다";
  return "오늘 등록된 강의실 일정이 없습니다";
}

function CompactRoomStatusCard({ room, status }: { room: Room; status: RoomStatus }) {
  const style = STATUS_STYLES[status.kind];
  const current = status.currentSchedule;
  const next = status.nextSchedule;
  const hasAlert = status.kind === "conflict" || status.kind === "closed";

  return (
    <article
      className={cn(
        "rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-toss-border transition hover:-translate-y-0.5 hover:shadow-toss",
        status.kind === "conflict" ? "ring-2 ring-red-300" : "",
      )}
      aria-label={`${room.room_name} ${status.label}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-black text-toss-gray-primary">{room.room_name}</h3>
          <p className="mt-1 text-xs font-bold text-toss-gray-tertiary">
            {room.room_type || "강의실"} {room.floor ? `· ${room.floor}` : ""}
          </p>
        </div>
        <Badge className={cn("shrink-0 border-0 px-2.5 py-1 text-[11px] font-black ring-0", style.badge)}>
          {hasAlert ? <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" /> : null}
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 rounded-[16px] bg-toss-bg p-3">
        <p className="flex items-center gap-2 text-sm font-black text-toss-gray-primary">
          <span className={cn("h-2.5 w-2.5 rounded-full", style.accent)} aria-hidden="true" />
          {status.message}
        </p>
        {current ? (
          <div className="mt-2">
            <p className="break-words text-sm font-black leading-snug text-toss-gray-primary">{compactName(current.courseName, 34)}</p>
            <p className="mt-1 text-xs font-bold text-toss-gray-secondary">
              {current.instructorName} · {current.start_time}-{current.end_time}
            </p>
          </div>
        ) : null}
        {status.closure ? (
          <p className="mt-2 text-xs font-bold text-purple-700">
            {status.closure.closure_type} · {status.closure.start_time || "00:00"}-{status.closure.end_time || "23:59"}
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-2 text-xs font-bold">
        {status.availableUntil ? (
          <p className="rounded-[14px] bg-emerald-50 px-3 py-2 text-emerald-700">
            {status.availableUntil}까지 사용 가능
          </p>
        ) : null}
        {next ? (
          <p className="flex items-start gap-2 rounded-[14px] bg-blue-50 px-3 py-2 text-blue-700">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            다음 수업 {next.start_time} · {compactName(next.courseName, 28)}
          </p>
        ) : (
          <p className="flex items-center gap-2 rounded-[14px] bg-slate-50 px-3 py-2 text-slate-600">
            <TimerReset className="h-3.5 w-3.5" aria-hidden="true" />
            오늘 남은 일정 없음
          </p>
        )}
      </div>
    </article>
  );
}

export default function TodayRoomStatus({ data, now }: TodayRoomStatusProps) {
  const [showAllRooms, setShowAllRooms] = useState(false);
  const rooms = data.rooms.filter((room) => room.is_active);
  const statuses = rooms.map((room) => ({
    room,
    status: getTodayRoomStatus(room, data.schedules, data.courses, data.instructors, data.closures, now),
  }));
  const roomConflicts = detectRoomConflicts(data.schedules, data.rooms, data.courses);
  const instructorConflicts = detectInstructorConflicts(data.schedules, data.instructors, data.courses);
  const needsReview =
    data.reviewNotes.length +
    data.schedules.filter((schedule) => {
      const course = data.courses.some((item) => item.course_id === schedule.course_id);
      const room = data.rooms.some((item) => item.room_id === schedule.room_id);
      const instructor = data.instructors.some((item) => item.instructor_id === schedule.instructor_id);
      return !course || !room || !instructor || !schedule.days_of_week.trim();
    }).length;

  const inUse = statuses.filter(({ status }) => ["in-use", "ending-soon", "conflict"].includes(status.kind)).length;
  const available = statuses.filter(({ status }) => status.kind === "available").length;
  const endingSoon = statuses.filter(({ status }) => status.kind === "ending-soon").length;
  const noReservation = statuses.filter(({ status }) => status.kind === "no-reservation").length;
  const conflictCount = roomConflicts.length + instructorConflicts.length;
  const closed = statuses.filter(({ status }) => status.kind === "closed").length;
  const sortedStatuses = statuses.toSorted(
    (a, b) => statusOrder(a.status) - statusOrder(b.status) || a.room.room_name.localeCompare(b.room.room_name),
  );
  const visibleStatuses = showAllRooms ? sortedStatuses : sortedStatuses.slice(0, ROOM_PREVIEW_LIMIT);
  const hiddenRoomCount = Math.max(0, sortedStatuses.length - visibleStatuses.length);
  const brief = briefingMessage({ inUse, available, endingSoon, noReservation });

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="rounded-[28px] bg-white p-6 shadow-toss md:p-7" aria-labelledby="today-briefing-title">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] bg-toss-blue-light p-3 text-toss-blue">
                  <Clock3 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-black text-toss-gray-tertiary">지금 기준 운영 브리핑</p>
                  <h2 id="today-briefing-title" className="mt-1 text-2xl font-black tracking-tight text-toss-gray-primary md:text-3xl">
                    {brief}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-toss-gray-secondary">
                {formatTime(now)} 기준으로 강의실 사용 상태를 계산했습니다. 초록은 사용 가능, 파랑은 수업 중, 노랑은 곧 종료, 빨강은 확인 필요입니다.
              </p>
            </div>
            <Badge className="w-fit bg-toss-bg px-3 py-1.5 text-xs font-black text-toss-gray-secondary ring-0">
              실시간 현황
            </Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[18px] bg-blue-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black text-blue-700">
                <Users className="h-4 w-4" aria-hidden="true" />
                수업 중
              </p>
              <p className="mt-2 text-2xl font-black text-blue-900">{inUse}개</p>
            </div>
            <div className="rounded-[18px] bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black text-emerald-700">
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                바로 사용 가능
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-900">{available}개</p>
            </div>
            <div className="rounded-[18px] bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black text-amber-700">
                <Hourglass className="h-4 w-4" aria-hidden="true" />
                곧 종료
              </p>
              <p className="mt-2 text-2xl font-black text-amber-900">{endingSoon}개</p>
            </div>
            <div className="rounded-[18px] bg-red-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black text-red-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                확인 필요
              </p>
              <p className="mt-2 text-2xl font-black text-red-900">{needsReview + conflictCount}건</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-toss md:p-7" aria-labelledby="today-next-action-title">
          <div className="flex items-center gap-3">
            <div className="rounded-[16px] bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black text-toss-gray-tertiary">행정실 빠른 판단</p>
              <h2 id="today-next-action-title" className="text-xl font-black text-toss-gray-primary">먼저 볼 항목</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <p className="rounded-[18px] bg-toss-bg p-4 text-sm font-bold leading-6 text-toss-gray-secondary">
              빈 강의실은 아래 카드에서 “몇 시까지 사용 가능”을 먼저 확인하세요.
            </p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-[18px] bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-600">휴강/점검</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{closed}</p>
              </div>
              <div className="rounded-[18px] bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-600">예약 없음</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{noReservation}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <StatCard icon={Layers3} title="전체 강의실" value={rooms.length} description="활성 강의실 기준" tone="slate" />
        <StatCard icon={Users} title="현재 사용 중" value={inUse} description="수업 진행 중인 강의실" tone="blue" />
        <StatCard icon={DoorOpen} title="현재 비어 있음" value={available} description="다음 수업 전까지 사용 가능" tone="green" />
        <StatCard icon={Hourglass} title="곧 종료" value={endingSoon} description="30분 이내 종료 예정" tone="amber" />
        <StatCard icon={DoorClosed} title="오늘 예약 없음" value={noReservation} description="오늘 등록된 수업 없음" tone="slate" />
        <StatCard icon={NotebookTabs} title="확인 필요" value={needsReview} description="검토 메모 및 미확인 데이터" tone="purple" />
        <StatCard icon={AlertTriangle} title="중복 경고" value={conflictCount} description="전체 기간 기준 겹침" tone={conflictCount ? "red" : "green"} />
      </div>

      <section className="rounded-[28px] bg-white p-5 shadow-toss md:p-6" aria-labelledby="room-status-title">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-toss-gray-tertiary">강의실 상태 카드</p>
            <h2 id="room-status-title" className="mt-1 text-2xl font-black tracking-tight text-toss-gray-primary">지금 강의실 한눈보기</h2>
            <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">중복, 곧 종료, 사용 중, 비어 있음 순서로 정렬했습니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllRooms((current) => !current)}
            className="inline-flex items-center justify-center rounded-[14px] bg-toss-gray-primary px-4 py-3 text-sm font-black text-white transition hover:bg-toss-gray-secondary"
            aria-expanded={showAllRooms}
            aria-controls="today-room-status-list"
          >
            {showAllRooms ? "주요 강의실만 보기" : `전체 ${rooms.length}개 보기`}
          </button>
        </div>
        <div id="today-room-status-list" className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleStatuses.map(({ room, status }) => (
            <CompactRoomStatusCard key={room.room_id} room={room} status={status} />
          ))}
        </div>
        {hiddenRoomCount > 0 ? (
          <p className="mt-4 rounded-[16px] bg-toss-bg px-4 py-3 text-sm font-bold text-toss-gray-secondary">
            아래에 {hiddenRoomCount}개 강의실이 더 있습니다. 전체 보기를 누르면 모두 펼쳐집니다.
          </p>
        ) : null}
      </section>

      <TimeSlotOverview data={data} now={now} />
    </section>
  );
}

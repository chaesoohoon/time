import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DoorOpen,
  PauseCircle,
  TimerReset,
  UserRound,
} from "lucide-react";
import type { Room, RoomStatus } from "@/types";
import { STATUS_STYLES } from "@/lib/constants";
import { compactName, cn } from "@/lib/utils";
import Badge from "./Badge";

type RoomStatusCardProps = {
  room: Room;
  status: RoomStatus;
};

export default function RoomStatusCard({ room, status }: RoomStatusCardProps) {
  const style = STATUS_STYLES[status.kind];
  const current = status.currentSchedule;
  const next = status.nextSchedule;
  const isConflict = status.kind === "conflict";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-white p-6 shadow-toss border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]",
        isConflict ? "ring-2 ring-red-500/20" : "",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5", style.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-toss-gray-primary">{room.room_name}</h3>
          <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">
            {room.room_type} {room.floor ? `· ${room.floor}` : ""}
          </p>
        </div>
        <Badge className={cn("border-0 ring-0 px-3 py-1 font-bold text-xs", style.badge)}>
          {isConflict ? <AlertTriangle className="mr-1 h-3.5 w-3.5" /> : null}
          {status.label}
        </Badge>
      </div>

      <div className="mt-5 rounded-[20px] bg-toss-bg p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-toss-gray-primary">
          {status.kind === "available" ? <DoorOpen className="h-4 w-4 text-emerald-600" /> : null}
          {status.kind === "closed" ? <PauseCircle className="h-4 w-4 text-purple-600" /> : null}
          {status.kind === "no-reservation" ? <CheckCircle2 className="h-4 w-4 text-toss-gray-secondary" /> : null}
          {(status.kind === "in-use" || status.kind === "ending-soon" || status.kind === "conflict") ? (
            <Clock3 className="h-4 w-4 text-toss-blue" />
          ) : null}
          {status.message}
        </div>

        {current ? (
          <div className="mt-3 space-y-2.5">
            <p className="text-base font-extrabold leading-snug text-toss-gray-primary">{current.courseName}</p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-toss-gray-secondary">
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {current.instructorName}
              </span>
              <span>{current.start_time} - {current.end_time}</span>
            </div>
          </div>
        ) : null}

        {status.closure ? (
          <p className="mt-3 text-sm font-semibold text-purple-700">
            {status.closure.closure_type} · {status.closure.start_time} - {status.closure.end_time}
          </p>
        ) : null}

        {status.progress !== null ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-toss-gray-tertiary">
              <span>수업 진행률</span>
              <span>{status.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white">
              <div className={cn("h-full rounded-full transition-all duration-500", style.accent)} style={{ width: `${status.progress}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2.5 text-xs">
        {next ? (
          <div className="flex items-start gap-3 rounded-[16px] bg-[#f9fafb] p-3.5">
            <CalendarClock className="mt-0.5 h-4 w-4 text-toss-gray-tertiary" />
            <div>
              <p className="font-bold text-toss-gray-primary">다음 수업 {next.start_time} 시작</p>
              <p className="mt-0.5 font-medium text-toss-gray-secondary">{compactName(next.courseName, 36)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[16px] bg-[#f9fafb] p-3.5 text-toss-gray-tertiary">
            <TimerReset className="h-4 w-4" />
            <span className="font-bold">오늘 남은 일정 없음</span>
          </div>
        )}

        {status.availableUntil ? (
          <p className="rounded-[16px] bg-[#e8f8f0] px-3.5 py-2.5 font-bold text-emerald-600">
            {status.availableUntil}까지 사용 가능
          </p>
        ) : null}

        {isConflict ? (
          <p className="rounded-[16px] bg-red-50 px-3.5 py-2.5 font-bold text-red-600">
            현재 {status.conflictCount}개 수업이 같은 강의실에 겹쳐 있습니다.
          </p>
        ) : null}
      </div>
    </article>
  );
}

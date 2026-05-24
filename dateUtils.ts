"use client";

import { AlertTriangle, DoorClosed, DoorOpen, Hourglass, Layers3, NotebookTabs, Users } from "lucide-react";
import type { SheetData } from "@/types";
import { detectInstructorConflicts, detectRoomConflicts } from "@/lib/conflictUtils";
import { getTodayRoomStatus } from "@/lib/scheduleUtils";
import StatCard from "./StatCard";
import TimeSlotOverview from "./TimeSlotOverview";

type TodayRoomStatusProps = {
  data: SheetData;
  now: Date;
};

export default function TodayRoomStatus({ data, now }: TodayRoomStatusProps) {
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

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard icon={Layers3} title="전체 강의실" value={rooms.length} description="활성 강의실 기준" tone="slate" />
        <StatCard icon={Users} title="현재 사용 중" value={inUse} description="수업 진행 중인 강의실" tone="blue" />
        <StatCard icon={DoorOpen} title="현재 비어 있음" value={available} description="다음 수업 전까지 사용 가능" tone="green" />
        <StatCard icon={Hourglass} title="곧 종료" value={endingSoon} description="30분 이내 종료 예정" tone="amber" />
        <StatCard icon={DoorClosed} title="오늘 예약 없음" value={noReservation} description="오늘 등록된 수업 없음" tone="slate" />
        <StatCard icon={NotebookTabs} title="확인 필요" value={needsReview} description="검토 메모 및 미확인 데이터" tone="purple" />
        <StatCard icon={AlertTriangle} title="중복 경고" value={conflictCount} description="강의실/강사 겹침" tone={conflictCount ? "red" : "green"} />
      </div>

      <TimeSlotOverview data={data} now={now} />
    </section>
  );
}

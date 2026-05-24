"use client";

import { ClipboardList, FileWarning } from "lucide-react";
import type { SheetData } from "@/types";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type ReviewNotesPanelProps = {
  data: SheetData;
};

export default function ReviewNotesPanel({ data }: ReviewNotesPanelProps) {
  const missingRelationNotes = data.schedules
    .filter((schedule) => {
      const course = data.courses.some((item) => item.course_id === schedule.course_id);
      const room = data.rooms.some((item) => item.room_id === schedule.room_id);
      const instructor = data.instructors.some((item) => item.instructor_id === schedule.instructor_id);
      return !course || !room || !instructor || !schedule.days_of_week.trim();
    })
    .map((schedule) => ({
      id: `missing-${schedule.schedule_id}`,
      category: "데이터 확인",
      target: schedule.schedule_id,
      content: "과정, 강의실, 강사 또는 요일 정보 확인이 필요합니다.",
      status: "확인 필요",
      memo: schedule.memo,
      related_id: schedule.schedule_id,
    }));

  const notes = [...data.reviewNotes, ...missingRelationNotes];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">확인 필요 항목</h2>
            <p className="mt-1 text-sm text-slate-500">review_notes와 미확인 참조 데이터를 함께 표시합니다.</p>
          </div>
          <Badge className={notes.length ? "bg-purple-50 text-purple-700 ring-purple-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}>
            확인 필요 {notes.length}건
          </Badge>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState title="확인 필요 항목이 없습니다." description="review_notes 시트에 등록된 항목이 없습니다." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Badge className="bg-purple-50 text-purple-700 ring-purple-200">
                  <FileWarning className="h-3.5 w-3.5" />
                  {note.category}
                </Badge>
                <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{note.status}</Badge>
              </div>
              <h3 className="mt-4 font-bold leading-snug text-slate-950">{note.target || note.related_id || "대상 미정"}</h3>
              <p className="mt-2 text-sm text-slate-600">{note.content}</p>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <ClipboardList className="h-4 w-4" />
                  {note.related_id || "관련 ID 없음"}
                </div>
                {note.memo ? <p className="mt-2">{note.memo}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

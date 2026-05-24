"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FilePenLine, RefreshCw, Save, Search } from "lucide-react";
import type { Course, Schedule, SheetData } from "@/types";
import { isTimeOverlapping } from "@/lib/conflictUtils";
import { minutesFromTime, parseDate, parseTime } from "@/lib/dateUtils";
import { expandSchedulesByDate } from "@/lib/scheduleUtils";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";

type SaveStatus = "idle" | "saving" | "success" | "error";

type CourseEditDraft = {
  course_id: string;
  category: string;
  course_name: string;
  start_date: string;
  end_date: string;
  total_hours: string;
  status: string;
  memo: string;
};

type ScheduleEditDraft = {
  schedule_id: string;
  course_id: string;
  room_id: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  status: string;
  memo: string;
};

type ScheduleDataTableEditorProps = {
  data: SheetData;
};

const fallbackStatuses = ["운영예정", "운영중", "검토필요", "보류", "종료"];
const fallbackDays = ["월-금", "월-목", "월,수,목", "토", "일", "매일"];

function compact(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function findCourse(data: SheetData, courseId: string) {
  return data.courses.find((course) => course.course_id === courseId) || null;
}

function findRoom(data: SheetData, roomId: string) {
  return data.rooms.find((room) => room.room_id === roomId) || null;
}

function findInstructor(data: SheetData, instructorId: string) {
  return data.instructors.find((instructor) => instructor.instructor_id === instructorId) || null;
}

function makeCourseDraft(course: Course | null): CourseEditDraft {
  return {
    course_id: course?.course_id || "",
    category: course?.category || "기타",
    course_name: course?.course_name || "미확인 과정",
    start_date: course?.start_date || "",
    end_date: course?.end_date || "",
    total_hours: course?.total_hours ? String(course.total_hours) : "",
    status: course?.status || "운영예정",
    memo: course?.memo || "",
  };
}

function makeScheduleDraft(schedule: Schedule): ScheduleEditDraft {
  return {
    schedule_id: schedule.schedule_id,
    course_id: schedule.course_id,
    room_id: schedule.room_id,
    instructor_id: schedule.instructor_id,
    start_date: schedule.start_date,
    end_date: schedule.end_date,
    days_of_week: schedule.days_of_week,
    start_time: parseTime(schedule.start_time),
    end_time: parseTime(schedule.end_time),
    schedule_type: schedule.schedule_type || "정규수업",
    status: schedule.status || "운영예정",
    memo: schedule.memo || "",
  };
}

function toSchedule(draft: ScheduleEditDraft): Schedule {
  return {
    ...draft,
    start_time: parseTime(draft.start_time),
    end_time: parseTime(draft.end_time),
    schedule_type: draft.schedule_type || "정규수업",
    status: draft.status || "운영예정",
  };
}

function buildDateRange(startDate: string, endDate: string) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || start > end) return null;

  return {
    start,
    end,
    dates: Array.from({ length: Math.floor((end.getTime() - start.getTime()) / 86400000) + 1 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    }),
  };
}

function rowSearchText(data: SheetData, schedule: Schedule) {
  const course = findCourse(data, schedule.course_id);
  const room = findRoom(data, schedule.room_id);
  const instructor = findInstructor(data, schedule.instructor_id);
  return compact(
    [
      schedule.schedule_id,
      course?.course_name,
      course?.category,
      room?.room_name,
      instructor?.instructor_name,
      schedule.start_date,
      schedule.end_date,
      schedule.days_of_week,
      schedule.start_time,
      schedule.end_time,
      schedule.status,
      schedule.memo,
    ].join(" "),
  );
}

function hasChanged(original: Schedule | undefined, scheduleDraft: ScheduleEditDraft, originalCourse: Course | null, courseDraft: CourseEditDraft) {
  if (!original) return false;
  const scheduleChanged = Object.entries(scheduleDraft).some(([key, value]) => String(original[key as keyof Schedule] ?? "") !== String(value));
  const courseChanged = originalCourse
    ? Object.entries(courseDraft).some(([key, value]) => {
        if (key === "total_hours") return String(originalCourse.total_hours ?? "") !== String(value);
        return String(originalCourse[key as keyof Course] ?? "") !== String(value);
      })
    : false;
  return scheduleChanged || courseChanged;
}

function buildConflictSummary(data: SheetData, draft: ScheduleEditDraft) {
  const candidate = toSchedule(draft);
  const range = buildDateRange(candidate.start_date, candidate.end_date);
  if (!range) {
    return { ready: false, messages: ["수업 시작일과 종료일을 확인해 주세요."] };
  }
  if (minutesFromTime(candidate.start_time) >= minutesFromTime(candidate.end_time)) {
    return { ready: false, messages: ["종료 시간은 시작 시간보다 늦어야 합니다."] };
  }

  const candidateItems = expandSchedulesByDate([candidate], range);
  const existingItems = expandSchedulesByDate(
    data.schedules.filter((schedule) => schedule.schedule_id !== candidate.schedule_id),
    range,
  );

  const roomConflict = existingItems.find((item) =>
    candidateItems.some(
      (candidateItem) =>
        candidateItem.date === item.date &&
        candidateItem.room_id === item.room_id &&
        isTimeOverlapping(candidateItem.start_time, candidateItem.end_time, item.start_time, item.end_time),
    ),
  );
  const instructorConflict = existingItems.find((item) =>
    candidateItems.some(
      (candidateItem) =>
        candidateItem.date === item.date &&
        candidateItem.instructor_id === item.instructor_id &&
        isTimeOverlapping(candidateItem.start_time, candidateItem.end_time, item.start_time, item.end_time),
    ),
  );

  const messages = [
    roomConflict ? `${roomConflict.date} 강의실 시간이 겹칩니다.` : "",
    instructorConflict ? `${instructorConflict.date} 강사 시간이 겹칩니다.` : "",
  ].filter(Boolean);

  return {
    ready: messages.length === 0,
    messages,
  };
}

export default function ScheduleDataTableEditor({ data }: ScheduleDataTableEditorProps) {
  const router = useRouter();
  const firstSchedule = data.schedules[0];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(firstSchedule?.schedule_id || "");
  const selectedSchedule = data.schedules.find((schedule) => schedule.schedule_id === selectedId) || firstSchedule;
  const selectedCourse = selectedSchedule ? findCourse(data, selectedSchedule.course_id) : null;
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleEditDraft>(() => (firstSchedule ? makeScheduleDraft(firstSchedule) : {
    schedule_id: "",
    course_id: "",
    room_id: "",
    instructor_id: "",
    start_date: "",
    end_date: "",
    days_of_week: "월-금",
    start_time: "09:00",
    end_time: "18:00",
    schedule_type: "정규수업",
    status: "운영예정",
    memo: "",
  }));
  const [courseDraft, setCourseDraft] = useState<CourseEditDraft>(() => makeCourseDraft(selectedCourse));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const categories = useMemo(() => ["all", ...Array.from(new Set(data.courses.map((course) => course.category || "기타")))], [data.courses]);
  const statuses = useMemo(
    () => Array.from(new Set([...fallbackStatuses, ...data.courses.map((course) => course.status), ...data.schedules.map((schedule) => schedule.status)].filter(Boolean))),
    [data.courses, data.schedules],
  );

  const visibleSchedules = data.schedules
    .filter((schedule) => {
      const course = findCourse(data, schedule.course_id);
      if (category !== "all" && course?.category !== category) return false;
      if (query && !rowSearchText(data, schedule).includes(compact(query))) return false;
      return true;
    })
    .toSorted((a, b) => `${a.start_date}${a.start_time}`.localeCompare(`${b.start_date}${b.start_time}`));

  const conflictSummary = buildConflictSummary(data, scheduleDraft);
  const changed = hasChanged(selectedSchedule, scheduleDraft, selectedCourse, courseDraft);
  const currentRoom = findRoom(data, scheduleDraft.room_id);
  const currentInstructor = findInstructor(data, scheduleDraft.instructor_id);

  const selectSchedule = (schedule: Schedule) => {
    const course = findCourse(data, schedule.course_id);
    setSelectedId(schedule.schedule_id);
    setScheduleDraft(makeScheduleDraft(schedule));
    setCourseDraft(makeCourseDraft(course));
    setSaveStatus("idle");
    setSaveMessage("");
  };

  const updateSchedule = (key: keyof ScheduleEditDraft, value: string) => {
    setScheduleDraft((current) => ({ ...current, [key]: value }));
    if (key === "course_id") {
      setCourseDraft(makeCourseDraft(findCourse(data, value)));
    }
  };

  const saveChanges = async () => {
    if (!selectedSchedule) return;
    if (!conflictSummary.ready) {
      setSaveStatus("error");
      setSaveMessage("겹치는 일정 또는 입력 오류를 먼저 확인해 주세요.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("Google Sheets에 변경 내용을 저장하고 있습니다.");

    try {
      const response = await fetch("/api/sheets/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveDraft",
          mode: "newCourse",
          course: {
            ...courseDraft,
            round_no: "",
            tuition_fee: "",
            self_payment: "",
            current_students: "",
            course_status: courseDraft.status,
            source_pdf: "web-table-edit",
          },
          schedule: {
            ...toSchedule(scheduleDraft),
            source_pdf: "web-table-edit",
          },
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !result.ok) throw new Error(result.error || "Google Sheets 저장에 실패했습니다.");

      setSaveStatus("success");
      setSaveMessage(result.message || "변경 내용을 저장했습니다. 최신 데이터를 다시 불러옵니다.");
      window.setTimeout(() => router.refresh(), 900);
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-toss md:p-6" aria-labelledby="schedule-data-editor-title">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700">
            <FilePenLine className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="schedule-data-editor-title" className="text-xl font-black tracking-tight text-toss-gray-primary">
              전체 시간표 편집표
            </h2>
            <p className="text-sm font-semibold text-toss-gray-secondary">
              과정 코드를 보지 않고 과정명, 강사명, 강의실명으로 기존 데이터를 확인하고 수정합니다.
            </p>
          </div>
        </div>
        <div className="rounded-[18px] bg-toss-bg p-4 text-sm font-bold text-toss-gray-secondary xl:w-[320px]">
          <p className="text-toss-gray-primary">시트 구조는 그대로 유지됩니다.</p>
          <p className="mt-1 text-xs leading-relaxed">저장 시 앱이 선택한 과정명/강사명/강의실명을 내부 ID로 바꿔서 Google Sheets에 기록합니다.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">시간표 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="과정명, 강사, 강의실, 날짜로 검색"
            className="w-full rounded-[14px] bg-toss-bg py-3 pl-9 pr-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="분야 필터"
          className="rounded-[14px] bg-toss-bg px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none transition focus:bg-white focus:ring-2 focus:ring-toss-blue"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "전체 분야" : item}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-[22px] bg-toss-bg p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-black text-toss-gray-primary">시간표 {visibleSchedules.length}건</p>
            <Badge className="bg-white text-toss-gray-secondary ring-0">클릭해서 수정</Badge>
          </div>
          {visibleSchedules.length === 0 ? (
            <EmptyState title="검색 결과가 없습니다." description="과정명이나 강사명을 다시 입력해 주세요." />
          ) : (
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {visibleSchedules.map((schedule) => {
                const course = findCourse(data, schedule.course_id);
                const room = findRoom(data, schedule.room_id);
                const instructor = findInstructor(data, schedule.instructor_id);
                const active = schedule.schedule_id === selectedId;
                const style = categoryStyle(course?.category || "기타");
                return (
                  <button
                    key={schedule.schedule_id}
                    type="button"
                    onClick={() => selectSchedule(schedule)}
                    className={cn(
                      "w-full rounded-[18px] bg-white p-4 text-left shadow-sm ring-1 transition hover:ring-toss-blue/40",
                      active ? "ring-2 ring-toss-blue" : "ring-toss-border",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("ring-0", style.soft, style.text)}>{course?.category || "기타"}</Badge>
                      <span className="text-xs font-black text-toss-gray-secondary">
                        {schedule.start_date} - {schedule.end_date}
                      </span>
                      <span className="rounded-full bg-toss-bg px-2 py-0.5 text-[11px] font-black text-toss-gray-secondary">
                        {schedule.days_of_week || "요일 확인"}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-base font-black leading-snug text-toss-gray-primary">{course?.course_name || "미확인 과정"}</p>
                    <p className="mt-1 break-words text-xs font-bold leading-relaxed text-toss-gray-secondary">
                      {schedule.start_time}-{schedule.end_time} · {room?.room_name || "미확인 강의실"} · {instructor?.instructor_name || "미확인 강사"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rounded-[22px] bg-toss-bg p-4 xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-toss-gray-tertiary">선택한 시간표 수정</p>
              <h3 className="mt-1 break-words text-lg font-black text-toss-gray-primary">{courseDraft.course_name}</h3>
            </div>
            <div className={cn("rounded-[14px] p-2", conflictSummary.ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>
              {conflictSummary.ready ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-xs font-bold text-toss-gray-secondary">
              과정명
              <input
                value={courseDraft.course_name}
                onChange={(event) => setCourseDraft((current) => ({ ...current, course_name: event.target.value }))}
                className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-toss-gray-secondary">
                과정 분야
                <select
                  value={courseDraft.category}
                  onChange={(event) => setCourseDraft((current) => ({ ...current, category: event.target.value }))}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                >
                  {categories.filter((item) => item !== "all").map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-toss-gray-secondary">
                상태
                <select
                  value={scheduleDraft.status}
                  onChange={(event) => {
                    updateSchedule("status", event.target.value);
                    setCourseDraft((current) => ({ ...current, status: event.target.value }));
                  }}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-toss-gray-secondary">
              연결 과정 선택
              <select
                value={scheduleDraft.course_id}
                onChange={(event) => updateSchedule("course_id", event.target.value)}
                className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
              >
                {data.courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-toss-gray-secondary">
                수업 시작일
                <input
                  type="date"
                  value={scheduleDraft.start_date}
                  onChange={(event) => updateSchedule("start_date", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                />
              </label>
              <label className="block text-xs font-bold text-toss-gray-secondary">
                수업 종료일
                <input
                  type="date"
                  value={scheduleDraft.end_date}
                  onChange={(event) => updateSchedule("end_date", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-bold text-toss-gray-secondary">
                요일
                <select
                  value={fallbackDays.includes(scheduleDraft.days_of_week) ? scheduleDraft.days_of_week : "직접입력"}
                  onChange={(event) => updateSchedule("days_of_week", event.target.value === "직접입력" ? "" : event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                >
                  {fallbackDays.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="직접입력">직접입력</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-toss-gray-secondary">
                시작 시간
                <input
                  type="time"
                  value={scheduleDraft.start_time}
                  onChange={(event) => updateSchedule("start_time", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                />
              </label>
              <label className="block text-xs font-bold text-toss-gray-secondary">
                종료 시간
                <input
                  type="time"
                  value={scheduleDraft.end_time}
                  onChange={(event) => updateSchedule("end_time", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                />
              </label>
            </div>

            {!fallbackDays.includes(scheduleDraft.days_of_week) ? (
              <label className="block text-xs font-bold text-toss-gray-secondary">
                요일 직접 입력
                <input
                  value={scheduleDraft.days_of_week}
                  onChange={(event) => updateSchedule("days_of_week", event.target.value)}
                  placeholder="예: 월,수,목"
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                />
              </label>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-toss-gray-secondary">
                강의실
                <select
                  value={scheduleDraft.room_id}
                  onChange={(event) => updateSchedule("room_id", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                >
                  {data.rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-toss-gray-secondary">
                강사
                <select
                  value={scheduleDraft.instructor_id}
                  onChange={(event) => updateSchedule("instructor_id", event.target.value)}
                  className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
                >
                  {data.instructors.map((instructor) => (
                    <option key={instructor.instructor_id} value={instructor.instructor_id}>
                      {instructor.instructor_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs font-bold text-toss-gray-secondary">
              메모
              <input
                value={scheduleDraft.memo}
                onChange={(event) => updateSchedule("memo", event.target.value)}
                placeholder="변경 사유나 확인사항"
                className="mt-1.5 w-full rounded-[14px] bg-white px-3.5 py-3 text-sm font-bold text-toss-gray-primary outline-none focus:ring-2 focus:ring-toss-blue"
              />
            </label>
          </div>

          <div className="mt-4 rounded-[16px] bg-white p-4 text-xs font-bold text-toss-gray-secondary">
            <p className="text-toss-gray-primary">
              {currentRoom?.room_name || "미확인 강의실"} · {currentInstructor?.instructor_name || "미확인 강사"}
            </p>
            {conflictSummary.ready ? (
              <p className="mt-2 text-emerald-700">현재 입력값 기준으로 중복 경고가 없습니다.</p>
            ) : (
              <div className="mt-2 space-y-1 text-red-700">
                {conflictSummary.messages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={!changed || !conflictSummary.ready || saveStatus === "saving"}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-sm font-black transition active:scale-[0.98]",
              changed && conflictSummary.ready && saveStatus !== "saving"
                ? "bg-toss-blue text-white hover:bg-toss-blue-hover"
                : "cursor-not-allowed bg-white text-toss-gray-tertiary",
            )}
          >
            {saveStatus === "saving" ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saveStatus === "saving" ? "저장 중" : "변경 내용 저장"}
          </button>

          {saveMessage ? (
            <p
              className={cn(
                "mt-3 rounded-[14px] p-3 text-xs font-bold leading-relaxed",
                saveStatus === "success" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
              )}
            >
              {saveMessage}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

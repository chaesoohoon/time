"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  FileSpreadsheet,
  PenLine,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Wand2,
} from "lucide-react";
import type { Course, Schedule, SheetData } from "@/types";
import { isRoomClosed } from "@/lib/closureUtils";
import { isTimeOverlapping } from "@/lib/conflictUtils";
import { humanizeDuration, minutesFromTime, parseDate, parseTime } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { cn } from "@/lib/utils";
import Badge from "./Badge";

type ScheduleDraftBuilderProps = {
  data: SheetData;
};

type DraftMode = "newCourse" | "addSchedule" | "editSchedule";
type SaveStatus = "idle" | "checking" | "saving" | "success" | "error";

type CourseDraft = {
  course_id: string;
  category: string;
  course_name: string;
  start_date: string;
  end_date: string;
  total_hours: string;
  status: string;
  memo: string;
};

type ScheduleDraft = {
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

const modeOptions: Array<{ key: DraftMode; label: string; description: string; icon: typeof PlusCircle }> = [
  { key: "newCourse", label: "새 수업 만들기", description: "과정과 시간표를 함께 작성", icon: PlusCircle },
  { key: "addSchedule", label: "수업 시간 추가", description: "기존 과정에 시간만 추가", icon: FileSpreadsheet },
  { key: "editSchedule", label: "일정 바꾸기", description: "기존 시간표 수정안 작성", icon: PenLine },
];

const dayOptions = ["월-금", "월-목", "월,수,목", "토", "일", "매일"];

function nextId(values: string[], prefix: string) {
  const max = values.reduce((current, value) => {
    const match = value.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function cleanCell(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\t|\r?\n/g, " ").trim();
}

function toTsv(values: Array<string | number | null | undefined>) {
  return values.map(cleanCell).join("\t");
}

function compactSearch(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
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

function courseFromDraft(draft: CourseDraft): Course {
  return {
    course_id: draft.course_id,
    category: draft.category || "기타",
    course_name: draft.course_name || "과정명 미입력",
    start_date: draft.start_date,
    end_date: draft.end_date,
    total_hours: draft.total_hours ? Number(draft.total_hours) : null,
    status: draft.status || "운영예정",
    memo: draft.memo,
  };
}

function scheduleFromDraft(draft: ScheduleDraft): Schedule {
  return {
    schedule_id: draft.schedule_id,
    course_id: draft.course_id,
    room_id: draft.room_id,
    instructor_id: draft.instructor_id,
    start_date: draft.start_date,
    end_date: draft.end_date,
    days_of_week: draft.days_of_week,
    start_time: parseTime(draft.start_time),
    end_time: parseTime(draft.end_time),
    schedule_type: draft.schedule_type || "정규수업",
    status: draft.status || "운영예정",
    memo: draft.memo,
  };
}

function scheduleLabel(schedule: Schedule, data: SheetData) {
  const course = data.courses.find((item) => item.course_id === schedule.course_id);
  const room = data.rooms.find((item) => item.room_id === schedule.room_id);
  const instructor = data.instructors.find((item) => item.instructor_id === schedule.instructor_id);
  return `${course?.course_name || "미확인 과정"} · ${schedule.start_date}~${schedule.end_date} · ${schedule.start_time}-${schedule.end_time} · ${room?.room_name || "미확인 강의실"} · ${instructor?.instructor_name || "미확인 강사"}`;
}

export default function ScheduleDraftBuilder({ data }: ScheduleDraftBuilderProps) {
  const router = useRouter();
  const nextCourseId = nextId(data.courses.map((course) => course.course_id), "C");
  const nextScheduleId = nextId(data.schedules.map((schedule) => schedule.schedule_id), "S");
  const defaultCourse = data.courses[0];
  const defaultRoom = data.rooms.find((room) => room.is_active)?.room_id || data.rooms[0]?.room_id || "";
  const defaultInstructor = data.instructors.find((instructor) => instructor.is_active)?.instructor_id || data.instructors[0]?.instructor_id || "";
  const firstSchedule = data.schedules[0];

  const [mode, setMode] = useState<DraftMode>("newCourse");
  const [copied, setCopied] = useState("");
  const [showManualBackup, setShowManualBackup] = useState(false);
  const [writeConfigured, setWriteConfigured] = useState<boolean | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("checking");
  const [saveMessage, setSaveMessage] = useState("Google Sheets 바로 저장 연결 상태를 확인하고 있습니다.");
  const [courseSearch, setCourseSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [courseDraft, setCourseDraft] = useState<CourseDraft>({
    course_id: nextCourseId,
    category: defaultCourse?.category || "기타",
    course_name: "",
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    total_hours: "",
    status: "운영예정",
    memo: "",
  });
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>({
    schedule_id: nextScheduleId,
    course_id: nextCourseId,
    room_id: defaultRoom,
    instructor_id: defaultInstructor,
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    days_of_week: "월-금",
    start_time: "09:00",
    end_time: "17:00",
    schedule_type: "정규수업",
    status: "운영예정",
    memo: "",
  });

  const selectedCourse =
    mode === "newCourse"
      ? courseFromDraft(courseDraft)
      : data.courses.find((course) => course.course_id === scheduleDraft.course_id) || null;
  const candidateSchedule = scheduleFromDraft({
    ...scheduleDraft,
    course_id: mode === "newCourse" ? courseDraft.course_id : scheduleDraft.course_id,
  });
  const candidateRange = buildDateRange(candidateSchedule.start_date, candidateSchedule.end_date);
  const candidateOccurrences = candidateRange ? expandSchedulesByDate([candidateSchedule], candidateRange) : [];
  const existingSchedules = data.schedules.filter((schedule) => schedule.schedule_id !== candidateSchedule.schedule_id);
  const existingOccurrences = candidateRange ? expandSchedulesByDate(existingSchedules, candidateRange) : [];
  const candidateRoom = data.rooms.find((room) => room.room_id === candidateSchedule.room_id);
  const candidateInstructor = data.instructors.find((instructor) => instructor.instructor_id === candidateSchedule.instructor_id);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (mode === "newCourse" && !courseDraft.course_name.trim()) errors.push("과정명을 입력해 주세요.");
  if (!candidateRange) errors.push("개강일과 종강일을 확인해 주세요.");
  if (!candidateSchedule.start_time || !candidateSchedule.end_time) errors.push("수업 시작/종료 시간을 입력해 주세요.");
  if (
    candidateSchedule.start_time &&
    candidateSchedule.end_time &&
    minutesFromTime(candidateSchedule.start_time) >= minutesFromTime(candidateSchedule.end_time)
  ) {
    errors.push("종료 시간은 시작 시간보다 늦어야 합니다.");
  }
  if (!candidateRoom || candidateRoom.room_name.includes("미정")) warnings.push("강의실이 미정입니다.");
  if (!candidateInstructor || candidateInstructor.instructor_name.includes("미정")) warnings.push("강사가 미정입니다.");

  const roomConflicts = candidateOccurrences.flatMap((occurrence) =>
    candidateRoom?.room_name.includes("미정")
      ? []
      : existingOccurrences
          .filter(
            (existing) =>
              existing.date === occurrence.date &&
              existing.room_id === occurrence.room_id &&
              isTimeOverlapping(occurrence.start_time, occurrence.end_time, existing.start_time, existing.end_time),
          )
          .map((existing) => joinScheduleWithRelations(existing, data.courses, data.rooms, data.instructors)),
  );
  const instructorConflicts = candidateOccurrences.flatMap((occurrence) =>
    candidateInstructor?.instructor_name.includes("미정")
      ? []
      : existingOccurrences
          .filter(
            (existing) =>
              existing.date === occurrence.date &&
              existing.instructor_id === occurrence.instructor_id &&
              isTimeOverlapping(occurrence.start_time, occurrence.end_time, existing.start_time, existing.end_time),
          )
          .map((existing) => joinScheduleWithRelations(existing, data.courses, data.rooms, data.instructors)),
  );
  const closureConflicts = candidateOccurrences
    .map((occurrence) => ({
      occurrence,
      closure: isRoomClosed(occurrence.room_id, occurrence.dateObj, occurrence.start_time, occurrence.end_time, data.closures),
    }))
    .filter((item) => Boolean(item.closure));

  const totalMinutes = candidateOccurrences.length * Math.max(0, minutesFromTime(candidateSchedule.end_time) - minutesFromTime(candidateSchedule.start_time));
  const conflictCount = roomConflicts.length + instructorConflicts.length + closureConflicts.length;
  const isReady = errors.length === 0 && conflictCount === 0;

  const courseRow = toTsv([
    courseDraft.course_id,
    courseDraft.category,
    courseDraft.course_name,
    "",
    courseDraft.start_date,
    courseDraft.end_date,
    courseDraft.total_hours,
    "",
    "",
    "",
    courseDraft.status,
    "web-draft",
    courseDraft.memo,
  ]);
  const scheduleRow = toTsv([
    candidateSchedule.schedule_id,
    candidateSchedule.course_id,
    candidateSchedule.room_id,
    candidateSchedule.instructor_id,
    candidateSchedule.start_date,
    candidateSchedule.end_date,
    candidateSchedule.days_of_week,
    candidateSchedule.start_time,
    candidateSchedule.end_time,
    candidateSchedule.schedule_type,
    candidateSchedule.status,
    candidateSchedule.memo,
    "web-draft",
  ]);

  const previewTitle = selectedCourse?.course_name || "과정명 미입력";
  const activeMode = modeOptions.find((item) => item.key === mode);
  const issuePreview = [...errors, ...warnings].slice(0, 3);
  const conflictPreview = [...roomConflicts, ...instructorConflicts].slice(0, 3);

  const courseCategories = useMemo(
    () => Array.from(new Set(data.courses.map((course) => course.category || "기타"))),
    [data.courses],
  );
  const filteredCourses = useMemo(() => {
    const keyword = compactSearch(courseSearch);
    const result = keyword
      ? data.courses.filter((course) =>
          compactSearch([course.course_name, course.category, course.status, course.memo].join(" ")).includes(keyword),
        )
      : data.courses;
    const selected = data.courses.find((course) => course.course_id === scheduleDraft.course_id);
    return selected && !result.some((course) => course.course_id === selected.course_id) ? [selected, ...result] : result;
  }, [courseSearch, data.courses, scheduleDraft.course_id]);
  const filteredSchedules = useMemo(() => {
    const keyword = compactSearch(scheduleSearch);
    const result = keyword
      ? data.schedules.filter((schedule) => compactSearch(scheduleLabel(schedule, data)).includes(keyword))
      : data.schedules;
    const selected = data.schedules.find((schedule) => schedule.schedule_id === scheduleDraft.schedule_id);
    return selected && !result.some((schedule) => schedule.schedule_id === selected.schedule_id) ? [selected, ...result] : result;
  }, [data, scheduleDraft.schedule_id, scheduleSearch]);

  useEffect(() => {
    let active = true;

    void fetch("/api/sheets/write", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ configured?: boolean }>)
      .then((result) => {
        if (!active) return;
        const configured = Boolean(result.configured);
        setWriteConfigured(configured);
        setSaveStatus("idle");
        setSaveMessage(
          configured
            ? "Google Sheets 바로 저장 연결이 준비되었습니다."
            : "바로 저장 연결이 아직 설정되지 않았습니다. Apps Script 배포 URL과 비밀키를 설정하면 이 버튼이 작동합니다.",
        );
      })
      .catch(() => {
        if (!active) return;
        setWriteConfigured(false);
        setSaveStatus("idle");
        setSaveMessage("바로 저장 연결 상태를 확인하지 못했습니다. 저장 시 다시 확인합니다.");
      });

    return () => {
      active = false;
    };
  }, []);

  const copyText = (label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1400);
    });
  };

  const saveToSheet = async () => {
    if (!isReady) {
      setSaveStatus("error");
      setSaveMessage("필수값과 중복 경고를 먼저 확인해야 저장할 수 있습니다.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("Google Sheets에 저장하고 있습니다.");

    const payload = {
      action: "saveDraft",
      mode,
      course:
        mode === "newCourse"
          ? {
              ...courseDraft,
              round_no: "",
              tuition_fee: "",
              self_payment: "",
              current_students: "",
              course_status: courseDraft.status,
              source_pdf: "web-app",
            }
          : undefined,
      schedule: {
        ...candidateSchedule,
        source_pdf: mode === "editSchedule" ? "web-app-edit" : "web-app",
      },
    };

    try {
      const response = await fetch("/api/sheets/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Google Sheets 저장에 실패했습니다.");
      }

      setWriteConfigured(true);
      setSaveStatus("success");
      setSaveMessage(result.message || "Google Sheets에 저장했습니다. 최신 데이터를 다시 불러옵니다.");
      window.setTimeout(() => router.refresh(), 900);
    } catch (error) {
      setWriteConfigured(false);
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Google Sheets 저장 중 오류가 발생했습니다.");
    }
  };

  const updateCourse = (key: keyof CourseDraft, value: string) => {
    setCourseDraft((current) => ({ ...current, [key]: value }));
    if (key === "course_id") setScheduleDraft((current) => ({ ...current, course_id: value }));
    if (key === "start_date") setScheduleDraft((current) => ({ ...current, start_date: value }));
    if (key === "end_date") setScheduleDraft((current) => ({ ...current, end_date: value }));
  };

  const updateSchedule = (key: keyof ScheduleDraft, value: string) => {
    setScheduleDraft((current) => ({ ...current, [key]: value }));
  };

  const selectExistingSchedule = (scheduleId: string) => {
    const selected = data.schedules.find((schedule) => schedule.schedule_id === scheduleId);
    if (!selected) return;
    setScheduleDraft({ ...selected });
  };

  const switchMode = (nextMode: DraftMode) => {
    setMode(nextMode);
    setCourseSearch("");
    setScheduleSearch("");
    if (nextMode === "newCourse") {
      setScheduleDraft((current) => ({
        ...current,
        schedule_id: nextScheduleId,
        course_id: courseDraft.course_id,
        start_date: courseDraft.start_date,
        end_date: courseDraft.end_date,
      }));
    }
    if (nextMode === "addSchedule") {
      setScheduleDraft((current) => ({
        ...current,
        schedule_id: nextScheduleId,
        course_id: defaultCourse?.course_id || current.course_id,
      }));
    }
    if (nextMode === "editSchedule" && firstSchedule) {
      setScheduleDraft({ ...firstSchedule });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-toss-gray-primary">시간표 작성</h2>
              <p className="text-sm font-semibold text-toss-gray-tertiary">과정명, 강의실, 강사를 선택하면 등록 전 중복 여부를 확인합니다.</p>
            </div>
          </div>
          <div className="bg-toss-bg p-1.5 rounded-[20px] grid grid-cols-1 sm:grid-cols-3 gap-1 xl:w-auto w-full">
            {modeOptions.map((item) => {
              const Icon = item.icon;
              const active = mode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => switchMode(item.key)}
                  className={cn(
                    "rounded-[16px] px-4 py-2.5 text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-center min-w-[140px]",
                    active
                      ? "bg-white text-toss-blue shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                      : "text-toss-gray-secondary hover:bg-white/50 hover:text-toss-gray-primary",
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Icon className={cn("h-4 w-4", active ? "text-toss-blue" : "text-toss-gray-tertiary")} />
                    {item.label}
                  </div>
                  <p className={cn("mt-0.5 text-[10px] font-semibold leading-none", active ? "text-toss-blue/70" : "text-toss-gray-tertiary")}>
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {/* 1. 과정 Card */}
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-toss-blue uppercase tracking-wider">1. 과정</p>
                <h3 className="mt-1 text-lg font-extrabold text-toss-gray-primary">{activeMode?.label}</h3>
              </div>
              <Badge className="border-0 ring-0 bg-toss-bg px-3.5 py-1.5 font-bold text-toss-gray-secondary text-xs">자동 ID 생성</Badge>
            </div>

            {mode === "editSchedule" ? (
              <div className="space-y-3">
                <label className="relative block">
                  <span className="sr-only">수정할 일정 검색</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
                  <input
                    value={scheduleSearch}
                    onChange={(event) => setScheduleSearch(event.target.value)}
                    placeholder="과정명, 강사, 강의실, 날짜로 검색"
                    className="w-full rounded-[14px] border-0 bg-toss-bg py-3 pl-9 pr-4 text-sm font-semibold text-toss-gray-primary outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-toss-blue"
                  />
                </label>
                <label className="text-xs font-bold text-toss-gray-secondary">수정할 일정</label>
                <select
                  value={scheduleDraft.schedule_id}
                  onChange={(event) => selectExistingSchedule(event.target.value)}
                  disabled={filteredSchedules.length === 0}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  {filteredSchedules.length === 0 ? (
                    <option value="">검색 결과가 없습니다</option>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <option key={schedule.schedule_id} value={schedule.schedule_id}>
                        {scheduleLabel(schedule, data)}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs font-semibold text-toss-gray-tertiary">
                  {filteredSchedules.length}개 일정 표시 중
                </p>
              </div>
            ) : mode === "newCourse" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-toss-gray-secondary">과정명</label>
                  <input
                    value={courseDraft.course_name}
                    onChange={(event) => updateCourse("course_name", event.target.value)}
                    placeholder="예: AI 콘텐츠 제작 실무 과정"
                    className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-toss-gray-secondary">분야</label>
                  <select
                    value={courseDraft.category}
                    onChange={(event) => updateCourse("category", event.target.value)}
                    className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                  >
                    {courseCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-toss-gray-secondary">총 시수</label>
                  <input
                    value={courseDraft.total_hours}
                    onChange={(event) => updateCourse("total_hours", event.target.value)}
                    inputMode="numeric"
                    placeholder="예: 60"
                    className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="relative block">
                  <span className="sr-only">과정 검색</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" aria-hidden="true" />
                  <input
                    value={courseSearch}
                    onChange={(event) => setCourseSearch(event.target.value)}
                    placeholder="과정명이나 분야로 검색"
                    className="w-full rounded-[14px] border-0 bg-toss-bg py-3 pl-9 pr-4 text-sm font-semibold text-toss-gray-primary outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-toss-blue"
                  />
                </label>
                <label className="text-xs font-bold text-toss-gray-secondary">과정 선택</label>
                <select
                  value={scheduleDraft.course_id}
                  onChange={(event) => updateSchedule("course_id", event.target.value)}
                  disabled={filteredCourses.length === 0}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  {filteredCourses.length === 0 ? (
                    <option value="">검색 결과가 없습니다</option>
                  ) : (
                    filteredCourses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs font-semibold text-toss-gray-tertiary">
                  {filteredCourses.length}개 과정 표시 중
                </p>
              </div>
            )}
          </div>

          {/* 2. 기간과 시간 Card */}
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <p className="text-xs font-bold text-toss-blue uppercase tracking-wider mb-4">2. 기간과 시간</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">시작일</label>
                <input
                  type="date"
                  value={scheduleDraft.start_date}
                  onChange={(event) => {
                    updateSchedule("start_date", event.target.value);
                    if (mode === "newCourse") updateCourse("start_date", event.target.value);
                  }}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">종료일</label>
                <input
                  type="date"
                  value={scheduleDraft.end_date}
                  onChange={(event) => {
                    updateSchedule("end_date", event.target.value);
                    if (mode === "newCourse") updateCourse("end_date", event.target.value);
                  }}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">요일</label>
                <select
                  value={dayOptions.includes(scheduleDraft.days_of_week) ? scheduleDraft.days_of_week : "직접입력"}
                  onChange={(event) => updateSchedule("days_of_week", event.target.value === "직접입력" ? "" : event.target.value)}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  {dayOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value="직접입력">직접 입력</option>
                </select>
              </div>
              {!dayOptions.includes(scheduleDraft.days_of_week) ? (
                <div className="space-y-2 md:col-span-3">
                  <label className="text-xs font-bold text-toss-gray-secondary">요일 직접 입력</label>
                  <input
                    value={scheduleDraft.days_of_week}
                    onChange={(event) => updateSchedule("days_of_week", event.target.value)}
                    placeholder="예: 월,수,목"
                    className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">시작 시간</label>
                <input
                  type="time"
                  value={scheduleDraft.start_time}
                  onChange={(event) => updateSchedule("start_time", event.target.value)}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">종료 시간</label>
                <input
                  type="time"
                  value={scheduleDraft.end_time}
                  onChange={(event) => updateSchedule("end_time", event.target.value)}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">상태</label>
                <select
                  value={scheduleDraft.status}
                  onChange={(event) => {
                    updateSchedule("status", event.target.value);
                    if (mode === "newCourse") updateCourse("status", event.target.value);
                  }}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  <option value="운영예정">운영예정</option>
                  <option value="운영중">운영중</option>
                  <option value="검토필요">검토필요</option>
                  <option value="보류">보류</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. 배정 Card */}
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <p className="text-xs font-bold text-toss-blue uppercase tracking-wider mb-4">3. 배정</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">강의실</label>
                <select
                  value={scheduleDraft.room_id}
                  onChange={(event) => updateSchedule("room_id", event.target.value)}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  {data.rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-toss-gray-secondary">담당 강사</label>
                <select
                  value={scheduleDraft.instructor_id}
                  onChange={(event) => updateSchedule("instructor_id", event.target.value)}
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                >
                  {data.instructors.map((instructor) => (
                    <option key={instructor.instructor_id} value={instructor.instructor_id}>
                      {instructor.instructor_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-toss-gray-secondary">메모</label>
                <input
                  value={scheduleDraft.memo}
                  onChange={(event) => {
                    updateSchedule("memo", event.target.value);
                    if (mode === "newCourse") updateCourse("memo", event.target.value);
                  }}
                  placeholder="변경 사유나 확인할 내용을 적어두세요."
                  className="w-full rounded-[14px] bg-toss-bg px-4 py-3 text-toss-gray-primary outline-none transition-all duration-200 border-0 focus:bg-white focus:ring-2 focus:ring-toss-blue text-sm font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {/* 등록 전 확인 Card */}
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-toss-gray-tertiary">등록 전 확인</p>
                <h3 className="mt-1 text-lg font-black text-toss-gray-primary leading-snug">{previewTitle}</h3>
              </div>
              <div
                className={cn(
                  "rounded-[16px] p-3 transition-colors duration-200 shrink-0",
                  isReady ? "bg-emerald-50 text-emerald-600" : conflictCount ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
                )}
              >
                {isReady ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-toss-bg p-4.5">
                <p className="text-xs font-bold text-toss-gray-secondary">수업일</p>
                <p className="mt-1 text-2xl font-black text-toss-gray-primary">{candidateOccurrences.length}일</p>
              </div>
              <div className="rounded-[18px] bg-toss-bg p-4.5">
                <p className="text-xs font-bold text-toss-gray-secondary">예상 시수</p>
                <p className="mt-1 text-2xl font-black text-toss-gray-primary">{humanizeDuration(totalMinutes)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-toss-bg p-4.5 text-sm text-toss-gray-secondary space-y-1.5">
              <p className="font-extrabold text-toss-gray-primary">
                {candidateRoom?.room_name || "강의실 미정"} · {candidateInstructor?.instructor_name || "강사 미정"}
              </p>
              <p className="text-xs font-semibold leading-none">{candidateSchedule.start_date} - {candidateSchedule.end_date}</p>
              <p className="text-xs font-semibold leading-none">
                {candidateSchedule.days_of_week || "요일 미입력"} · {candidateSchedule.start_time} - {candidateSchedule.end_time}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {isReady ? (
                <p className="rounded-[14px] bg-emerald-50 p-4 text-xs font-bold text-emerald-800 leading-normal">
                  현재 데이터 기준으로 겹치는 일정이 없습니다.
                </p>
              ) : null}
              {issuePreview.map((message) => (
                <p key={message} className="rounded-[14px] bg-amber-50 p-4 text-xs font-bold text-amber-800 leading-normal">
                  {message}
                </p>
              ))}
              {conflictPreview.map((conflict) => (
                <p
                  key={`${conflict.schedule_id}-${conflict.date}-${conflict.room_id}-${conflict.instructor_id}`}
                  className="rounded-[14px] bg-red-50 p-4 text-xs font-bold text-red-800 leading-normal"
                >
                  {conflict.date} {conflict.start_time}-{conflict.end_time} · {conflict.courseName}
                </p>
              ))}
              {closureConflicts.slice(0, 2).map(({ occurrence, closure }) => (
                <p
                  key={`${occurrence.date}-${closure?.closure_id}`}
                  className="rounded-[14px] bg-purple-50 p-4 text-xs font-bold text-purple-800 leading-normal"
                >
                  {occurrence.date} · {closure?.closure_type}와 겹칩니다.
                </p>
              ))}
              {conflictCount > conflictPreview.length + closureConflicts.slice(0, 2).length ? (
                <p className="text-xs font-bold text-red-600 pl-1">
                  외 {conflictCount - conflictPreview.length - closureConflicts.slice(0, 2).length}건 더 있습니다.
                </p>
              ) : null}
            </div>
          </div>

          {/* Google Sheets 바로 저장 Card */}
          <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5 text-toss-blue" />
                <h3 className="font-extrabold text-toss-gray-primary">Google Sheets 바로 저장</h3>
              </div>
              <Badge
                className={cn(
                  "border-0 ring-0 px-3 py-1 text-[11px] font-black",
                  writeConfigured
                    ? "bg-emerald-50 text-emerald-700"
                    : writeConfigured === false
                      ? "bg-amber-50 text-amber-800"
                      : "bg-toss-bg text-toss-gray-secondary",
                )}
              >
                {writeConfigured ? "연결됨" : writeConfigured === false ? "설정 필요" : "확인 중"}
              </Badge>
            </div>

            <p className="mt-2 text-xs font-semibold leading-relaxed text-toss-gray-tertiary">
              검사 결과에 문제가 없으면 courses와 schedules 탭에 바로 기록합니다. 저장 후 화면을 다시 불러옵니다.
            </p>

            <button
              type="button"
              onClick={() => void saveToSheet()}
              disabled={!isReady || saveStatus === "saving"}
              className={cn(
                "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
                isReady && saveStatus !== "saving"
                  ? "bg-toss-blue text-white shadow-sm hover:bg-toss-blue-hover"
                  : "cursor-not-allowed bg-toss-bg text-toss-gray-tertiary",
              )}
            >
              {saveStatus === "saving" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveStatus === "saving" ? "저장 중" : mode === "editSchedule" ? "수정 내용 저장" : "시트에 바로 저장"}
            </button>

            <p
              className={cn(
                "mt-4 rounded-[14px] p-4 text-xs font-bold leading-relaxed",
                saveStatus === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : saveStatus === "error" || writeConfigured === false
                    ? "bg-amber-50 text-amber-800"
                    : "bg-toss-bg text-toss-gray-secondary",
              )}
            >
              {saveMessage}
            </p>

            {writeConfigured === false ? (
              <details className="mt-3 rounded-[16px] bg-toss-bg p-4 text-xs font-semibold text-toss-gray-secondary">
                <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-toss-gray-primary outline-none select-none">
                  자동 저장 연결 방법
                  <Settings2 className="h-4 w-4" />
                </summary>
                <div className="mt-3 space-y-2 leading-relaxed">
                  <p>1. Google Sheets에서 확장 프로그램 &gt; Apps Script를 엽니다.</p>
                  <p>2. scripts/google-sheets-write-webapp.gs 내용을 붙여넣고 Web App으로 배포합니다.</p>
                  <p>3. .env.local에 GOOGLE_SHEETS_WRITE_WEB_APP_URL과 GOOGLE_SHEETS_WRITE_SECRET을 넣고 서버를 재시작합니다.</p>
                </div>
              </details>
            ) : null}
          </div>

          {/* 수동 복사 백업 */}
          <div className="rounded-[20px] bg-white p-4 shadow-toss border-0">
            <button
              type="button"
              onClick={() => setShowManualBackup((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left text-sm font-extrabold text-toss-gray-secondary outline-none transition hover:text-toss-gray-primary"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                수동 복사 백업
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showManualBackup ? "rotate-180" : "")} />
            </button>

            {showManualBackup ? (
              <>
                <p className="mt-3 text-xs font-semibold text-toss-gray-tertiary leading-relaxed">
                  자동 저장 연결이 막혔을 때만 열어서 사용하세요.
                </p>

                <div className="mt-5 grid gap-2.5">
                  {mode === "newCourse" ? (
                    <button
                      type="button"
                      onClick={() => copyText("course", courseRow)}
                      className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-toss-blue hover:bg-toss-blue-hover text-white px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] w-full shadow-sm"
                    >
                      <Copy className="h-4 w-4" />
                      {copied === "course" ? "과정 행 복사됨" : "과정 행 복사"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => copyText("schedule", scheduleRow)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] w-full",
                      mode === "newCourse"
                        ? "bg-toss-blue-light hover:bg-[#d8ecff] text-toss-blue"
                        : "bg-toss-blue hover:bg-toss-blue-hover text-white shadow-sm",
                    )}
                  >
                    <Copy className="h-4 w-4" />
                    {copied === "schedule" ? "시간표 행 복사됨" : mode === "editSchedule" ? "수정안 행 복사" : "시간표 행 복사"}
                  </button>
                </div>

                <details className="mt-4 rounded-[16px] bg-toss-bg p-4.5 text-xs font-semibold text-toss-gray-secondary">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-toss-gray-primary outline-none select-none">
                    고급: 자동 생성된 시트 값 보기
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="mt-3.5 space-y-3.5">
                    {mode === "newCourse" ? (
                      <div>
                        <p className="mb-1.5 text-[10px] font-bold text-toss-gray-tertiary">courses 행 · 자동 ID {courseDraft.course_id}</p>
                        <div className="break-all rounded-[12px] bg-[#191f28] p-3.5 font-mono text-[10px] text-white leading-normal max-h-32 overflow-y-auto">{courseRow}</div>
                      </div>
                    ) : null}
                    <div>
                      <p className="mb-1.5 text-[10px] font-bold text-toss-gray-tertiary">schedules 행 · 자동 ID {candidateSchedule.schedule_id}</p>
                      <div className="break-all rounded-[12px] bg-[#191f28] p-3.5 font-mono text-[10px] text-white leading-normal max-h-32 overflow-y-auto">{scheduleRow}</div>
                    </div>
                  </div>
                </details>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

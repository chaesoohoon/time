import type { Closure, Course, Instructor, RawRow, ReviewNote, Room, Schedule } from "@/types";
import { normalizeDateText, parseTime } from "./dateUtils";

function cleanKey(key: string): string {
  return key.replace(/^\uFEFF/, "").trim();
}

function cleanValue(value: unknown): string {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function value(row: RawRow, keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return "";
}

function toBoolean(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (["false", "0", "n", "no", "아니오", "비활성", "inactive"].includes(normalized)) return false;
  return true;
}

function toNumber(text: string): number | null {
  const digits = text.replace(/[^\d.-]/g, "");
  if (!digits) return null;
  const numeric = Number(digits);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeRows(rows: RawRow[]): RawRow[] {
  return rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, cellValue]) => [cleanKey(key), cleanValue(cellValue)]),
      ) as RawRow,
    )
    .filter((row) => Object.values(row).some((cellValue) => cleanValue(cellValue).length > 0));
}

export function normalizeRooms(rows: RawRow[]): Room[] {
  return normalizeRows(rows).map((row) => ({
    room_id: value(row, ["room_id"]),
    room_name: value(row, ["room_name"]) || "미확인 강의실",
    room_type: value(row, ["room_type"]) || "미정",
    capacity: toNumber(value(row, ["capacity"])),
    floor: value(row, ["floor"]),
    equipment: value(row, ["equipment"]),
    is_active: toBoolean(value(row, ["is_active"])),
    memo: value(row, ["memo"]),
  }));
}

export function normalizeInstructors(rows: RawRow[]): Instructor[] {
  return normalizeRows(rows).map((row) => ({
    instructor_id: value(row, ["instructor_id"]),
    instructor_name: value(row, ["instructor_name"]) || "미확인 강사",
    field: value(row, ["field"]),
    phone: value(row, ["phone"]),
    email: value(row, ["email"]),
    is_active: toBoolean(value(row, ["is_active"])),
    memo: value(row, ["memo"]),
  }));
}

export function normalizeCourses(rows: RawRow[]): Course[] {
  return normalizeRows(rows).map((row) => ({
    course_id: value(row, ["course_id"]),
    course_name: value(row, ["course_name"]) || "미확인 과정",
    category: value(row, ["category"]) || "기타",
    start_date: normalizeDateText(value(row, ["start_date"])),
    end_date: normalizeDateText(value(row, ["end_date"])),
    total_hours: toNumber(value(row, ["total_hours"])),
    status: value(row, ["status", "course_status"]) || "상태 미정",
    memo: value(row, ["memo"]),
  }));
}

export function normalizeSchedules(rows: RawRow[]): Schedule[] {
  return normalizeRows(rows).map((row) => ({
    schedule_id: value(row, ["schedule_id"]),
    course_id: value(row, ["course_id"]),
    room_id: value(row, ["room_id"]),
    instructor_id: value(row, ["instructor_id"]),
    start_date: normalizeDateText(value(row, ["start_date"])),
    end_date: normalizeDateText(value(row, ["end_date"])),
    days_of_week: value(row, ["days_of_week"]),
    start_time: parseTime(value(row, ["start_time"])),
    end_time: parseTime(value(row, ["end_time"])),
    schedule_type: value(row, ["schedule_type"]) || "정규수업",
    status: value(row, ["status"]) || "상태 미정",
    memo: value(row, ["memo"]),
  }));
}

export function normalizeClosures(rows: RawRow[]): Closure[] {
  return normalizeRows(rows).map((row) => ({
    closure_id: value(row, ["closure_id"]),
    date: normalizeDateText(value(row, ["date"])),
    room_id: value(row, ["room_id"]),
    closure_type: value(row, ["closure_type"]) || "사용 제한",
    start_time: parseTime(value(row, ["start_time"])),
    end_time: parseTime(value(row, ["end_time"])),
    memo: value(row, ["memo"]),
  }));
}

export function normalizeReviewNotes(rows: RawRow[]): ReviewNote[] {
  return normalizeRows(rows).map((row, index) => {
    const category = value(row, ["구분", "검토구분", "category", "type"]) || "기타 확인사항";
    const target = value(row, ["대상", "내용", "target", "course_name"]) || value(row, ["관련 ID", "related_id"]);
    const content = value(row, ["내용", "content", "메모", "memo"]) || target;
    const relatedId = value(row, ["관련 ID", "related_id", "schedule_id", "course_id"]);

    return {
      id: value(row, ["번호", "id", "note_id"]) || `RN-${index + 1}`,
      category,
      target,
      content,
      status: value(row, ["상태", "status"]) || "확인 필요",
      memo: value(row, ["메모", "memo", "비고", "note"]),
      related_id: relatedId,
    };
  });
}

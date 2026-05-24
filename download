import type { RawRow, SheetData } from "@/types";
import { parseCsv } from "./csv";
import { SHEET_ID } from "./constants";
import {
  normalizeClosures,
  normalizeCourses,
  normalizeInstructors,
  normalizeReviewNotes,
  normalizeRooms,
  normalizeRows,
  normalizeSchedules,
} from "./normalize";

export type SheetName =
  | "rooms"
  | "instructors"
  | "courses"
  | "schedules"
  | "closures"
  | "review_notes"
  | "dashboard_sample";

export async function fetchSheetCsv(sheetName: SheetName): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets 데이터를 불러오지 못했습니다. 시트 공유 설정 또는 시트 이름을 확인하세요. sheet=${sheetName}`,
    );
  }

  const text = await response.text();
  if (/^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    throw new Error(
      `Google Sheets 데이터를 불러오지 못했습니다. 시트 공유 설정 또는 시트 이름을 확인하세요. sheet=${sheetName}`,
    );
  }

  return text;
}

export async function fetchSheetRows<T = RawRow>(sheetName: SheetName): Promise<T[]> {
  const csv = await fetchSheetCsv(sheetName);
  return parseCsv(csv) as T[];
}

let lastSuccessfulData: SheetData | null = null;

export async function loadAllSheetData(): Promise<SheetData> {
  try {
    const [rooms, instructors, courses, schedules, closures, reviewNotes, dashboardSample] = await Promise.all([
      fetchSheetRows("rooms"),
      fetchSheetRows("instructors"),
      fetchSheetRows("courses"),
      fetchSheetRows("schedules"),
      fetchSheetRows("closures"),
      fetchSheetRows("review_notes"),
      fetchSheetRows("dashboard_sample"),
    ]);

    const data: SheetData = {
      rooms: normalizeRooms(rooms),
      instructors: normalizeInstructors(instructors),
      courses: normalizeCourses(courses),
      schedules: normalizeSchedules(schedules),
      closures: normalizeClosures(closures),
      reviewNotes: normalizeReviewNotes(reviewNotes),
      dashboardSample: normalizeRows(dashboardSample),
    };

    lastSuccessfulData = data;
    return data;
  } catch (error) {
    console.error("Google Sheets fetch failed:", error);
    if (lastSuccessfulData) {
      console.warn("Using last successful in-memory cached data as fallback.");
      return lastSuccessfulData;
    }
    throw error;
  }
}

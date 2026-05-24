import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SheetCellValue = string | number | null;

type CourseWriteRow = {
  course_id: string;
  category: string;
  course_name: string;
  round_no?: string;
  start_date: string;
  end_date: string;
  total_hours?: string | number;
  tuition_fee?: string | number;
  self_payment?: string | number;
  current_students?: string | number;
  course_status?: string;
  source_pdf?: string;
  memo?: string;
};

type ScheduleWriteRow = {
  schedule_id: string;
  course_id: string;
  room_id: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  schedule_type?: string;
  status?: string;
  memo?: string;
  source_pdf?: string;
};

type WritePayload = {
  action?: "saveDraft";
  mode?: "newCourse" | "addSchedule" | "editSchedule";
  course?: Partial<CourseWriteRow>;
  schedule?: Partial<ScheduleWriteRow>;
};

const requiredCourseFields: Array<keyof CourseWriteRow> = [
  "course_id",
  "category",
  "course_name",
  "start_date",
  "end_date",
];

const requiredScheduleFields: Array<keyof ScheduleWriteRow> = [
  "schedule_id",
  "course_id",
  "room_id",
  "instructor_id",
  "start_date",
  "end_date",
  "days_of_week",
  "start_time",
  "end_time",
];

function cleanCell(value: unknown): SheetCellValue {
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (value === null || value === undefined) return "";
  return String(value).replace(/\t|\r?\n/g, " ").trim();
}

function cleanObject<T extends Record<string, unknown>>(value: Partial<T>, keys: Array<keyof T>) {
  return keys.reduce<Record<string, SheetCellValue>>((row, key) => {
    row[String(key)] = cleanCell(value[key]);
    return row;
  }, {});
}

function missingFields<T extends Record<string, unknown>>(value: Partial<T> | undefined, keys: Array<keyof T>) {
  if (!value) return keys.map(String);
  return keys.filter((key) => !cleanCell(value[key])).map(String);
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GOOGLE_SHEETS_WRITE_WEB_APP_URL && process.env.GOOGLE_SHEETS_WRITE_SECRET),
  });
}

export async function POST(request: Request) {
  const webAppUrl = process.env.GOOGLE_SHEETS_WRITE_WEB_APP_URL;
  const secret = process.env.GOOGLE_SHEETS_WRITE_SECRET;

  if (!webAppUrl || !secret) {
    return NextResponse.json(
      {
        ok: false,
        code: "WRITE_INTEGRATION_NOT_CONFIGURED",
        error:
          "Google Sheets 바로 저장 연결이 아직 설정되지 않았습니다. GOOGLE_SHEETS_WRITE_WEB_APP_URL과 GOOGLE_SHEETS_WRITE_SECRET을 설정하세요.",
      },
      { status: 501 },
    );
  }

  let payload: WritePayload;
  try {
    payload = (await request.json()) as WritePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "저장 요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (payload.action !== "saveDraft") {
    return NextResponse.json({ ok: false, error: "지원하지 않는 저장 요청입니다." }, { status: 400 });
  }

  const courseMissing = payload.mode === "newCourse" ? missingFields(payload.course, requiredCourseFields) : [];
  const scheduleMissing = missingFields(payload.schedule, requiredScheduleFields);

  if (courseMissing.length || scheduleMissing.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "필수 입력값이 비어 있습니다.",
        missing: { course: courseMissing, schedule: scheduleMissing },
      },
      { status: 400 },
    );
  }

  const courseKeys: Array<keyof CourseWriteRow> = [
    "course_id",
    "category",
    "course_name",
    "round_no",
    "start_date",
    "end_date",
    "total_hours",
    "tuition_fee",
    "self_payment",
    "current_students",
    "course_status",
    "source_pdf",
    "memo",
  ];
  const scheduleKeys: Array<keyof ScheduleWriteRow> = [
    "schedule_id",
    "course_id",
    "room_id",
    "instructor_id",
    "start_date",
    "end_date",
    "days_of_week",
    "start_time",
    "end_time",
    "schedule_type",
    "status",
    "memo",
    "source_pdf",
  ];

  const body = {
    secret,
    action: "saveDraft",
    mode: payload.mode,
    course: payload.mode === "newCourse" && payload.course ? cleanObject<CourseWriteRow>(payload.course, courseKeys) : null,
    schedule: payload.schedule ? cleanObject<ScheduleWriteRow>(payload.schedule, scheduleKeys) : null,
  };

  try {
    const response = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const responseText = await response.text();
    const result = parseJson(responseText);

    if (!response.ok || result.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof result.error === "string"
              ? result.error
              : "Google Sheets 저장에 실패했습니다. Apps Script 배포 URL과 권한을 확인하세요.",
          detail: result,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Google Sheets에 저장했습니다. 새로고침하면 최신 데이터가 반영됩니다.",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Google Sheets 저장 요청을 보낼 수 없습니다.",
        detail: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 502 },
    );
  }
}

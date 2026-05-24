import type { SheetName } from "./googleSheets";

export const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || "1E-L-1WfHiqmFey0oPwmSjaRvljAsiFbQk9japkGQ7eI";

export const SHEET_NAMES = [
  "rooms",
  "instructors",
  "courses",
  "schedules",
  "closures",
  "review_notes",
  "dashboard_sample",
] satisfies SheetName[];

export const TIME_ZONE = "Asia/Seoul";

export const KOREAN_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
export const KOREAN_WORKWEEK = ["월", "화", "수", "목", "금"] as const;
export const KOREAN_DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;

export const CATEGORY_COLORS: Record<string, { soft: string; text: string; dot: string; bar: string }> = {
  정보기술: { soft: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", bar: "bg-sky-400" },
  건축설계: { soft: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", bar: "bg-indigo-400" },
  디자인: { soft: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500", bar: "bg-fuchsia-400" },
  영상편집: { soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", bar: "bg-violet-400" },
  영상편집디자인: { soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", bar: "bg-violet-400" },
  회계세무: { soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  사무행정: { soft: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500", bar: "bg-cyan-400" },
  바리스타: { soft: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", bar: "bg-amber-400" },
  제과제빵: { soft: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", bar: "bg-rose-400" },
  미용: { soft: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500", bar: "bg-pink-400" },
  기타: { soft: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400", bar: "bg-slate-400" },
};

export const STATUS_STYLES = {
  "in-use": {
    label: "사용 중",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    border: "border-blue-200",
    accent: "bg-blue-500",
  },
  "available": {
    label: "비어 있음",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },
  "ending-soon": {
    label: "곧 종료",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },
  "no-reservation": {
    label: "예약 없음",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    border: "border-slate-200",
    accent: "bg-slate-400",
  },
  "closed": {
    label: "휴강/점검",
    badge: "bg-purple-50 text-purple-700 ring-purple-200",
    border: "border-purple-200",
    accent: "bg-purple-500",
  },
  "conflict": {
    label: "중복 경고",
    badge: "bg-red-50 text-red-700 ring-red-200",
    border: "border-red-300",
    accent: "bg-red-500",
  },
} as const;

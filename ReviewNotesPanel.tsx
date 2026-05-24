"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarRange,
  DoorOpen,
  LayoutDashboard,
  PenLine,
  Search,
  Timeline,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SheetData } from "@/types";
import { getKstNow } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import ConflictPanel from "./ConflictPanel";
import EmptyRoomFinder from "./EmptyRoomFinder";
import InstructorView from "./InstructorView";
import MonthlyCalendar from "./MonthlyCalendar";
import ReviewNotesPanel from "./ReviewNotesPanel";
import RoomView from "./RoomView";
import ScheduleDraftBuilder from "./ScheduleDraftBuilder";
import SearchExplorer from "./SearchExplorer";
import TodayRoomStatus from "./TodayRoomStatus";
import WeeklySchedule from "./WeeklySchedule";
import YearlyCourses from "./YearlyCourses";

type TabKey =
  | "today"
  | "search"
  | "week"
  | "month"
  | "year"
  | "room"
  | "instructor"
  | "empty"
  | "draft"
  | "issues";

type TabItem = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const tabs: TabItem[] = [
  { key: "today", label: "오늘 현황", icon: LayoutDashboard },
  { key: "search", label: "통합 검색", icon: Search },
  { key: "week", label: "주간 시간표", icon: CalendarDays },
  { key: "month", label: "월간 시간표", icon: CalendarRange },
  { key: "year", label: "연간 일정", icon: Timeline },
  { key: "room", label: "강의실별", icon: Building2 },
  { key: "instructor", label: "강사별", icon: UserRound },
  { key: "empty", label: "빈 강의실 찾기", icon: DoorOpen },
  { key: "draft", label: "시간표 작성", icon: PenLine },
  { key: "issues", label: "중복/확인사항", icon: AlertTriangle },
];

type DashboardTabsProps = {
  data: SheetData;
};

export default function DashboardTabs({ data }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [now, setNow] = useState(getKstNow());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(getKstNow()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <nav className="sticky top-4 z-20 -mx-3 overflow-x-auto px-3 md:overflow-visible">
        <div className="flex min-w-max gap-1 rounded-[22px] bg-white/80 p-2 shadow-toss backdrop-blur-md md:min-w-0 md:flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "bg-toss-blue text-white shadow-[0_4px_12px_rgba(49,130,246,0.25)]"
                    : "text-toss-gray-secondary hover:bg-toss-bg hover:text-toss-gray-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "today" ? <TodayRoomStatus data={data} now={now} /> : null}
      {activeTab === "search" ? <SearchExplorer data={data} /> : null}
      {activeTab === "week" ? <WeeklySchedule data={data} /> : null}
      {activeTab === "month" ? <MonthlyCalendar data={data} /> : null}
      {activeTab === "year" ? <YearlyCourses data={data} /> : null}
      {activeTab === "room" ? <RoomView data={data} now={now} /> : null}
      {activeTab === "instructor" ? <InstructorView data={data} now={now} /> : null}
      {activeTab === "empty" ? <EmptyRoomFinder data={data} /> : null}
      {activeTab === "draft" ? <ScheduleDraftBuilder data={data} /> : null}
      {activeTab === "issues" ? (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[24px] bg-white p-6 shadow-toss">
              <div className="flex items-center gap-4">
                <div className="rounded-[16px] bg-red-50 p-3 text-red-600">
                  <UsersRound className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-toss-gray-primary">운영 리스크 보드</h2>
                  <p className="text-sm font-medium text-toss-gray-secondary">중복 배정과 행정 확인사항을 한 화면에서 점검합니다.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-6 shadow-toss">
              <p className="text-sm font-bold text-toss-gray-tertiary">데이터 기준</p>
              <p className="mt-2 text-lg font-black text-toss-gray-primary">rooms · instructors · courses · schedules · closures · review_notes</p>
            </div>
          </div>
          <ConflictPanel data={data} />
          <ReviewNotesPanel data={data} />
        </div>
      ) : null}
    </div>
  );
}

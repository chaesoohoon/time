"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { BookOpenCheck, Building2, CalendarDays, Clock3, Search, UserRound } from "lucide-react";
import type { JoinedSchedule, Schedule, SheetData } from "@/types";
import { formatDateKey, getKoreanDayOfWeek, humanizeDuration, parseDate } from "@/lib/dateUtils";
import { expandSchedulesByDate, joinScheduleWithRelations } from "@/lib/scheduleUtils";
import { categoryStyle, cn } from "@/lib/utils";
import Badge from "./Badge";
import EmptyState from "./EmptyState";
import StatCard from "./StatCard";

type SearchExplorerProps = {
  data: SheetData;
};

type SearchMode = "course" | "instructor" | "room";

type SearchOption = {
  id: string;
  label: string;
  description: string;
  meta: string;
  searchText: string;
};

const modes: Array<{ key: SearchMode; label: string; icon: typeof BookOpenCheck; placeholder: string }> = [
  { key: "course", label: "과정", icon: BookOpenCheck, placeholder: "과정명을 검색하세요" },
  { key: "instructor", label: "강사", icon: UserRound, placeholder: "강사명을 검색하세요" },
  { key: "room", label: "강의실", icon: Building2, placeholder: "강의실명을 검색하세요" },
];

function compact(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function dateRangeFromSchedules(schedules: Schedule[]) {
  const starts = schedules.map((schedule) => parseDate(schedule.start_date)).filter((date): date is Date => Boolean(date));
  const ends = schedules.map((schedule) => parseDate(schedule.end_date)).filter((date): date is Date => Boolean(date));
  if (!starts.length || !ends.length) return null;
  const start = new Date(Math.min(...starts.map((date) => date.getTime())));
  const end = new Date(Math.max(...ends.map((date) => date.getTime())));
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return {
    start,
    end,
    dates: Array.from({ length: Math.max(1, dayCount) }, (_, index) => addDays(start, index)),
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getInstructorName(data: SheetData, schedule: Schedule) {
  return data.instructors.find((instructor) => instructor.instructor_id === schedule.instructor_id)?.instructor_name || "미확인 강사";
}

function scheduleMatchesInstructor(data: SheetData, schedule: Schedule, instructorId: string) {
  const instructor = data.instructors.find((item) => item.instructor_id === instructorId);
  if (!instructor) return false;
  const selectedName = compact(instructor.instructor_name);
  const scheduleInstructorName = compact(getInstructorName(data, schedule));
  return schedule.instructor_id === instructorId || (selectedName !== "미정" && scheduleInstructorName.includes(selectedName));
}

function formatDateRange(start: Date, end: Date) {
  return `${formatDateKey(start)} - ${formatDateKey(end)}`;
}

function groupByMonth(schedules: JoinedSchedule[]) {
  return schedules.reduce<Array<{ key: string; label: string; items: JoinedSchedule[] }>>((groups, schedule) => {
    const key = format(schedule.dateObj, "yyyy-MM");
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.items.push(schedule);
      return groups;
    }
    return [...groups, { key, label: format(schedule.dateObj, "yyyy년 M월"), items: [schedule] }];
  }, []);
}

export default function SearchExplorer({ data }: SearchExplorerProps) {
  const [mode, setMode] = useState<SearchMode>("course");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const options = useMemo<SearchOption[]>(() => {
    if (mode === "course") {
      return data.courses.map((course) => ({
        id: course.course_id,
        label: course.course_name,
        description: `${course.start_date} - ${course.end_date}`,
        meta: `${course.category || "기타"} · ${course.status || "상태 미정"}`,
        searchText: [course.course_name, course.category, course.status, course.memo].join(" "),
      }));
    }
    if (mode === "instructor") {
      return data.instructors
        .filter((instructor) => instructor.is_active)
        .map((instructor) => ({
          id: instructor.instructor_id,
          label: instructor.instructor_name,
          description: instructor.field || "분야 미정",
          meta: instructor.memo || "활성 강사",
          searchText: [instructor.instructor_name, instructor.field, instructor.memo].join(" "),
        }));
    }
    return data.rooms
      .filter((room) => room.is_active)
      .map((room) => ({
        id: room.room_id,
        label: room.room_name,
        description: room.room_type || "강의실 유형 미정",
        meta: [room.floor, room.equipment].filter(Boolean).join(" · ") || "등록 정보 확인",
        searchText: [room.room_name, room.room_type, room.floor, room.equipment, room.memo].join(" "),
      }));
  }, [data.courses, data.instructors, data.rooms, mode]);

  const filteredOptions = useMemo(() => {
    const keyword = compact(query);
    if (!keyword) return options;
    return options.filter((option) => [option.label, option.description, option.meta, option.searchText].some((value) => compact(value).includes(keyword)));
  }, [options, query]);

  const selectedOption = options.find((option) => option.id === selectedId) || null;
  const rawSchedules = useMemo(() => {
    if (!selectedId) return [];
    if (mode === "course") return data.schedules.filter((schedule) => schedule.course_id === selectedId);
    if (mode === "instructor") return data.schedules.filter((schedule) => scheduleMatchesInstructor(data, schedule, selectedId));
    return data.schedules.filter((schedule) => schedule.room_id === selectedId);
  }, [data, mode, selectedId]);

  const range = dateRangeFromSchedules(rawSchedules);
  const expandedSchedules = range
    ? expandSchedulesByDate(rawSchedules, range).map((schedule) =>
        joinScheduleWithRelations(schedule, data.courses, data.rooms, data.instructors),
      )
    : [];
  const courseNames = unique(expandedSchedules.map((schedule) => schedule.courseName));
  const instructorNames = unique(expandedSchedules.map((schedule) => schedule.instructorName));
  const roomNames = unique(expandedSchedules.map((schedule) => schedule.roomName));
  const totalMinutes = expandedSchedules.reduce(
    (sum, schedule) => sum + Math.max(0, (schedule.endDateTime.getTime() - schedule.startDateTime.getTime()) / 60000),
    0,
  );
  const monthlyGroups = groupByMonth(expandedSchedules);

  const activeMode = modes.find((item) => item.key === mode) || modes[0];

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-toss-gray-primary">통합 검색</h2>
              <p className="text-sm font-semibold text-toss-gray-tertiary">과정, 강사, 강의실을 선택하여 전체 수업 흐름을 통합 조회합니다.</p>
            </div>
          </div>
          <div className="flex gap-1.5 bg-toss-bg p-1.5 rounded-[16px] xl:w-[400px]">
            {modes.map((item) => {
              const Icon = item.icon;
              const active = mode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setMode(item.key);
                    setSelectedId("");
                    setQuery("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-[12px] py-2 text-sm font-bold transition-all",
                    active ? "bg-white text-toss-blue shadow-sm font-extrabold" : "text-toss-gray-secondary hover:bg-white/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-[20px] bg-toss-bg p-5 space-y-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-gray-tertiary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={activeMode.placeholder}
                className="w-full rounded-[12px] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-toss-gray-primary border border-toss-border outline-none transition-all focus:border-toss-blue focus:ring-2 focus:ring-toss-blue/30"
              />
            </label>
            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
              {filteredOptions.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-toss-border bg-white p-6 text-center text-sm text-toss-gray-tertiary">
                  검색 결과가 없습니다.
                </div>
              ) : null}
              {filteredOptions.map((option) => {
                const active = selectedId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedId(option.id)}
                    className={cn(
                      "w-full rounded-[16px] border-0 p-4 text-left transition-all shadow-sm",
                      active ? "bg-toss-blue text-white" : "bg-white text-toss-gray-primary hover:bg-toss-bg",
                    )}
                  >
                    <p className="break-words text-sm font-black leading-snug">{option.label}</p>
                    <p className={cn("mt-1.5 break-words text-xs leading-relaxed", active ? "text-white/80" : "text-toss-gray-secondary")}>
                      {option.description}
                    </p>
                    <p className={cn("mt-2 break-words text-xs font-bold", active ? "text-white font-extrabold" : "text-toss-blue")}>{option.meta}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {!selectedOption ? (
            <EmptyState title={`${activeMode.label}을 선택해 주세요.`} description="왼쪽 검색 결과 목록에서 조회할 항목을 선택해 주세요." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
                <Badge className="bg-toss-blue-light text-toss-blue font-bold ring-0">{activeMode.label} 선택됨</Badge>
                <h3 className="mt-4 break-words text-2xl font-black leading-tight text-toss-gray-primary">{selectedOption.label}</h3>
                <p className="mt-2 break-words text-sm font-semibold text-toss-gray-secondary">{selectedOption.description} · {selectedOption.meta}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={CalendarDays} title="운영 기간" value={range ? `${format(range.start, "M.d")} - ${format(range.end, "M.d")}` : "-"} description={range ? formatDateRange(range.start, range.end) : "등록된 일정 없음"} tone="blue" />
                <StatCard icon={BookOpenCheck} title="관련 과정" value={courseNames.length} description={courseNames.slice(0, 2).join(", ") || "과정 없음"} tone="green" />
                <StatCard icon={Clock3} title="총 수업 시간" value={humanizeDuration(Math.round(totalMinutes))} description={`${expandedSchedules.length}개 수업 일정`} tone="purple" />
                <StatCard icon={Building2} title={mode === "room" ? "담당 강사" : "사용 강의실"} value={mode === "room" ? instructorNames.length : roomNames.length} description={(mode === "room" ? instructorNames : roomNames).slice(0, 2).join(", ") || "정보 없음"} tone="slate" />
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOption && rawSchedules.length === 0 ? (
        <EmptyState title="연결된 시간표가 없습니다." description="선택한 항목과 연결된 schedules 데이터가 없습니다." />
      ) : null}

      {selectedOption && rawSchedules.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[24px] bg-white p-6 shadow-toss border-0">
              <p className="text-xs font-bold text-toss-gray-tertiary uppercase tracking-wider">운영 흐름</p>
              <div className="mt-5 space-y-3">
                {rawSchedules.map((schedule) => {
                  const course = data.courses.find((item) => item.course_id === schedule.course_id);
                  const room = data.rooms.find((item) => item.room_id === schedule.room_id);
                  const instructor = data.instructors.find((item) => item.instructor_id === schedule.instructor_id);
                  const style = categoryStyle(course?.category || "기타");
                  return (
                    <article key={schedule.schedule_id} className="rounded-[20px] bg-[#F9FAFB] p-5 border-0 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("ring-0 font-bold", style.soft, style.text)}>{course?.category || "기타"}</Badge>
                        <Badge className="bg-white border border-toss-border text-toss-gray-secondary font-bold">{schedule.status || course?.status || "상태 미정"}</Badge>
                      </div>
                      <h4 className="mt-3.5 break-words text-sm font-bold leading-snug text-toss-gray-primary">{course?.course_name || "미확인 과정"}</h4>
                      <p className="mt-2 text-xs font-bold text-toss-gray-secondary">{schedule.start_date} - {schedule.end_date}</p>
                      <p className="mt-1.5 break-words text-xs font-semibold leading-relaxed text-toss-gray-tertiary">
                        {schedule.days_of_week || "요일 확인 필요"} · {schedule.start_time}-{schedule.end_time}
                        <br />
                        {room?.room_name || "미확인 강의실"} · {instructor?.instructor_name || "미확인 강사"}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {monthlyGroups.map((group) => (
              <section key={group.key} className="rounded-[24px] bg-white p-6 shadow-toss border-0">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold tracking-tight text-toss-gray-primary">{group.label}</h3>
                  <Badge className="bg-toss-bg text-toss-gray-secondary font-bold ring-0">{group.items.length}개 수업</Badge>
                </div>
                <div className="space-y-3">
                  {group.items.map((schedule) => {
                    const style = categoryStyle(schedule.category);
                    return (
                      <article
                        key={`${schedule.schedule_id}-${schedule.date}`}
                        className="grid gap-4 rounded-[20px] bg-[#F9FAFB] p-5 md:grid-cols-[140px_1fr] md:items-start transition-all hover:bg-toss-bg"
                      >
                        <div>
                          <p className="text-sm font-bold text-toss-gray-primary">{format(schedule.dateObj, "M월 d일")}</p>
                          <p className="mt-1 text-xs font-semibold text-toss-gray-secondary">{getKoreanDayOfWeek(schedule.dateObj)} · {schedule.start_time}-{schedule.end_time}</p>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn("ring-0 font-bold", style.soft, style.text)}>{schedule.category}</Badge>
                            <Badge className="bg-white border border-toss-border text-toss-gray-secondary font-bold">{schedule.status || "상태 미정"}</Badge>
                          </div>
                          <h4 className="mt-2.5 break-words text-sm font-bold leading-snug text-toss-gray-primary">{schedule.courseName}</h4>
                          <p className="mt-1 text-sm font-semibold text-toss-gray-secondary">{schedule.roomName} · {schedule.instructorName}</p>
                          {schedule.memo && (
                            <div className="mt-3 rounded-[12px] bg-white border border-toss-border p-3 text-xs font-medium text-toss-gray-secondary leading-relaxed">
                              {schedule.memo}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

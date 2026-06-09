"use client";

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Keyboard,
  Layers3,
  ListChecks,
  Maximize2,
  MousePointerClick,
  Play,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  finalChecklist,
  hotspotLibrary,
  magicItems,
  screenLessons,
  shortcutItems,
  type Hotspot,
  type LessonKey,
  type ScreenLesson,
  type ScreenVariant,
} from "@/data/capcut-screen-lessons";
import {
  dayCourseContent,
  finalProjectFields,
  practiceProjectCatalog,
  type DayCourseContent,
  type PracticeProject,
} from "@/data/capcut-course-content";
import { aiFeatureCards, aiVersionNotice, type AiFeature } from "@/data/capcut-ai-features";
import { aiBeforeUseChecklist, creditGuide } from "@/data/capcut-credit-guide";
import { beatSyncGuide } from "@/data/capcut-beat-sync-guide";
import { promptGuide } from "@/data/capcut-prompt-guide";
import { aiPracticeExamples } from "@/data/capcut-ai-practice-examples";
import {
  getVisualAsset,
  getVisualAssetsForLesson,
  practiceVisualAssets,
  type PracticeVisualAsset,
  type VisualAsset,
} from "@/data/capcut-visual-assets";
import { getPracticeExamplePack, type PracticeExample } from "@/data/capcut-practice-example-packs";

type ActiveView =
  | LessonKey
  | "shortcuts"
  | "magic"
  | "practice"
  | "final"
  | "ai-overview"
  | "ai-image"
  | "ai-video"
  | "image-to-video"
  | "ai-design"
  | "ai-credits"
  | "beat-sync"
  | "beat-markers"
  | "ai-practice";

type SavedState = {
  activeView?: ActiveView;
  contentOverrides?: Record<string, string>;
  editMode?: boolean;
  finalProject?: Record<string, string>;
  selectedHotspotId?: string;
  studentChecks?: Record<string, boolean>;
  finalChecks?: Record<string, boolean>;
};

const storageKey = "capcut-screen-annotation-v1";

const lessonByKey = Object.fromEntries(screenLessons.map((lesson) => [lesson.key, lesson])) as Record<LessonKey, ScreenLesson>;

const sidebarItems: { key: ActiveView; label: string; icon: LucideIcon }[] = [
  { key: "map", label: "첫 화면 이해하기", icon: Home },
  { key: "start", label: "처음 시작 3단계", icon: MousePointerClick },
  { key: "day-1", label: "Day 1 가져오기와 컷 편집", icon: Play },
  { key: "day-2", label: "Day 2 속도와 전환", icon: ArrowRight },
  { key: "day-3", label: "Day 3 자막과 오디오", icon: BookOpenCheck },
  { key: "day-4", label: "Day 4 오버레이와 키프레임", icon: Layers3 },
  { key: "day-5", label: "Day 5 최종 영상 완성", icon: CheckCircle2 },
  { key: "ai-overview", label: "최신 AI 기능", icon: Sparkles },
  { key: "ai-image", label: "AI 이미지 생성", icon: Sparkles },
  { key: "ai-video", label: "AI 영상 생성", icon: Play },
  { key: "image-to-video", label: "이미지에서 영상 만들기", icon: Layers3 },
  { key: "ai-design", label: "AI Design / 썸네일 제작", icon: WandSparkles },
  { key: "ai-credits", label: "AI 사용량과 Credits 이해", icon: ListChecks },
  { key: "beat-sync", label: "음악 비트 자동 편집", icon: ArrowRight },
  { key: "beat-markers", label: "자동 마커 / Beat Sync", icon: MousePointerClick },
  { key: "ai-practice", label: "AI 실습 예제 모음", icon: ClipboardCheck },
  { key: "shortcuts", label: "단축키 치트시트", icon: Keyboard },
  { key: "magic", label: "마법 기능", icon: WandSparkles },
  { key: "practice", label: "실습 예제", icon: ClipboardCheck },
  { key: "final", label: "최종 체크리스트", icon: ListChecks },
];

export default function CapcutVisualLearningKit() {
  const [activeView, setActiveView] = useState<ActiveView>("map");
  const [selectedHotspotId, setSelectedHotspotId] = useState("import");
  const [studentChecks, setStudentChecks] = useState<Record<string, boolean>>({});
  const [finalChecks, setFinalChecks] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({});
  const [finalProject, setFinalProject] = useState<Record<string, string>>({});
  const [zoomOpen, setZoomOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const activeLesson = isLessonView(activeView) ? lessonByKey[activeView] : null;
  const activeCourse = activeLesson ? dayCourseContent[activeLesson.key] : null;
  const lessonHotspots = useMemo(() => getLessonHotspots(activeLesson), [activeLesson]);
  const selectedHotspot = lessonHotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? lessonHotspots[0] ?? hotspotLibrary.import;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedState;
        setActiveView(isKnownActiveView(parsed.activeView) ? parsed.activeView : "map");
        setSelectedHotspotId(parsed.selectedHotspotId ?? "import");
        setStudentChecks(parsed.studentChecks ?? {});
        setFinalChecks(parsed.finalChecks ?? {});
        setEditMode(parsed.editMode ?? false);
        setContentOverrides(parsed.contentOverrides ?? {});
        setFinalProject(parsed.finalProject ?? {});
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ activeView, selectedHotspotId, studentChecks, finalChecks, editMode, contentOverrides, finalProject }),
      );
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeView, contentOverrides, editMode, finalChecks, finalProject, ready, selectedHotspotId, studentChecks]);

  const resetAll = () => {
    window.localStorage.removeItem(storageKey);
    setActiveView("map");
    setSelectedHotspotId("import");
    setStudentChecks({});
    setFinalChecks({});
    setEditMode(false);
    setContentOverrides({});
    setFinalProject({});
  };

  const selectView = (view: ActiveView) => {
    setActiveView(view);
    if (isLessonView(view)) {
      setSelectedHotspotId(lessonByKey[view].hotspots[0]);
    }
  };

  const toggleStudentCheck = (key: string) => {
    setStudentChecks((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleFinalCheck = (key: string) => {
    setFinalChecks((current) => ({ ...current, [key]: !current[key] }));
  };

  const updateOverride = (key: string, value: string) => {
    setContentOverrides((current) => ({ ...current, [key]: value }));
  };

  const resetOverride = (key: string) => {
    setContentOverrides((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateFinalProject = (key: string, value: string) => {
    setFinalProject((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#111315] text-slate-100 lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
        <Sidebar activeView={activeView} onSelectView={selectView} />
        <main className="min-w-0">
          <TopBar activeView={activeView} editMode={editMode} resetAll={resetAll} setEditMode={setEditMode} />
          <DayRibbon activeView={activeView} onSelectView={selectView} />
          <div className="grid items-start gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_388px]">
            <section className="min-w-0">
              {activeLesson ? (
                <div className="space-y-5">
                  <ScreenshotLesson
                    course={activeCourse}
                    editMode={editMode}
                    lesson={activeLesson}
                    hotspots={lessonHotspots}
                    onOpenZoom={() => setZoomOpen(true)}
                    onSelectHotspot={setSelectedHotspotId}
                    selectedHotspotId={selectedHotspot.id}
                    overrides={contentOverrides}
                    resetOverride={resetOverride}
                    updateOverride={updateOverride}
                  />
                  <LessonVisualGallery lessonKey={activeLesson.key} onSelectView={selectView} />
                  {activeCourse ? (
                    <CourseDetailSections
                      checks={studentChecks}
                      course={activeCourse}
                      editMode={editMode}
                      finalProject={finalProject}
                      onToggleCheck={toggleStudentCheck}
                      overrides={contentOverrides}
                      resetOverride={resetOverride}
                      updateFinalProject={updateFinalProject}
                      updateOverride={updateOverride}
                    />
                  ) : null}
                </div>
              ) : (
                <ReferencePage
                  activeView={activeView}
                  finalChecks={finalChecks}
                  finalProject={finalProject}
                  onSelectView={selectView}
                  onToggleFinal={toggleFinalCheck}
                  updateFinalProject={updateFinalProject}
                />
              )}
            </section>
            <aside className="rounded-3xl border border-white/10 bg-[#1b1d20] p-4 shadow-2xl xl:sticky xl:top-36 xl:max-h-[calc(100vh-156px)] xl:overflow-y-auto">
              {activeLesson ? (
                <div className="space-y-4">
                  <ExplanationPanel
                    editMode={editMode}
                    hotspot={selectedHotspot}
                    overrides={contentOverrides}
                    resetOverride={resetOverride}
                    updateOverride={updateOverride}
                  />
                  <StudentStepMode
                    checks={studentChecks}
                    hotspot={selectedHotspot}
                    lesson={activeLesson}
                    onToggleCheck={toggleStudentCheck}
                  />
                </div>
              ) : (
                <RightReferencePanel activeView={activeView} />
              )}
            </aside>
          </div>
        </main>
      </div>
      {activeLesson ? (
        <ImageZoomModal
          hotspots={lessonHotspots}
          lesson={activeLesson}
          onClose={() => setZoomOpen(false)}
          onSelectHotspot={setSelectedHotspotId}
          open={zoomOpen}
          selectedHotspotId={selectedHotspot.id}
        />
      ) : null}
    </>
  );
}

function isLessonView(view: ActiveView): view is LessonKey {
  return view === "map" || view === "start" || view.startsWith("day-");
}

function isKnownActiveView(view: unknown): view is ActiveView {
  return typeof view === "string" && sidebarItems.some((item) => item.key === view);
}

function getLessonHotspots(lesson: ScreenLesson | null) {
  if (!lesson) return [];
  return lesson.hotspots.map((id) => hotspotLibrary[id]).filter(Boolean) as Hotspot[];
}

function Sidebar({ activeView, onSelectView }: { activeView: ActiveView; onSelectView: (view: ActiveView) => void }) {
  return (
    <aside className="border-b border-white/10 bg-[#0c0d0f] lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="border-b border-white/10 p-4 lg:p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">CapCut Guide</p>
        <h2 className="mt-2 text-xl font-black leading-tight text-white lg:text-2xl">화면 보면서 배우기</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-400">번호를 누르면 오른쪽 설명이 바뀝니다.</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto">
        {sidebarItems.map((item) => (
          <SidebarButton key={item.key} active={activeView === item.key} icon={item.icon} label={item.label} onClick={() => onSelectView(item.key)} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-[210px] shrink-0 items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition lg:w-full",
        active ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="leading-5">{label}</span>
    </button>
  );
}

function TopBar({
  activeView,
  editMode,
  resetAll,
  setEditMode,
}: {
  activeView: ActiveView;
  editMode: boolean;
  resetAll: () => void;
  setEditMode: (enabled: boolean) => void;
}) {
  const title = isLessonView(activeView) ? lessonByKey[activeView].title : getReferenceTitle(activeView);

  return (
    <header className="sticky top-0 z-40 flex min-h-20 shrink-0 flex-col items-start justify-between gap-3 border-b border-white/10 bg-[#16181b]/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">PC 캡컷 화면 주석형 학습</p>
        <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={cn(
            "rounded-2xl px-4 py-3 text-sm font-black transition",
            editMode ? "bg-amber-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
          )}
        >
          {editMode ? "수정 모드 끄기" : "수정 모드 켜기"}
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          초기화
        </button>
      </div>
    </header>
  );
}

function DayRibbon({ activeView, onSelectView }: { activeView: ActiveView; onSelectView: (view: ActiveView) => void }) {
  return (
    <div className="z-30 flex min-h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#111315]/95 px-3 py-2 backdrop-blur lg:sticky lg:top-20 lg:px-4">
      {screenLessons.map((lesson) => (
        <button
          key={lesson.key}
          type="button"
          onClick={() => onSelectView(lesson.key)}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-black transition",
            activeView === lesson.key ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
          )}
        >
          {lesson.navLabel}
        </button>
      ))}
    </div>
  );
}

function ScreenshotLesson({
  course,
  editMode,
  hotspots,
  lesson,
  onOpenZoom,
  onSelectHotspot,
  overrides,
  resetOverride,
  selectedHotspotId,
  updateOverride,
}: {
  course: DayCourseContent | null;
  editMode: boolean;
  hotspots: Hotspot[];
  lesson: ScreenLesson;
  onOpenZoom: () => void;
  onSelectHotspot: (id: string) => void;
  overrides: Record<string, string>;
  resetOverride: (key: string) => void;
  selectedHotspotId: string;
  updateOverride: (key: string, value: string) => void;
}) {
  const objectiveKey = `${lesson.key}-objective`;
  const objective = overrides[objectiveKey] ?? course?.goal ?? lesson.objective;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-5 shadow-2xl">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">{lesson.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{lesson.title}</h2>
            <p className="mt-2 max-w-4xl text-base font-bold leading-7 text-slate-300">{lesson.subtitle}</p>
            <EditableText
              className="mt-3 max-w-4xl rounded-2xl bg-cyan-400/10 p-4 text-base font-black leading-7 text-cyan-100 ring-1 ring-cyan-300/20"
              editMode={editMode}
              label="오늘의 수업 목표"
              onReset={() => resetOverride(objectiveKey)}
              onUpdate={(value) => updateOverride(objectiveKey, value)}
              value={objective}
            />
          </div>
          <button
            type="button"
            onClick={onOpenZoom}
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            크게 보기
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onOpenZoom}
          onKeyDown={(event) => {
            if (event.key === "Enter") onOpenZoom();
          }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner outline-none ring-cyan-300 transition focus:ring-2"
          aria-label={`${lesson.title} 화면 크게 보기`}
        >
          <CapCutScreenshotFrame key={lesson.imageSrc} alt={lesson.imageAlt} src={lesson.imageSrc} variant={lesson.variant} />
          {hotspots.map((hotspot) => (
            <HotspotMarker
              key={hotspot.id}
              hotspot={hotspot}
              onSelect={onSelectHotspot}
              selected={hotspot.id === selectedHotspotId}
            />
          ))}
          {lesson.showStartArrows ? <StepArrowGuide /> : null}
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1fr_360px]">
        <LessonFlow lesson={lesson} objective={objective} />
        <LessonBottomVisual lesson={lesson} />
      </section>
    </div>
  );
}

function HotspotMarker({ hotspot, onSelect, selected }: { hotspot: Hotspot; onSelect: (id: string) => void; selected: boolean }) {
  const style = { left: `${hotspot.x}%`, top: `${hotspot.y}%` } satisfies CSSProperties;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(hotspot.id);
      }}
      style={style}
      className={cn(
        "absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-black text-white shadow-[0_0_22px_rgba(34,211,238,0.75)] transition hover:scale-125 sm:h-9 sm:w-9 sm:text-sm",
        selected ? "scale-125 bg-rose-500 ring-4 ring-white" : "bg-cyan-500 ring-2 ring-white/80",
      )}
      aria-label={`${hotspot.number}. ${hotspot.label}`}
    >
      {hotspot.number}
    </button>
  );
}

function ExplanationPanel({
  editMode,
  hotspot,
  overrides,
  resetOverride,
  updateOverride,
}: {
  editMode: boolean;
  hotspot: Hotspot;
  overrides: Record<string, string>;
  resetOverride: (key: string) => void;
  updateOverride: (key: string, value: string) => void;
}) {
  const descriptionKey = `hotspot-${hotspot.id}-description`;
  const whenKey = `hotspot-${hotspot.id}-when`;
  const practiceKey = `hotspot-${hotspot.id}-practice`;
  const mistakeKey = `hotspot-${hotspot.id}-mistake`;
  const teacherKey = `hotspot-${hotspot.id}-teacher`;
  const description = overrides[descriptionKey] ?? hotspot.description;
  const when = overrides[whenKey] ?? hotspot.when;
  const practice = overrides[practiceKey] ?? hotspot.practice;
  const mistake = overrides[mistakeKey] ?? hotspot.mistake;
  const teacherScript = overrides[teacherKey] ?? hotspot.teacherScript;

  return (
    <article className="rounded-3xl border border-cyan-400/30 bg-[#101214] p-5 shadow-inner">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-lg font-black text-slate-950">{hotspot.number}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">선택한 번호</p>
          <h2 className="mt-1 text-2xl font-black text-white">{hotspot.label}</h2>
          <EditableText
            className="mt-2 text-base font-bold leading-7 text-slate-300"
            editMode={editMode}
            label={`${hotspot.label} 설명`}
            onReset={() => resetOverride(descriptionKey)}
            onUpdate={(value) => updateOverride(descriptionKey, value)}
            value={description}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <EditablePanelBlock
          editMode={editMode}
          label="언제 사용하나요?"
          onReset={() => resetOverride(whenKey)}
          onUpdate={(value) => updateOverride(whenKey, value)}
          value={when}
        />
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="text-sm font-black text-cyan-200">초보자 행동</h3>
          <ol className="mt-3 space-y-2">
            {hotspot.beginnerAction.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm font-bold leading-6 text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-slate-950">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <EditablePanelBlock
          editMode={editMode}
          label="실습 예시"
          onReset={() => resetOverride(practiceKey)}
          onUpdate={(value) => updateOverride(practiceKey, value)}
          value={practice}
        />
        {mistake ? (
          <EditablePanelBlock
            danger
            editMode={editMode}
            label="자주 하는 실수"
            onReset={() => resetOverride(mistakeKey)}
            onUpdate={(value) => updateOverride(mistakeKey, value)}
            value={mistake}
          />
        ) : null}
        <EditablePanelBlock
          editMode={editMode}
          label="쉽게 이해하는 설명"
          onReset={() => resetOverride(teacherKey)}
          onUpdate={(value) => updateOverride(teacherKey, value)}
          value={teacherScript}
        />
        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-black text-slate-400">관련 단축키</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(hotspot.shortcuts ?? ["없음"]).map((shortcut) => (
                <span key={shortcut} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-cyan-200 ring-1 ring-white/10">
                  {shortcut}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-black text-slate-400">관련 Day</h3>
            <p className="mt-2 text-lg font-black text-white">{hotspot.day}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PanelBlock({ body, danger, title }: { body: string; danger?: boolean; title: string }) {
  return (
    <div className={cn("rounded-2xl p-4 ring-1", danger ? "bg-rose-500/10 ring-rose-400/30" : "bg-white/5 ring-white/10")}>
      <h3 className={cn("text-sm font-black", danger ? "text-rose-200" : "text-cyan-200")}>{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{body}</p>
    </div>
  );
}

function EditablePanelBlock({
  danger,
  editMode,
  label,
  onReset,
  onUpdate,
  value,
}: {
  danger?: boolean;
  editMode: boolean;
  label: string;
  onReset: () => void;
  onUpdate: (value: string) => void;
  value: string;
}) {
  return (
    <div className={cn("rounded-2xl p-4 ring-1", danger ? "bg-rose-500/10 ring-rose-400/30" : "bg-white/5 ring-white/10")}>
      <h3 className={cn("text-sm font-black", danger ? "text-rose-200" : "text-cyan-200")}>{label}</h3>
      <EditableText
        className="mt-2 text-sm font-bold leading-6 text-slate-200"
        editMode={editMode}
        label={label}
        onReset={onReset}
        onUpdate={onUpdate}
        value={value}
      />
    </div>
  );
}

function EditableText({
  className,
  editMode,
  label,
  onReset,
  onUpdate,
  value,
}: {
  className?: string;
  editMode: boolean;
  label: string;
  onReset: () => void;
  onUpdate: (value: string) => void;
  value: string;
}) {
  if (!editMode) {
    return <p className={className}>{value}</p>;
  }

  return (
    <div className="mt-2 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-3">
      <label className="block text-xs font-black uppercase tracking-[0.16em] text-amber-200">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onUpdate(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#101214] p-3 text-sm font-bold leading-6 text-white outline-none focus:border-amber-300"
      />
      <button type="button" onClick={onReset} className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">
        기본값으로 되돌리기
      </button>
    </div>
  );
}

function StudentStepMode({
  checks,
  hotspot,
  lesson,
  onToggleCheck,
}: {
  checks: Record<string, boolean>;
  hotspot: Hotspot;
  lesson: ScreenLesson;
  onToggleCheck: (key: string) => void;
}) {
  return (
    <article className="rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Student Mode</p>
      <h3 className="mt-1 text-xl font-black text-white">따라하기 단계</h3>
      <div className="mt-4 rounded-2xl bg-white p-4 text-slate-950">
        <p className="text-sm font-black text-emerald-700">현재 단계</p>
        <p className="mt-2 text-lg font-black leading-7">{hotspot.studentTask}</p>
        {hotspot.nextTask ? <p className="mt-3 text-sm font-bold leading-6 text-slate-600">다음 단계: {hotspot.nextTask}</p> : null}
      </div>
      {hotspot.caution ? <PanelBlock danger title="주의" body={hotspot.caution} /> : null}
      <div className="mt-4 space-y-2">
        {hotspot.beginnerAction.map((step, index) => {
          const key = `${lesson.key}-${hotspot.id}-${index}`;
          return <CheckRow key={key} checked={Boolean(checks[key])} label={step} onClick={() => onToggleCheck(key)} />;
        })}
      </div>
    </article>
  );
}

function CheckRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-sm font-bold leading-6 transition",
        checked ? "border-emerald-300 bg-emerald-300/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
      )}
    >
      <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", checked ? "bg-emerald-300 text-slate-950" : "bg-white/10")}>
        {checked ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
      </span>
      {label}
    </button>
  );
}

function ImageZoomModal({
  hotspots,
  lesson,
  onClose,
  onSelectHotspot,
  open,
  selectedHotspotId,
}: {
  hotspots: Hotspot[];
  lesson: ScreenLesson;
  onClose: () => void;
  onSelectHotspot: (id: string) => void;
  open: boolean;
  selectedHotspotId: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 sm:p-6">
      <section className="relative w-full max-w-[1500px] rounded-3xl border border-white/15 bg-[#111315] p-3 shadow-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Zoom View</p>
            <h2 className="mt-1 text-2xl font-black text-white">{lesson.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="닫기">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <CapCutScreenshotFrame key={lesson.imageSrc} alt={lesson.imageAlt} src={lesson.imageSrc} variant={lesson.variant} />
          {hotspots.map((hotspot) => (
            <HotspotMarker
              key={hotspot.id}
              hotspot={hotspot}
              onSelect={onSelectHotspot}
              selected={hotspot.id === selectedHotspotId}
            />
          ))}
          {lesson.showStartArrows ? <StepArrowGuide /> : null}
        </div>
      </section>
    </div>
  );
}

function StepArrowGuide() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <GuideBubble className="left-[10%] top-[34%]" label="1. 가져오기" />
      <div className="absolute left-[20%] top-[38%] h-1 w-[12%] rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
      <ArrowRight className="absolute left-[31%] top-[36.3%] h-7 w-7 text-cyan-200 drop-shadow" aria-hidden="true" />
      <GuideBubble className="left-[34%] top-[43%]" label="2. 보관함" />
      <div className="absolute left-[42%] top-[51%] h-[20%] w-1 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
      <ArrowDown className="absolute left-[40.6%] top-[69%] h-8 w-8 text-cyan-200 drop-shadow" aria-hidden="true" />
      <GuideBubble className="left-[43%] top-[76%]" label="3. 타임라인" />
    </div>
  );
}

function GuideBubble({ className, label }: { className: string; label: string }) {
  return <div className={cn("absolute rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-xl", className)}>{label}</div>;
}

function CapCutScreenMap() {
  const zones = [
    { title: "왼쪽", body: "자료를 가져오는 곳", tone: "cyan" },
    { title: "가운데", body: "영상을 확인하는 곳", tone: "blue" },
    { title: "오른쪽", body: "선택한 항목을 조절하는 곳", tone: "violet" },
    { title: "아래", body: "실제로 편집하는 타임라인", tone: "emerald" },
    { title: "위쪽", body: "자막, 오디오, 효과, 내보내기 메뉴", tone: "amber" },
  ];

  return (
    <div className="grid gap-3">
      {zones.map((zone, index) => (
        <div key={zone.title} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-950">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white", zoneColor(zone.tone))}>{index + 1}</span>
          <div>
            <h3 className="text-base font-black">{zone.title}</h3>
            <p className="text-sm font-bold text-slate-600">{zone.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function zoneColor(tone: string) {
  const map: Record<string, string> = {
    cyan: "bg-cyan-600",
    blue: "bg-blue-600",
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
  };
  return map[tone] ?? "bg-slate-700";
}

function LessonFlow({ lesson, objective }: { lesson: ScreenLesson; objective: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#1b1d20] p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">오늘의 학습 순서</p>
      <h3 className="mt-2 text-xl font-black text-white">{objective}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {lesson.flow.map((item, index) => (
          <div key={item} className="flex items-center gap-2">
            <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">{item}</span>
            {index < lesson.flow.length - 1 ? <ArrowRight className="h-5 w-5 text-cyan-300" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function LessonBottomVisual({ lesson }: { lesson: ScreenLesson }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#1b1d20] p-5">
      {lesson.bottomVisual === "screen-map" ? (
        <>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">5대 영역</p>
          <CapCutScreenMap />
        </>
      ) : null}
      {lesson.bottomVisual === "start-steps" ? <StartStepsVisual /> : null}
      {lesson.bottomVisual === "speed" ? <SpeedVisual /> : null}
      {lesson.bottomVisual === "caption-audio" ? <CaptionAudioVisual /> : null}
      {lesson.bottomVisual === "overlay-keyframe" ? <OverlayKeyframeVisual /> : null}
      {lesson.bottomVisual === "shortform" ? <ShortformVisual /> : null}
    </article>
  );
}

function StartStepsVisual() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">처음 시작 3단계</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {["가져오기", "미디어 보관함", "타임라인"].map((item, index) => (
          <div key={item} className="contents">
            <div className="rounded-2xl bg-white p-4 text-center text-slate-950">
              <p className="text-sm font-black text-cyan-700">{index + 1}단계</p>
              <p className="mt-2 text-lg font-black">{item}</p>
            </div>
            {index < 2 ? (
              <>
                <ArrowDown className="mx-auto h-7 w-7 text-cyan-300 md:hidden" aria-hidden="true" />
                <ArrowRight className="hidden h-8 w-8 text-cyan-300 md:block" aria-hidden="true" />
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpeedVisual() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">속도 비교</p>
      <div className="mt-4 space-y-3">
        <SpeedBar label="1배속" width="w-full" />
        <SpeedBar label="2배속" width="w-2/3" />
        <SpeedBar label="4배속" width="w-1/3" />
      </div>
    </div>
  );
}

function SpeedBar({ label, width }: { label: string; width: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-black text-slate-300">
        <span>{label}</span>
        <span>길이가 짧을수록 빠름</span>
      </div>
      <div className="h-9 rounded-xl bg-white/10 p-1">
        <div className={cn("h-full rounded-lg bg-cyan-400", width)} />
      </div>
    </div>
  );
}

function CaptionAudioVisual() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">자막 / 오디오 비교</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-rose-500/15 p-4 text-rose-100 ring-1 ring-rose-300/30">
          <h4 className="font-black">나쁜 자막</h4>
          <p className="mt-2 text-sm font-bold leading-6">문장이 너무 길고 배경과 색이 비슷함</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/15 p-4 text-emerald-100 ring-1 ring-emerald-300/30">
          <h4 className="font-black">좋은 자막</h4>
          <p className="mt-2 text-sm font-bold leading-6">짧고, 크고, 핵심 단어가 보임</p>
        </div>
      </div>
      <div className="space-y-2">
        <VolumeRow label="목소리" value={100} />
        <VolumeRow label="배경음악" value={20} />
        <VolumeRow label="효과음" value={60} />
      </div>
    </div>
  );
}

function VolumeRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-black text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-6 rounded-lg bg-white/10">
        <div className="h-full rounded-lg bg-cyan-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function OverlayKeyframeVisual() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">레이어와 키프레임</p>
      <div className="space-y-2">
        <LayerLine title="상단 레이어" body="자막 · 로고 · 스티커" tone="bg-violet-400" />
        <LayerLine title="중간 레이어" body="제품 이미지 · 오버레이" tone="bg-cyan-400" />
        <LayerLine title="하단 레이어" body="기본 영상" tone="bg-emerald-400" />
      </div>
      <div className="rounded-2xl bg-white p-4 text-slate-950">
        <div className="flex items-center justify-between">
          <span className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white">시작점</span>
          <div className="h-1 flex-1 bg-cyan-500" />
          <span className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white">끝점</span>
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">두 점을 정하면 그 사이 움직임이 만들어집니다.</p>
      </div>
    </div>
  );
}

function LayerLine({ body, title, tone }: { body: string; title: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <span className={cn("h-4 w-4 rounded-full", tone)} />
      <div>
        <p className="font-black text-white">{title}</p>
        <p className="text-sm font-bold text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function ShortformVisual() {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">15초 쇼츠 구조</p>
      <div className="mt-4 grid grid-cols-[1fr_2fr_1fr] overflow-hidden rounded-2xl text-center text-sm font-black text-slate-950">
        <div className="bg-rose-300 p-4">0~3초<br />후킹</div>
        <div className="bg-cyan-300 p-4">3~10초<br />핵심 내용</div>
        <div className="bg-emerald-300 p-4">10~15초<br />행동 유도</div>
      </div>
    </div>
  );
}

function CourseDetailSections({
  checks,
  course,
  editMode,
  finalProject,
  onToggleCheck,
  overrides,
  resetOverride,
  updateFinalProject,
  updateOverride,
}: {
  checks: Record<string, boolean>;
  course: DayCourseContent;
  editMode: boolean;
  finalProject: Record<string, string>;
  onToggleCheck: (key: string) => void;
  overrides: Record<string, string>;
  resetOverride: (key: string) => void;
  updateFinalProject: (key: string, value: string) => void;
  updateOverride: (key: string, value: string) => void;
}) {
  const teacherKey = `${course.key}-teacher-script`;
  const missionKey = `${course.key}-skill-mission`;
  const teacherScript = overrides[teacherKey] ?? course.teacherScript;
  const skillMission = overrides[missionKey] ?? course.skillMission;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <InfoCard title="오늘 배우는 핵심 개념" eyebrow="Concepts">
          <div className="grid gap-3 xl:grid-cols-2">
            {course.concepts.map((concept) => (
              <div key={concept.term} className="rounded-2xl bg-white p-4 text-slate-950">
                <h3 className="text-lg font-black">{concept.term}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{concept.explanation}</p>
              </div>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="캡컷 화면에서 눌러야 할 위치" eyebrow="Screen Targets">
          <div className="grid gap-2">
            {course.screenTargets.map((target, index) => (
              <div key={target} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-sm font-black text-slate-950">{index + 1}</span>
                <p className="text-sm font-black text-slate-100">{target}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <InfoCard title="실제 작업 순서" eyebrow="Workflow">
          <NumberedList items={course.workflow} />
        </InfoCard>
        <InfoCard title="초보자가 헷갈리는 부분" eyebrow="Confusion">
          <BulletList items={course.confusion} tone="amber" />
        </InfoCard>
      </section>

      <PracticeProjectCard project={course.practice} />
      <DayAiExpansion courseKey={course.key} />

      <section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
        <InfoCard title="제출 전 체크리스트" eyebrow="Checklist">
          <div className="space-y-2">
            {course.checklist.map((item, index) => {
              const key = `${course.key}-detail-check-${index}`;
              return <CheckRow key={key} checked={Boolean(checks[key])} label={item} onClick={() => onToggleCheck(key)} />;
            })}
          </div>
        </InfoCard>
        <InfoCard title="실력 향상 미션" eyebrow="Skill Mission">
          <EditableText
            className="rounded-2xl bg-emerald-400/10 p-5 text-lg font-black leading-8 text-emerald-100 ring-1 ring-emerald-300/20"
            editMode={editMode}
            label="실력 향상 미션"
            onReset={() => resetOverride(missionKey)}
            onUpdate={(value) => updateOverride(missionKey, value)}
            value={skillMission}
          />
          <div className="mt-4">
            <h4 className="text-base font-black text-rose-200">자주 하는 실수</h4>
            <BulletList items={course.mistakes} tone="rose" />
          </div>
        </InfoCard>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <InfoCard title="쉽게 이해하는 설명" eyebrow="Student Note">
          <EditableText
            className="rounded-2xl bg-amber-400/10 p-5 text-lg font-black leading-8 text-amber-100 ring-1 ring-amber-300/20"
            editMode={editMode}
            label="쉽게 이해하는 설명"
            onReset={() => resetOverride(teacherKey)}
            onUpdate={(value) => updateOverride(teacherKey, value)}
            value={teacherScript}
          />
          <div className="mt-4">
            <h4 className="text-base font-black text-cyan-200">학생 질문 유도 문장</h4>
            <BulletList items={course.studentQuestions} tone="cyan" />
          </div>
        </InfoCard>
        <InfoCard title="3문항 미니 퀴즈" eyebrow="Quiz">
          <QuizList courseKey={course.key} quiz={course.quiz} />
        </InfoCard>
      </section>

      <InfoCard title="복습 요약" eyebrow="Review">
        <div className="grid gap-3 xl:grid-cols-3">
          {course.review.map((item, index) => (
            <div key={item} className="rounded-2xl bg-cyan-400 p-4 text-slate-950">
              <p className="text-sm font-black">요약 {index + 1}</p>
              <p className="mt-2 text-base font-black leading-7">{item}</p>
            </div>
          ))}
        </div>
      </InfoCard>

      {course.key === "day-5" ? <FinalProjectBoard finalProject={finalProject} updateFinalProject={updateFinalProject} /> : null}
    </div>
  );
}

function DayAiExpansion({ courseKey }: { courseKey: LessonKey }) {
  const content: Record<LessonKey, { title: string; description: string; featureIds: string[]; checklist: string[] }> = {
    map: {
      title: "AI 기능을 보기 전 화면부터 익히기",
      description: "AI 결과도 결국 미디어, 미리보기, 타임라인, 세부 정보 패널 안에서 다룹니다.",
      featureIds: ["ai-image", "ai-video"],
      checklist: ["AI가 만든 자료도 타임라인에 올려야 편집할 수 있습니다.", "생성 전 Credits 안내가 뜨면 내용을 먼저 읽습니다."],
    },
    start: {
      title: "AI 자료도 가져오기부터 시작",
      description: "AI로 만든 이미지나 영상도 일반 파일처럼 보관함에 들어오고 타임라인에 놓아야 합니다.",
      featureIds: ["ai-image", "image-to-video"],
      checklist: ["생성한 이미지를 저장하거나 프로젝트에 추가합니다.", "미디어 보관함에서 타임라인으로 드래그합니다."],
    },
    "day-1": {
      title: "컷 편집에 AI 자료 끼워 넣기",
      description: "AI 이미지나 AI 영상은 완성본이 아니라 편집할 재료로 생각하면 쉽습니다.",
      featureIds: ["ai-image", "ai-video"],
      checklist: ["AI 초안에서 필요 없는 앞뒤 장면을 자릅니다.", "첫 장면과 마지막 장면은 직접 자막으로 정리합니다."],
    },
    "day-2": {
      title: "음악 박자에 맞춰 자동 마커 보기",
      description: "Beat Sync나 Mark beats는 음악의 강한 박자를 표시해 컷 길이를 맞추기 쉽게 도와줍니다.",
      featureIds: ["beat-sync"],
      checklist: ["오디오 클립을 먼저 선택합니다.", "자동 마커가 생기면 모든 마커가 아니라 강한 박자 위주로 컷을 맞춥니다."],
    },
    "day-3": {
      title: "자막과 음성 AI로 속도 올리기",
      description: "자동 자막과 텍스트 음성 변환은 초안을 빠르게 만들지만, 오타와 억양은 직접 확인해야 합니다.",
      featureIds: ["auto-caption", "text-to-speech"],
      checklist: ["자동 자막의 사람 이름, 기관명, 숫자를 직접 확인합니다.", "AI 음성 문장은 짧게 끊어 자연스럽게 만듭니다."],
    },
    "day-4": {
      title: "오버레이와 키프레임에 AI 이미지 더하기",
      description: "AI 이미지, 배경 제거, 이미지에서 영상 만들기는 레이어와 키프레임을 이해하면 훨씬 다루기 쉽습니다.",
      featureIds: ["ai-image", "image-to-video", "smart-cutout", "motion-tracking"],
      checklist: ["AI 이미지는 배경이나 첫 장면으로 활용합니다.", "배경 제거 후 경계가 깨지는 부분은 확대해서 확인합니다."],
    },
    "day-5": {
      title: "AI 초안을 직접 편집해 최종 영상 만들기",
      description: "AI 영상 생성이나 AI Design은 빠른 초안을 만들어주지만, 최종 품질은 컷, 자막, 음악, 내보내기 확인에서 결정됩니다.",
      featureIds: ["ai-video", "ai-design", "image-to-video"],
      checklist: ["AI가 만든 문구를 그대로 쓰지 말고 내 주제에 맞게 고칩니다.", "내보내기 전 Pro 표시와 Credits 차감 여부를 확인합니다."],
    },
  };
  const item = content[courseKey];
  const features = item.featureIds.map(getAiFeatureById).filter(Boolean) as AiFeature[];

  return (
    <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
      <InfoCard title={item.title} eyebrow="AI 연결 실습">
        <p className="text-base font-bold leading-7 text-slate-300">{item.description}</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {features.map((feature) => (
            <FeatureMiniCard key={feature.id} feature={feature} />
          ))}
        </div>
      </InfoCard>
      <InfoCard title="AI 사용 전 체크" eyebrow="Student Checklist">
        <div className="space-y-2">
          {item.checklist.map((check) => (
            <div key={check} className="flex gap-3 rounded-2xl bg-white/5 p-3 text-sm font-bold leading-6 text-slate-200">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-300 text-xs font-black text-slate-950">✓</span>
              {check}
            </div>
          ))}
        </div>
        {courseKey === "day-2" ? <BeatTimelineVisual compact /> : null}
        {courseKey === "day-5" ? <CreditUsagePanel compact /> : null}
      </InfoCard>
    </section>
  );
}

function LessonVisualGallery({ lessonKey, onSelectView }: { lessonKey: LessonKey; onSelectView: (view: ActiveView) => void }) {
  const assets = getVisualAssetsForLesson(lessonKey);
  if (!assets.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6 shadow-xl">
      <SectionHeader
        eyebrow="Visual First"
        title="화면 예시로 먼저 이해하기"
        description="텍스트 설명 전에 캡컷 화면 구조, 버튼 위치, 타임라인 변화를 그림처럼 먼저 봅니다."
      />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {assets.map((asset) =>
          asset.type === "before-after" ? (
            <BeforeAfterVisual key={asset.id} asset={asset} />
          ) : (
            <VisualLessonCard key={asset.id} asset={asset} onSelectView={onSelectView} />
          ),
        )}
      </div>
    </section>
  );
}

function VisualLessonCard({ asset, onSelectView }: { asset: VisualAsset; onSelectView?: (view: ActiveView) => void }) {
  const targetView = getAssetTargetView(asset);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <VisualAssetImage asset={asset} />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{asset.type}</p>
          <h3 className="mt-2 text-2xl font-black text-white">{asset.title}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{asset.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {asset.day ? <span className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Day {asset.day}</span> : null}
          <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">{asset.relatedSkill}</span>
          <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-cyan-100 ring-1 ring-white/10">{asset.recommendedRatio}</span>
        </div>
        {asset.expectedResultDescription ? (
          <p className="rounded-2xl bg-emerald-400/10 p-4 text-sm font-black leading-6 text-emerald-100 ring-1 ring-emerald-300/20">
            {asset.expectedResultDescription}
          </p>
        ) : null}
        {targetView && onSelectView ? (
          <button
            type="button"
            onClick={() => onSelectView(targetView)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
          >
            관련 실습으로 이동
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function BeforeAfterVisual({ asset }: { asset: VisualAsset }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Before / After</p>
        <h3 className="mt-2 text-2xl font-black text-white">{asset.title}</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{asset.description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <VisualAssetImage asset={asset} label="Before" srcOverride={asset.beforeSrc ?? asset.src} />
        <VisualAssetImage asset={asset} label="After" srcOverride={asset.afterSrc ?? asset.src} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/20">
          <p className="text-sm font-black text-emerald-200">차이점</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-200">
            {asset.expectedResultDescription ?? "편집 전에는 흐름이 어색하고, 편집 후에는 필요한 장면과 정보가 더 명확하게 보입니다."}
          </p>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 p-4 ring-1 ring-cyan-300/20">
          <p className="text-sm font-black text-cyan-200">학생 질문</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{asset.studentQuestion ?? "오른쪽 결과물이 더 보기 쉬운 이유는 무엇인가요?"}</p>
        </div>
      </div>
    </article>
  );
}

function VisualAssetImage({
  asset,
  compact,
  label,
}: {
  asset: VisualAsset;
  compact?: boolean;
  label?: string;
  srcOverride?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-[#101214]", compact ? "min-h-48" : "min-h-64")}>
      {label ? <span className="absolute left-3 top-3 z-10 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">{label}</span> : null}
      <VisualAssetFallback asset={asset} compact={compact} />
    </div>
  );
}

function VisualAssetFallback({ asset, compact = false }: { asset: VisualAsset; compact?: boolean }) {
  return (
    <div className={cn("flex min-h-64 flex-col justify-between gap-4 bg-[#121417] p-5", compact ? "min-h-48 p-4" : "")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950">화면 예시</span>
          <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">{asset.recommendedRatio}</span>
        </div>
        <EnhancedFallbackDiagram asset={asset} />
        <div>
          <p className="text-sm font-black text-white">{asset.title}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-400">{asset.description}</p>
        </div>
      </div>
    </div>
  );
}

function EnhancedFallbackDiagram({ asset }: { asset: VisualAsset }) {
  if (asset.type === "before-after") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniEditState title="Before" tone="rose" clips={["원본", "실수 장면", "원본", "남는 끝"]} />
        <MiniEditState title="After" tone="emerald" clips={["필요 장면", "자막", "음악"]} />
      </div>
    );
  }

  if (asset.type === "flow" || asset.type === "ai") {
    return (
      <div className="space-y-3">
        <MiniButtonRail steps={asset.type === "ai" ? ["AI 도구", "문구 입력", "생성", "타임라인"] : ["가져오기", "미디어", "드래그", "타임라인"]} />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {["버튼 누르기", asset.type === "ai" ? "결과 고르기" : "자료 넣기", "타임라인 배치"].map((item, index) => (
            <div key={item} className="contents">
              <div className="rounded-2xl bg-white p-3 text-center text-slate-950">
                <p className="text-xs font-black text-cyan-700">{index + 1}단계</p>
                <p className="mt-1 text-sm font-black">{item}</p>
              </div>
              {index < 2 ? <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300 sm:block" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (asset.type === "layer") {
    return (
      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-40 rounded-2xl bg-slate-950 p-4 ring-1 ring-white/10">
          {["자막 / 로고", "제품 이미지", "배경 영상"].map((item, index) => (
            <div
              key={item}
              className={cn(
                "absolute left-4 right-4 rounded-xl px-3 py-2 text-sm font-black text-slate-950 shadow-xl",
                index === 0 ? "top-4 bg-amber-300" : index === 1 ? "top-16 bg-cyan-300" : "bottom-4 bg-emerald-300",
              )}
            >
              {item}
            </div>
          ))}
        </div>
        <MiniButtonRail steps={["오버레이", "이미지 추가", "맨 위 레이어", "키프레임"]} vertical />
      </div>
    );
  }

  return <MiniCapCutInterface asset={asset} />;
}

function MiniCapCutInterface({ asset }: { asset: VisualAsset }) {
  const steps = getMiniSteps(asset);

  return (
    <div className="overflow-hidden rounded-2xl bg-[#202326] text-[11px] text-slate-200 ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111315] px-3 py-2">
        <span className="font-black text-white">CapCut</span>
        <span className="rounded-lg bg-cyan-400 px-2 py-1 font-black text-slate-950">내보내기</span>
      </div>
      <MiniButtonRail steps={steps} />
      <div className="grid min-h-40 grid-cols-[0.9fr_1.15fr] gap-2 p-3 sm:grid-cols-[0.75fr_1.1fr_0.75fr]">
        <div className="rounded-xl bg-[#2b2d30] p-2">
          <p className="mb-2 font-black text-cyan-200">미디어</p>
          <div className="grid h-24 place-items-center rounded-lg border border-dashed border-slate-500 bg-[#3a3d40] text-center">
            <div>
              <span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">+</span>
              <p className="mt-1 font-black">가져오기</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-[#16181b] p-2">
          <p className="mb-2 font-black text-slate-300">미리보기</p>
          <div className="grid h-24 place-items-center rounded-lg bg-slate-950">
            <div className="aspect-[9/16] h-20 rounded-lg bg-gradient-to-b from-cyan-400 to-slate-800 p-2 text-center shadow-inner">
              <p className="mt-5 text-[10px] font-black text-white">완성 화면</p>
            </div>
          </div>
        </div>
        <div className="hidden rounded-xl bg-[#2b2d30] p-2 sm:block">
          <p className="mb-2 font-black text-cyan-200">세부 정보</p>
          {["위치", "크기", asset.relatedSkill].map((item) => (
            <div key={item} className="mb-2 rounded-lg bg-white/10 px-2 py-1 font-black text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#191b1e] p-3">
        <div className="mb-2 flex items-center justify-between font-black text-slate-400">
          <span>타임라인</span>
          <span>클립을 아래에 놓기</span>
        </div>
        <MiniTimeline clips={asset.type === "practice" ? ["영상", "자막", "음악"] : ["클립", "오버레이", "자막"]} />
      </div>
    </div>
  );
}

function MiniButtonRail({ steps, vertical = false }: { steps: string[]; vertical?: boolean }) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto bg-[#2a2d30] p-2", vertical ? "h-full flex-col overflow-visible rounded-2xl bg-slate-950" : "")}>
      {steps.map((step, index) => (
        <div key={`${step}-${index}`} className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-xl px-3 py-2 text-xs font-black", index === 0 ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-100")}>
            {step}
          </span>
          {index < steps.length - 1 && !vertical ? <ArrowRight className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function MiniEditState({ clips, title, tone }: { clips: string[]; title: string; tone: "emerald" | "rose" }) {
  return (
    <div className={cn("rounded-2xl p-3 ring-1", tone === "rose" ? "bg-rose-300/15 ring-rose-300/20" : "bg-emerald-300/15 ring-emerald-300/20")}>
      <p className={cn("text-xs font-black", tone === "rose" ? "text-rose-200" : "text-emerald-200")}>{title}</p>
      <div className="mt-3 rounded-xl bg-slate-950 p-2">
        <MiniTimeline clips={clips} compact tone={tone} />
      </div>
    </div>
  );
}

function MiniTimeline({ clips, compact = false, tone = "emerald" }: { clips: string[]; compact?: boolean; tone?: "emerald" | "rose" }) {
  const palette = tone === "rose" ? ["bg-cyan-400", "bg-rose-300", "bg-cyan-400", "bg-slate-500"] : ["bg-cyan-400", "bg-amber-300", "bg-emerald-400", "bg-violet-300"];

  return (
    <div className={cn("space-y-2", compact ? "" : "min-w-0")}>
      <div className="grid grid-cols-[1fr_0.75fr_1fr] gap-1">
        {clips.slice(0, 3).map((clip, index) => (
          <span key={`${clip}-${index}`} className={cn("truncate rounded-lg px-2 py-2 text-[10px] font-black text-slate-950", palette[index % palette.length])}>
            {clip}
          </span>
        ))}
      </div>
      {clips.length > 3 ? (
        <div className="grid grid-cols-[0.8fr_1fr] gap-1">
          {clips.slice(3).map((clip, index) => (
            <span key={`${clip}-${index}`} className={cn("truncate rounded-lg px-2 py-2 text-[10px] font-black text-slate-950", palette[(index + 3) % palette.length])}>
              {clip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getMiniSteps(asset: VisualAsset) {
  const skill = `${asset.relatedSkill} ${asset.title}`;
  if (skill.includes("자막")) return ["텍스트", "자동 자막", "스타일", "미리보기"];
  if (skill.includes("오디오") || skill.includes("음악") || skill.includes("Beat")) return ["오디오", "Beat Sync", "마커", "클립 맞춤"];
  if (skill.includes("오버레이") || skill.includes("키프레임") || skill.includes("Smart")) return ["오버레이", "배경 제거", "키프레임", "재생"];
  if (skill.includes("AI")) return ["AI 도구", "문구 입력", "생성", "타임라인"];
  if (skill.includes("내보내기") || skill.includes("최종")) return ["확인", "해상도", "내보내기", "저장"];
  return ["미디어", "가져오기", "자르기", "미리보기"];
}

function PracticePreviewCard({ project, visual }: { project: PracticeProjectWithAi; visual: PracticeVisualAsset }) {
  return (
    <article className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <VisualAssetImage
          asset={practiceVisualToAsset(visual, project.title)}
          compact
          srcOverride={project.previewImage ?? visual.previewImage}
        />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">완성 결과 미리보기</p>
            <h3 className="mt-2 text-2xl font-black text-white">{project.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{project.expectedResultDescription ?? visual.expectedResultDescription}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetaPill label="난이도" value={project.level} />
            <MetaPill label="시간" value={project.time} />
          </div>
          <div className="flex flex-wrap gap-2">
            {project.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">{skill}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => document.getElementById(projectStepsId(project.title))?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
          >
            시작하기
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <VisualAssetImage asset={practiceVisualToAsset(visual, `${project.title} 전`)} compact label="Before" srcOverride={project.beforeImage ?? visual.beforeImage} />
        <VisualAssetImage asset={practiceVisualToAsset(visual, `${project.title} 후`)} compact label="After" srcOverride={project.afterImage ?? visual.afterImage} />
      </div>
    </article>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-xs font-black text-cyan-200">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoCard({ children, eyebrow, title }: { children: ReactNode; eyebrow: string; title: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 rounded-2xl bg-white/5 p-4 text-sm font-bold leading-7 text-slate-200">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950">{index + 1}</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items, tone }: { items: string[]; tone: "amber" | "cyan" | "rose" }) {
  const dotClass = tone === "rose" ? "bg-rose-300" : tone === "amber" ? "bg-amber-300" : "bg-cyan-300";
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-2xl bg-white/5 p-3 text-sm font-bold leading-6 text-slate-200">
          <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", dotClass)} />
          {item}
        </li>
      ))}
    </ul>
  );
}

type PracticeProjectWithAi = PracticeProject & {
  afterImage?: string;
  category?: string;
  compareQuestions?: string[];
  expectedResultDescription?: string;
  beforeImage?: string;
  previewImage?: string;
  prompt?: string;
};

function PracticeProjectCard({ project }: { project: PracticeProjectWithAi }) {
  const visual = getPracticeVisualForProject(project);
  const examplePack = getPracticeExamplePack(project.title);

  return (
    <InfoCard title={project.title} eyebrow="Practice Project">
      {visual ? (
        <div className="mb-5">
          <PracticePreviewCard project={project} visual={visual} />
        </div>
      ) : null}
      {examplePack.length ? (
        <div className="mb-5">
          <PracticeExamplePack examples={examplePack} />
        </div>
      ) : null}
      <div className="grid gap-4 2xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {project.category ? <MetaLine label="분류" value={project.category} /> : null}
          <MetaLine label="난이도" value={project.level} />
          <MetaLine label="예상 소요 시간" value={project.time} />
          <MetaLine label="목표" value={project.mission} />
          <TagGroup label="핵심 기능" items={project.skills} />
          <TagGroup label="필요한 파일" items={project.files} />
        </div>
        <div className="space-y-4">
          <ProjectSection title="작업 조건" items={project.conditions} />
          <div id={projectStepsId(project.title)} className="scroll-mt-32">
            <ProjectSection title="단계별 작업 순서" items={project.steps} ordered />
          </div>
          <ProjectSection title="완성 기준" items={project.criteria} />
          <ProjectSection title="자주 하는 실수" items={project.mistakes} danger />
          {project.prompt ? (
            <div className="rounded-2xl bg-cyan-400/10 p-4 ring-1 ring-cyan-300/20">
              <h4 className="text-base font-black text-cyan-200">AI 입력 문구 예시</h4>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{project.prompt}</p>
            </div>
          ) : null}
          <div className="rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/20">
            <h4 className="text-base font-black text-emerald-200">변형 과제</h4>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{project.variation}</p>
          </div>
          <ProjectSection title="피드백 기준" items={project.feedback} />
          {project.compareQuestions ? <ProjectSection title="AI 결과 비교 질문" items={project.compareQuestions} /> : null}
        </div>
      </div>
    </InfoCard>
  );
}

function PracticeExamplePack({ examples }: { examples: PracticeExample[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Ready Examples</p>
          <h3 className="mt-2 text-2xl font-black text-white">바로 써먹는 예제</h3>
        </div>
        <p className="max-w-xl text-sm font-bold leading-6 text-slate-300">주제, 재료, 누를 버튼, 완성 기준을 한 번에 보고 원하는 예제로 시작합니다.</p>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {examples.map((example) => (
          <article key={example.id} className="rounded-3xl bg-[#101214] p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">{example.timeBox}</span>
              <span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">예제</span>
            </div>
            <h4 className="mt-4 text-xl font-black text-white">{example.title}</h4>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{example.scenario}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="text-xs font-black text-cyan-200">준비물</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {example.materials.map((material) => (
                    <span key={material} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-cyan-400/10 p-3 ring-1 ring-cyan-300/20">
                <p className="text-xs font-black text-cyan-200">버튼처럼 눌러보기</p>
                <div className="mt-2 overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <MiniButtonRail steps={example.buttonPath} />
                </div>
              </div>
            </div>
            {example.prompt ? (
              <div className="mt-3 rounded-2xl bg-amber-400/10 p-3 ring-1 ring-amber-300/20">
                <p className="text-xs font-black text-amber-200">문구 예시</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{example.prompt}</p>
              </div>
            ) : null}
            <div className="mt-3 rounded-2xl bg-emerald-400/10 p-3 ring-1 ring-emerald-300/20">
              <p className="text-xs font-black text-emerald-200">완성 목표</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{example.targetResult}</p>
            </div>
            <div className="mt-3">
              <ProjectSection title="확인 포인트" items={example.checkpoints} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-slate-950">
      <p className="text-sm font-black text-cyan-700">{label}</p>
      <p className="mt-2 text-base font-black leading-7">{value}</p>
    </div>
  );
}

function TagGroup({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-sm font-black text-slate-300">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-950">{item}</span>
        ))}
      </div>
    </div>
  );
}

function ProjectSection({ danger, items, ordered, title }: { danger?: boolean; items: string[]; ordered?: boolean; title: string }) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div className={cn("rounded-2xl p-4 ring-1", danger ? "bg-rose-500/10 ring-rose-300/20" : "bg-white/5 ring-white/10")}>
      <h4 className={cn("text-base font-black", danger ? "text-rose-200" : "text-cyan-200")}>{title}</h4>
      <ListTag className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm font-bold leading-6 text-slate-200">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-slate-950">{ordered ? index + 1 : "•"}</span>
            {item}
          </li>
        ))}
      </ListTag>
    </div>
  );
}

function QuizList({ courseKey, quiz }: { courseKey: LessonKey; quiz: { answer: string; explanation: string; options: string[]; question: string }[] }) {
  return (
    <div className="space-y-4">
      {quiz.map((item, index) => (
        <details key={`${courseKey}-quiz-${item.question}`} className="rounded-2xl bg-white p-4 text-slate-950">
          <summary className="cursor-pointer text-base font-black">Q{index + 1}. {item.question}</summary>
          <div className="mt-3 grid gap-2">
            {item.options.map((option) => (
              <div key={option} className={cn("rounded-xl px-3 py-2 text-sm font-black", option === item.answer ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                {option}
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm font-bold leading-6 text-cyan-900">정답: {item.answer}. {item.explanation}</p>
        </details>
      ))}
    </div>
  );
}

function FinalProjectBoard({ finalProject, updateFinalProject }: { finalProject: Record<string, string>; updateFinalProject: (key: string, value: string) => void }) {
  return (
    <InfoCard title="최종 프로젝트 보드" eyebrow="Project Board">
      <p className="text-base font-bold leading-7 text-slate-300">
        Day 5에서는 이 보드를 채우며 최종 홍보 숏폼을 기획합니다. 입력값은 이 브라우저의 localStorage에 저장됩니다.
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {finalProjectFields.map((field) => (
          <label key={field} className="block rounded-2xl bg-white/5 p-4">
            <span className="text-sm font-black text-cyan-200">{field}</span>
            <textarea
              value={finalProject[field] ?? ""}
              onChange={(event) => updateFinalProject(field, event.target.value)}
              rows={3}
              className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#101214] p-3 text-sm font-bold leading-6 text-white outline-none focus:border-cyan-300"
              placeholder={`${field} 입력`}
            />
          </label>
        ))}
      </div>
    </InfoCard>
  );
}

function CapCutScreenshotFrame({ alt, src, variant }: { alt: string; src: string; variant: ScreenVariant }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  return (
    <div className="relative aspect-[16/9] w-full bg-[#202124]">
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <CapCutWireframe variant={variant} />
      )}
    </div>
  );
}

function CapCutWireframe({ variant }: { variant: ScreenVariant }) {
  return (
    <div className="absolute inset-0 bg-[#202124] text-[10px] text-slate-300">
      <div className="absolute inset-x-0 top-0 flex h-[6%] items-center justify-between bg-[#111] px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">CapCut</span>
          <span className="rounded bg-[#2c2c2c] px-2 py-1 font-bold">메뉴</span>
          <span className="font-bold text-cyan-300">자동 저장</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#3a3a3a] px-2 py-1 font-black">공유</span>
          <span className="rounded bg-cyan-500 px-3 py-1 font-black text-slate-950">내보내기</span>
        </div>
      </div>
      <div className="absolute left-0 top-[6%] h-[7%] w-[37%] bg-[#2b2c2e] px-2">
        <div className="flex h-full items-center gap-3">
          {["미디어", "오디오", "텍스트", "스티커", "편집효과", "전환", "캡션", "필터", "조정"].map((item) => (
            <span
              key={item}
              className={cn(
                "rounded px-1 py-1 font-black",
                (variant === "caption" && (item === "텍스트" || item === "오디오")) ||
                  (variant === "timeline" && item === "전환") ||
                  (variant === "overlay" && item === "스티커")
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute left-0 top-[13%] h-[51%] w-[37%] border-r border-[#111] bg-[#242526] p-2">
        <div className="mb-2 flex h-[8%] items-center rounded bg-[#343638] px-3 font-black text-cyan-300">가져오기</div>
        <div className="grid h-[70%] place-items-center rounded-lg border border-dashed border-slate-500 bg-[#383a3c]">
          <div className="text-center">
            <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-cyan-500 text-base font-black text-slate-950">+</div>
            <p className="text-sm font-black text-white">미디어 보관함</p>
            <p className="mt-1 text-slate-400">영상, 사진, 음악을 여기에 가져옵니다</p>
          </div>
        </div>
      </div>
      <div className="absolute left-[37%] top-[6%] h-[58%] w-[42%] border-x border-[#111] bg-[#232425]">
        <div className="h-[7%] border-b border-[#333] px-3 py-2 font-black text-slate-200">플레이어 - 미리보기 화면</div>
        <div className="grid h-[82%] place-items-center">
          {variant === "export" ? (
            <div className="aspect-[9/16] h-[78%] rounded-xl bg-[#111] p-2 ring-2 ring-cyan-400">
              <div className="grid h-full place-items-center rounded-lg bg-gradient-to-b from-slate-700 to-slate-900 text-center">
                <p className="text-lg font-black text-white">첫 3초 후킹</p>
                <p className="mt-2 text-cyan-200">9:16 화면</p>
              </div>
            </div>
          ) : variant === "overlay" ? (
            <div className="relative h-[72%] w-[58%] rounded-xl bg-slate-800 ring-2 ring-white/20">
              <div className="absolute inset-8 rounded-lg bg-emerald-500/60" />
              <div className="absolute left-[22%] top-[24%] rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl">제품 이미지</div>
              <div className="absolute bottom-7 left-8 rounded-lg bg-cyan-400 px-3 py-2 font-black text-slate-950">자막</div>
            </div>
          ) : (
            <div className="grid h-[58%] w-[62%] place-items-center rounded-xl bg-[#1b1b1c] text-center ring-1 ring-slate-600">
              <div>
                <p className="text-lg font-black text-white">미리보기</p>
                <p className="mt-2 text-slate-400">편집 결과 확인</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid h-[11%] place-items-center border-t border-[#333]">
          <Play className="h-5 w-5 fill-slate-500 text-slate-500" aria-hidden="true" />
        </div>
      </div>
      <div className="absolute right-0 top-[6%] h-[58%] w-[21%] bg-[#242526] p-3">
        <p className="mb-4 font-black text-cyan-300">세부 정보 패널</p>
        {["위치", "크기", "속도", "볼륨", "배경 제거", "키프레임"].map((item) => (
          <div
            key={item}
            className={cn(
              "mb-3 flex items-center justify-between border-b border-[#333] pb-2 font-bold",
              (variant === "timeline" && item === "속도") ||
                (variant === "caption" && item === "볼륨") ||
                (variant === "overlay" && (item === "배경 제거" || item === "키프레임"))
                ? "text-cyan-300"
                : "text-slate-400",
            )}
          >
            <span>{item}</span>
            <span>조절</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[#202124] p-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-2">
            {["+", "선택", "되돌리기", "자르기", "삭제"].map((item) => (
              <span key={item} className="rounded bg-[#303235] px-2 py-1 font-black text-slate-300">{item}</span>
            ))}
          </div>
          <div className="flex gap-2">
            {["링크", "확대", "축소"].map((item) => (
              <span key={item} className="rounded bg-[#303235] px-2 py-1 font-black text-slate-300">{item}</span>
            ))}
          </div>
        </div>
        <div className="relative h-[78%] rounded-lg border border-dashed border-slate-600 bg-[#27282a]">
          <div className="absolute left-[4%] top-0 h-full w-px bg-slate-500" />
          {variant === "empty" ? (
            <div className="grid h-full place-items-center text-sm font-black text-slate-400">여기로 자료를 드래그하여 만들기 시작</div>
          ) : (
            <>
              <div className="absolute left-[7%] top-[20%] h-[24%] w-[24%] rounded-lg bg-cyan-500 px-3 py-2 font-black text-slate-950">클립 1</div>
              <div className="absolute left-[33%] top-[20%] h-[24%] w-[18%] rounded-lg bg-blue-500 px-3 py-2 font-black text-white">
                {variant === "timeline" ? "2배속" : "클립 2"}
              </div>
              <div className="absolute left-[7%] top-[52%] h-[18%] w-[44%] rounded-lg bg-amber-300 px-3 py-1 font-black text-slate-950">
                {variant === "caption" ? "자동 자막" : variant === "overlay" ? "오버레이 이미지" : "오디오"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getAiFeatureById(id: string) {
  return aiFeatureCards.find((feature) => feature.id === id) ?? null;
}

function getAiFeatureByView(view: ActiveView) {
  if (view !== "ai-image" && view !== "ai-video" && view !== "image-to-video" && view !== "ai-design") return null;
  return getAiFeatureById(view);
}

function getFeatureTarget(id: string): ActiveView | null {
  const map: Record<string, ActiveView> = {
    "ai-image": "ai-image",
    "ai-video": "ai-video",
    "image-to-video": "image-to-video",
    "ai-design": "ai-design",
    "beat-sync": "beat-sync",
  };
  return map[id] ?? null;
}

function isAiReferenceView(view: ActiveView) {
  return (
    view === "ai-overview" ||
    view === "ai-image" ||
    view === "ai-video" ||
    view === "image-to-video" ||
    view === "ai-design" ||
    view === "ai-credits" ||
    view === "beat-sync" ||
    view === "beat-markers" ||
    view === "ai-practice"
  );
}

function getAssetTargetView(asset: VisualAsset): ActiveView | null {
  if (asset.id.includes("ai-image") || asset.id === "ai-first-scene") return "ai-image";
  if (asset.id.includes("ai-video")) return "ai-video";
  if (asset.relatedSkill.includes("Beat")) return "beat-sync";
  if (asset.day) return `day-${asset.day}` as ActiveView;
  if (asset.lessonKeys?.[0]) return asset.lessonKeys[0];
  return null;
}

function projectStepsId(title: string) {
  return `practice-steps-${title.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "")}`;
}

function getPracticeVisualForProject(project: PracticeProjectWithAi) {
  if (project.previewImage || project.expectedResultDescription) {
    return {
      title: project.title,
      previewImage: project.previewImage ?? "/assets/capcut/practice/custom-preview.png",
      beforeImage: project.beforeImage ?? "/assets/capcut/before-after/custom-before.png",
      afterImage: project.afterImage ?? project.previewImage ?? "/assets/capcut/before-after/custom-after.png",
      expectedResultDescription: project.expectedResultDescription ?? project.mission,
    };
  }

  return practiceVisualAssets[project.title] ?? null;
}

function practiceVisualToAsset(visual: PracticeVisualAsset, title: string): VisualAsset {
  return {
    id: `practice-${title}`,
    title,
    type: "practice",
    src: visual.previewImage,
    fallback: "css-wireframe",
    description: visual.expectedResultDescription,
    relatedSkill: "실습 결과 미리보기",
    recommendedRatio: "9:16",
    expectedResultDescription: visual.expectedResultDescription,
  };
}

function getPracticeCategory(project: PracticeProject) {
  if (project.title.includes("정보 전달")) return "자막 / 오디오";
  if (project.title.includes("카드뉴스") || project.title.includes("배경 제거")) return "오버레이 / 키프레임";
  if (project.title.includes("홍보 숏폼") || project.title.includes("템플릿")) return "최종 프로젝트";
  return "기본 편집";
}

function FeatureMiniCard({ feature }: { feature: AiFeature }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">{feature.navLabel}</span>
        <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-cyan-100 ring-1 ring-white/10">{feature.relatedDay}</span>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-200">{feature.easy}</p>
    </div>
  );
}

function AiOverviewPage({ onSelectView }: { onSelectView: (view: ActiveView) => void }) {
  const aiVisuals = ["ai-first-scene", "ai-video-before-after", "beat-sync-timeline"].map(getVisualAsset).filter(Boolean) as VisualAsset[];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader
          eyebrow="AI Update"
          title="최신 AI 기능 한눈에 보기"
          description="AI는 완성 버튼이 아니라 초안을 빨리 만드는 도구입니다. 생성한 결과를 타임라인에서 자르고, 자막을 고치고, 음악을 맞추는 과정까지 함께 봅니다."
        />
        <div className="mt-5">
          <VersionNoticeBox />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader
          eyebrow="AI Visual Examples"
          title="AI 기능을 그림으로 보기"
          description="AI 입력 문구에서 결과가 만들어지는 과정, AI 초안을 사람이 고치는 전후 비교, 비트 편집 타임라인을 화면 예시로 확인합니다."
        />
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {aiVisuals.map((asset) =>
            asset.type === "before-after" ? (
              <BeforeAfterVisual key={asset.id} asset={asset} />
            ) : (
              <VisualLessonCard key={asset.id} asset={asset} onSelectView={onSelectView} />
            ),
          )}
        </div>
      </section>

      <AiFeatureBoard onSelectFeature={(view) => onSelectView(view)} />

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <CreditUsagePanel />
        <AiPromptGuide />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader
          eyebrow="Beat Sync"
          title="음악 비트와 자동 마커를 그림처럼 보기"
          description="음악 트랙 위에 생긴 마커를 기준으로 사진과 영상 클립의 끝점을 맞추면 리듬감 있는 쇼츠를 만들 수 있습니다."
        />
        <div className="mt-5">
          <BeatTimelineVisual />
        </div>
      </section>
    </div>
  );
}

function AiFeatureBoard({
  features = aiFeatureCards,
  onSelectFeature,
}: {
  features?: AiFeature[];
  onSelectFeature?: (view: ActiveView) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
      <SectionHeader
        eyebrow="AI Feature Board"
        title="AI 기능 보드"
        description="각 카드는 어떤 버튼을 찾으면 되는지, 언제 쓰는 기능인지, 실습에서 무엇을 만들면 되는지 보여줍니다."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {features.map((feature) => {
          const target = getFeatureTarget(feature.id);
          return (
            <article key={feature.id} className="flex min-h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">{feature.difficulty}</span>
                <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-cyan-100 ring-1 ring-white/10">{feature.badge}</span>
              </div>
              <h3 className="mt-4 text-2xl font-black text-white">{feature.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{feature.easy}</p>
              <div className="mt-4">
                <FeatureButtonPath feature={feature} compact />
              </div>
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-black leading-6 text-slate-950">{feature.practice}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {feature.examples.slice(0, 3).map((example) => (
                  <span key={example} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-200">
                    {example}
                  </span>
                ))}
              </div>
              {target && onSelectFeature ? (
                <button
                  type="button"
                  onClick={() => onSelectFeature(target)}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  자세히 보기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AiFeatureDetailPage({ feature }: { feature: AiFeature }) {
  const visual = getAiVisualForFeature(feature.id);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader eyebrow="AI Detail" title={feature.title} description={feature.purpose} />
        <div className="mt-5 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
          <AiInterfaceMockup feature={feature} />
          <div className="space-y-4">
            <FeatureButtonPath feature={feature} />
            <VersionNoticeBox compact />
            <div className="rounded-2xl bg-white p-5 text-slate-950">
              <p className="text-sm font-black text-cyan-700">이 기능을 쉽게 말하면</p>
              <p className="mt-2 text-lg font-black leading-8">{feature.easy}</p>
            </div>
          </div>
        </div>
      </section>

      {visual ? (
        visual.type === "before-after" ? (
          <BeforeAfterVisual asset={visual} />
        ) : (
          <VisualLessonCard asset={visual} />
        )
      ) : null}

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <InfoCard title="바로 해볼 실습" eyebrow="Student Practice">
          <p className="text-lg font-black leading-8 text-cyan-100">{feature.practice}</p>
          <div className="mt-4 grid gap-2">
            {feature.examples.map((example) => (
              <div key={example} className="rounded-2xl bg-white/5 p-3 text-sm font-bold text-slate-200">
                {example}
              </div>
            ))}
          </div>
        </InfoCard>
        <InfoCard title="주의할 점" eyebrow="Before Generate">
          <p className="rounded-2xl bg-amber-400/10 p-4 text-base font-black leading-7 text-amber-100 ring-1 ring-amber-300/20">{feature.caution}</p>
          <div className="mt-4">
            <CreditUsagePanel compact />
          </div>
        </InfoCard>
      </section>

      <AiPromptGuide prompt={feature.prompt ?? promptGuide.goodPrompt} />
    </div>
  );
}

function FeatureButtonPath({ compact = false, feature }: { compact?: boolean; feature: AiFeature }) {
  const path = getFeaturePath(feature.id);

  return (
    <div className={cn("rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4", compact ? "p-3" : "p-5")}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">어디를 누르나요?</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {path.map((item, index) => (
          <div key={`${feature.id}-${item}`} className="flex items-center gap-2">
            <span className={cn("rounded-xl bg-white text-slate-950 shadow-sm", compact ? "px-3 py-2 text-xs font-black" : "px-4 py-3 text-sm font-black")}>
              {item}
            </span>
            {index < path.length - 1 ? <ArrowRight className="h-4 w-4 text-cyan-200" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function getAiVisualForFeature(id: string) {
  const map: Record<string, string> = {
    "ai-image": "ai-first-scene",
    "ai-video": "ai-video-generation-process",
    "image-to-video": "day4-product-cardnews-preview",
    "ai-design": "ai-first-scene",
  };
  return map[id] ? getVisualAsset(map[id]) : null;
}

function getFeaturePath(id: string) {
  const map: Record<string, string[]> = {
    "ai-image": ["미디어", "AI 미디어", "AI 이미지", "문구 입력", "생성"],
    "ai-video": ["AI 도구", "AI 영상", "문구 입력", "생성", "타임라인 수정"],
    "image-to-video": ["미디어", "이미지 선택", "이미지→영상", "움직임 생성", "타임라인 배치"],
    "ai-design": ["AI 도구", "AI Design", "썸네일", "문구 입력", "생성"],
    "text-to-speech": ["텍스트", "텍스트 음성 변환", "목소리 선택", "생성"],
    "auto-caption": ["텍스트", "자동 자막", "언어 선택", "생성"],
    "smart-cutout": ["클립 선택", "배경 제거", "Smart Cutout", "적용"],
    "motion-tracking": ["오버레이 선택", "트래킹", "대상 지정", "적용"],
    "beat-sync": ["오디오 선택", "Beat Sync", "자동 마커", "컷 맞추기"],
  };
  return map[id] ?? ["기능 선택", "설정 확인", "적용"];
}

function AiInterfaceMockup({ feature }: { feature: AiFeature }) {
  const path = getFeaturePath(feature.id);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#101214] shadow-2xl">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#17191c] p-3">
        {["미디어", "오디오", "텍스트", "스티커", "효과", "AI 도구"].map((item) => (
          <span
            key={item}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-black",
              path.join(" ").includes(item.replace(" 도구", "")) || item === "AI 도구" ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300",
            )}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="grid min-h-[420px] gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-b border-white/10 bg-[#1d2023] p-4 md:border-b-0 md:border-r">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">왼쪽 패널</p>
          <div className="mt-4 grid gap-2">
            {path.slice(0, 4).map((item, index) => (
              <div
                key={item}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-black",
                  index === Math.min(2, path.length - 1) ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-200",
                )}
              >
                {item}
                {index === Math.min(2, path.length - 1) ? <MousePointerClick className="h-4 w-4" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-rows-[auto_1fr_auto]">
          <div className="rounded-2xl bg-white p-4 text-slate-950">
            <p className="text-sm font-black text-cyan-700">입력 문구 / 설정</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{feature.prompt ?? feature.practice}</p>
            <button type="button" className="mt-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              {path[path.length - 1]}
            </button>
          </div>
          <AiResultPreview feature={feature} />
          <div className="rounded-2xl bg-[#24272a] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-400">
              <span>타임라인</span>
              <span>생성 결과는 여기서 직접 편집</span>
            </div>
            <div className="grid gap-2">
              <div className="h-12 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950">AI 결과 클립</div>
              <div className="h-10 rounded-xl bg-amber-300 px-3 py-2 text-sm font-black text-slate-950">자막 / 제목</div>
              <div className="h-8 rounded-xl bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950">음악</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiResultPreview({ feature }: { feature: AiFeature }) {
  return (
    <div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 p-4">
      <div className="absolute left-4 top-4 rounded-2xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">{feature.navLabel}</div>
      <div className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-2 text-xs font-black text-white">미리보기</div>
      <div className="mt-14 grid h-full min-h-[120px] place-items-center rounded-2xl border border-dashed border-cyan-300/30 bg-white/5 p-5 text-center">
        <div>
          <Sparkles className="mx-auto h-8 w-8 text-cyan-200" aria-hidden="true" />
          <p className="mt-3 text-xl font-black text-white">AI가 만든 초안</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-300">이대로 제출하지 않고 컷, 자막, 음악을 직접 다듬습니다.</p>
        </div>
      </div>
    </div>
  );
}

function VersionNoticeBox({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4", compact ? "text-sm" : "text-base")}>
      <p className="font-black text-amber-100">버전 / 기기 / 요금제에 따라 다를 수 있어요</p>
      <p className="mt-2 font-bold leading-7 text-slate-200">{aiVersionNotice}</p>
    </div>
  );
}

function CreditUsagePanel({ compact = false }: { compact?: boolean }) {
  const checks = compact ? creditGuide.checklist.slice(0, 3) : creditGuide.checklist;

  return (
    <article className={cn("rounded-3xl border border-white/10 bg-[#1b1d20] shadow-xl", compact ? "p-4" : "p-6")}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Credits</p>
      <h2 className={cn("mt-2 font-black text-white", compact ? "text-xl" : "text-2xl")}>{creditGuide.title}</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{compact ? creditGuide.easy : creditGuide.description}</p>
      <div className="mt-4 rounded-2xl bg-white p-4 text-slate-950">
        <div className="flex items-center justify-between text-sm font-black">
          <span>생성 전</span>
          <span>Credits 확인</span>
          <span>생성 / 적용</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="h-3 rounded-full bg-emerald-400" />
          <div className="h-3 rounded-full bg-amber-300" />
          <div className="h-3 rounded-full bg-rose-300" />
        </div>
      </div>
      {!compact ? <BulletList items={creditGuide.bullets} tone="amber" /> : null}
      <div className="mt-4 space-y-2">
        {checks.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-white/5 p-3 text-sm font-bold leading-6 text-slate-200">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-300 text-xs font-black text-slate-950">?</span>
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}

function AiCreditsPage() {
  return (
    <div className="space-y-5">
      <CreditUsagePanel />
      <InfoCard title="AI 생성 버튼을 누르기 전" eyebrow="Before Click">
        <p className="rounded-2xl bg-amber-400/10 p-5 text-lg font-black leading-8 text-amber-100 ring-1 ring-amber-300/20">{creditGuide.classMessage}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {aiBeforeUseChecklist.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-white/5 p-4 text-sm font-bold leading-6 text-slate-200">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-300 text-xs font-black text-slate-950">✓</span>
              {item}
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}

function BeatTimelineVisual({ compact = false }: { compact?: boolean }) {
  const beats = [8, 18, 30, 43, 57, 69, 82, 93];
  const clips = [
    { label: "사진 1", left: 3, width: 15, tone: "bg-cyan-400" },
    { label: "사진 2", left: 18, width: 12, tone: "bg-blue-400" },
    { label: "사진 3", left: 30, width: 13, tone: "bg-violet-400" },
    { label: "사진 4", left: 43, width: 14, tone: "bg-emerald-400" },
    { label: "사진 5", left: 57, width: 25, tone: "bg-amber-300" },
  ];

  return (
    <div className={cn("rounded-3xl border border-white/10 bg-[#101214] p-4", compact ? "mt-4" : "")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Timeline Visual</p>
          <h3 className="mt-1 text-xl font-black text-white">자동 마커에 맞춰 클립 끝점 정렬</h3>
        </div>
        <span className="rounded-2xl bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950">오디오 선택 → Beat Sync</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-[#232629] p-4">
        <div className="relative h-12 rounded-xl bg-slate-950">
          {beats.map((beat) => (
            <span
              key={beat}
              className="absolute top-0 h-full w-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
              style={{ left: `${beat}%` } as CSSProperties}
            />
          ))}
          <div className="absolute inset-x-3 top-1/2 h-2 -translate-y-1/2 rounded-full bg-emerald-400/70" />
          <span className="absolute left-3 top-3 text-xs font-black text-white">음악</span>
        </div>
        <div className="relative mt-4 h-20 rounded-xl bg-slate-950">
          {clips.map((clip) => (
            <span
              key={clip.label}
              className={cn("absolute top-3 h-12 rounded-xl px-2 py-4 text-xs font-black text-slate-950", clip.tone)}
              style={{ left: `${clip.left}%`, width: `${clip.width}%` } as CSSProperties}
            >
              {clip.label}
            </span>
          ))}
        </div>
        {!compact ? (
          <p className="mt-4 text-sm font-bold leading-6 text-slate-300">
            마커가 생겼다고 모든 지점에 컷을 넣는 것은 아닙니다. 강한 박자 4~8개를 고르고, 사진이나 영상 클립의 끝점을 그 위치에 맞춥니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BeatSyncLesson() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader eyebrow="Beat Sync" title={beatSyncGuide.title} description={beatSyncGuide.description} />
        <div className="mt-5">
          <FeatureButtonPath feature={getAiFeatureById("beat-sync") ?? aiFeatureCards[aiFeatureCards.length - 1]!} />
        </div>
        <div className="mt-5">
          <BeatTimelineVisual />
        </div>
      </section>
      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <InfoCard title="따라하기 순서" eyebrow="Workflow">
          <NumberedList items={beatSyncGuide.flow} />
        </InfoCard>
        <InfoCard title="초보자가 주의할 점" eyebrow="Caution">
          <BulletList items={beatSyncGuide.cautions} tone="amber" />
          <div className="mt-5">
            <ProjectSection title="비교 질문" items={beatSyncGuide.compareQuestions} />
          </div>
        </InfoCard>
      </section>
      <PracticeProjectCard project={{ ...beatSyncGuide.practice, category: "음악 비트" }} />
    </div>
  );
}

function AiPromptGuide({ prompt }: { prompt?: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">입력 문구</p>
      <h2 className="mt-2 text-2xl font-black text-white">{promptGuide.title}</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{promptGuide.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {promptGuide.formula.map((item) => (
          <span key={item} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-950">
            {item}
          </span>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-rose-400/10 p-4 ring-1 ring-rose-300/20">
          <p className="text-sm font-black text-rose-200">아쉬운 입력 문구</p>
          <p className="mt-2 text-base font-black leading-7 text-slate-200">{promptGuide.badPrompt}</p>
        </div>
        <div className="rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/20">
          <p className="text-sm font-black text-emerald-200">좋은 입력 문구</p>
          <p className="mt-2 text-base font-black leading-7 text-slate-200">{prompt ?? promptGuide.goodPrompt}</p>
        </div>
      </div>
      <p className="mt-5 rounded-2xl bg-cyan-400/10 p-4 text-sm font-bold leading-6 text-cyan-100 ring-1 ring-cyan-300/20">
        {promptGuide.studentPractice}
      </p>
    </article>
  );
}

function AiPracticeExamples() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader
          eyebrow="AI Practice"
          title="AI 실습 예제 모음"
          description="AI 이미지, AI 영상, 이미지에서 영상 만들기를 실제 결과물로 이어가는 학생용 실습지입니다."
        />
      </section>
      <AiPromptGuide />
      {aiPracticeExamples.map((project) => (
        <PracticeProjectCard key={project.title} project={project} />
      ))}
    </div>
  );
}

function ReferencePage({
  activeView,
  finalChecks,
  finalProject,
  onSelectView,
  onToggleFinal,
  updateFinalProject,
}: {
  activeView: ActiveView;
  finalChecks: Record<string, boolean>;
  finalProject: Record<string, string>;
  onSelectView: (view: ActiveView) => void;
  onToggleFinal: (key: string) => void;
  updateFinalProject: (key: string, value: string) => void;
}) {
  if (activeView === "shortcuts") return <ShortcutCheatSheet />;
  if (activeView === "magic") return <MagicPage />;
  if (activeView === "practice") return <PracticePage />;
  if (activeView === "ai-overview") return <AiOverviewPage onSelectView={onSelectView} />;
  if (activeView === "ai-credits") return <AiCreditsPage />;
  if (activeView === "beat-sync" || activeView === "beat-markers") return <BeatSyncLesson />;
  if (activeView === "ai-practice") return <AiPracticeExamples />;
  const aiFeature = getAiFeatureByView(activeView);
  if (aiFeature) return <AiFeatureDetailPage feature={aiFeature} />;
  return <FinalChecklistPage finalChecks={finalChecks} finalProject={finalProject} onToggleFinal={onToggleFinal} updateFinalProject={updateFinalProject} />;
}

function ShortcutCheatSheet() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
      <SectionHeader eyebrow="Shortcut" title="단축키 치트시트" description="화면을 보면서 바로 써야 하는 필수 단축키만 모았습니다." />
      <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {shortcutItems.map((item) => (
          <article key={item.action} className="rounded-2xl bg-white p-5 text-slate-950">
            <div className="flex flex-wrap gap-2">
              {item.keys.map((key) => (
                <span key={key} className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white">{key}</span>
              ))}
            </div>
            <h3 className="mt-4 text-xl font-black">{item.action}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{item.use}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MagicPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
      <SectionHeader eyebrow="Magic" title="마법 기능" description="초보자가 흥미를 느끼는 자동 기능은 실제 화면 위치와 함께 다시 연결해서 설명합니다." />
      <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {magicItems.map((item) => (
          <article key={item.title} className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-5">
            <Sparkles className="h-6 w-6 text-cyan-300" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black text-white">{item.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{item.description}</p>
            <p className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-950">{item.day}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PracticePage() {
  const [filter, setFilter] = useState("전체");
  const projects: PracticeProjectWithAi[] = [
    ...practiceProjectCatalog.map((project) => ({ ...project, category: getPracticeCategory(project) })),
    { ...beatSyncGuide.practice, category: "음악 비트" },
    ...aiPracticeExamples,
  ];
  const filters = ["전체", "기본 편집", "자막 / 오디오", "오버레이 / 키프레임", "음악 비트", "AI 이미지", "AI 영상", "최종 프로젝트"];
  const visibleProjects = filter === "전체" ? projects : projects.filter((project) => project.category === filter);
  const readyExampleCount = projects.reduce((total, project) => total + getPracticeExamplePack(project.title).length, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader
          eyebrow="Practice Workbook"
          title="실습 예제 모음"
          description="학생용 실습지처럼 바로 따라할 수 있도록 준비물, 조건, 순서, 완성 기준, 완성 예시, 바로 써먹는 예제팩을 함께 넣었습니다."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetaPill label="전체 과제" value={`${projects.length}개`} />
          <MetaPill label="바로 써먹는 예제" value={`${readyExampleCount}개`} />
          <MetaPill label="현재 보기" value={`${visibleProjects.length}개`} />
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition",
                filter === item ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-200 hover:bg-white/10",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      {visibleProjects.map((project) => (
        <PracticeProjectCard key={project.title} project={project} />
      ))}
    </div>
  );
}

function FinalChecklistPage({
  finalChecks,
  finalProject,
  onToggleFinal,
  updateFinalProject,
}: {
  finalChecks: Record<string, boolean>;
  finalProject: Record<string, string>;
  onToggleFinal: (key: string) => void;
  updateFinalProject: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#1b1d20] p-6">
        <SectionHeader eyebrow="Final" title="최종 체크리스트" description="완성 전에 실제 CapCut 화면에서 하나씩 확인해야 하는 항목입니다." />
        <div className="mt-6 grid gap-3 xl:grid-cols-2">
          {finalChecklist.map((item, index) => {
            const key = `final-${index}`;
            return <CheckRow key={key} checked={Boolean(finalChecks[key])} label={item} onClick={() => onToggleFinal(key)} />;
          })}
        </div>
      </section>
      <FinalProjectBoard finalProject={finalProject} updateFinalProject={updateFinalProject} />
    </div>
  );
}

function SectionHeader({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black text-white">{title}</h2>
      <p className="mt-2 text-base font-bold leading-7 text-slate-300">{description}</p>
    </div>
  );
}

function RightReferencePanel({ activeView }: { activeView: ActiveView }) {
  const isAiView = isAiReferenceView(activeView);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-cyan-400 p-5 text-slate-950">
        <p className="text-sm font-black uppercase tracking-[0.18em]">Reference</p>
        <h2 className="mt-2 text-2xl font-black">{getReferenceTitle(activeView)}</h2>
      </div>
      {isAiView ? (
        <>
          <VersionNoticeBox compact />
          <CreditUsagePanel compact />
          <PanelBlock title="AI 학습 순서" body="먼저 버튼처럼 보이는 경로를 보고, 실제 캡컷 화면에서 비슷한 메뉴 이름을 찾은 뒤, 생성 결과를 타임라인에서 직접 고쳐봅니다." />
        </>
      ) : (
        <>
          <PanelBlock title="사용 방법" body="왼쪽 메뉴에서 Day 화면으로 돌아가면 캡컷 화면 위 번호를 누르며 실제 위치와 기능을 연결해서 볼 수 있습니다." />
          <PanelBlock title="처음 보는 순서" body="첫 화면 이해하기에서 큰 영역을 익힌 뒤 Day별 화면으로 이동하면 가져오기, 타임라인, 자막, 오버레이, 내보내기 흐름이 자연스럽게 이어집니다." />
        </>
      )}
    </div>
  );
}

function getReferenceTitle(view: ActiveView) {
  const map: Partial<Record<ActiveView, string>> = {
    shortcuts: "단축키 치트시트",
    magic: "마법 기능",
    practice: "실습 예제",
    final: "최종 체크리스트",
    "ai-overview": "최신 AI 기능",
    "ai-image": "AI 이미지 생성",
    "ai-video": "AI 영상 생성",
    "image-to-video": "이미지에서 영상 만들기",
    "ai-design": "AI Design / 썸네일 제작",
    "ai-credits": "AI 사용량과 Credits 이해",
    "beat-sync": "음악 비트 자동 편집",
    "beat-markers": "자동 마커 / Beat Sync",
    "ai-practice": "AI 실습 예제 모음",
  };
  return map[view] ?? "캡컷 학습";
}

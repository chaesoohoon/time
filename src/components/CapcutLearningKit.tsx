"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  LayoutDashboard,
  Layers3,
  PenLine,
  PlusCircle,
  Search,
  Timeline,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonExample = {
  label: string;
  press: string;
  result: string;
  tone: "blue" | "green" | "amber" | "rose" | "violet";
};

type Mission = {
  title: string;
  materials: string[];
  steps: string[];
  done: string[];
  submit: string[];
};

type LessonScript = {
  opening: string;
  demo: string;
  practice: string;
  closing: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type Day = {
  id: number;
  title: string;
  shortTitle: string;
  goal: string;
  outcome: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "rose" | "violet";
  skills: string[];
  buttonExamples: ButtonExample[];
  mission: Mission;
  scripts: LessonScript;
  durationPlans: Record<"30분" | "1시간" | "2시간", string[]>;
  checklist: string[];
  mistakes: string[];
  quiz: QuizQuestion[];
};

type Concept = {
  title: string;
  easy: string;
  caption: string;
  tone: "blue" | "green" | "amber" | "rose" | "violet";
};

const toneClasses = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    solid: "bg-blue-600",
    soft: "bg-blue-100",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    solid: "bg-emerald-600",
    soft: "bg-emerald-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    solid: "bg-amber-500",
    soft: "bg-amber-100",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    solid: "bg-rose-600",
    soft: "bg-rose-100",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    solid: "bg-violet-600",
    soft: "bg-violet-100",
  },
};

const concepts: Concept[] = [
  {
    title: "타임라인",
    easy: "영상 조각들이 시간 순서대로 놓이는 작업대입니다.",
    caption: "위에서 아래로 영상, 자막, 음악이 층처럼 쌓입니다.",
    tone: "blue",
  },
  {
    title: "클립",
    easy: "편집할 수 있는 영상, 사진, 음악 한 조각입니다.",
    caption: "선택한 조각의 양끝을 잡아 길이를 줄이거나 늘립니다.",
    tone: "green",
  },
  {
    title: "자막",
    easy: "영상 위에 올리는 글자입니다.",
    caption: "말소리를 글자로 보여주거나 중요한 단어를 강조합니다.",
    tone: "amber",
  },
  {
    title: "오버레이",
    easy: "기본 영상 위에 하나 더 올리는 이미지나 영상입니다.",
    caption: "로고, 스티커, 비교 화면, 제품 사진을 얹을 때 씁니다.",
    tone: "rose",
  },
  {
    title: "키프레임",
    easy: "처음 모습과 마지막 모습을 찍어 움직임을 만드는 점입니다.",
    caption: "시작점과 끝점만 정하면 중간 움직임은 자동으로 이어집니다.",
    tone: "violet",
  },
];

const days: Day[] = [
  {
    id: 1,
    title: "캡컷 시작하기와 기본 컷 편집",
    shortTitle: "컷 편집",
    goal: "캡컷 화면 구조를 이해하고 영상을 불러와 자르고 붙이는 기본 편집을 익힙니다.",
    outcome: "10초 자기소개 영상 1개",
    icon: LayoutDashboard,
    tone: "blue",
    skills: ["새 프로젝트 만들기", "영상과 사진 불러오기", "화면 비율 설정", "타임라인 이해", "클립 선택", "자르기", "분할", "삭제", "클립 순서 바꾸기", "기본 내보내기"],
    buttonExamples: [
      { label: "+ 새 프로젝트", press: "홈 화면 아래쪽의 파란 + 버튼", result: "편집 화면으로 들어갑니다.", tone: "blue" },
      { label: "추가", press: "영상 3개 선택 후 오른쪽 아래 [추가]", result: "선택한 영상이 타임라인에 놓입니다.", tone: "green" },
      { label: "분할", press: "흰 재생선을 자를 위치에 놓고 아래 [분할]", result: "클립이 두 조각으로 나뉩니다.", tone: "amber" },
      { label: "삭제", press: "필요 없는 조각 선택 후 [삭제]", result: "실수 장면이 사라집니다.", tone: "rose" },
    ],
    mission: {
      title: "10초 자기소개 영상 만들기",
      materials: ["짧은 말하기 영상 2개", "손 흔드는 사진 1장", "9:16 세로 화면"],
      steps: ["새 프로젝트를 누릅니다.", "영상과 사진을 불러옵니다.", "실수한 앞뒤 부분을 자릅니다.", "필요 없는 중간 장면은 분할 후 삭제합니다.", "자연스러운 순서로 배치합니다.", "1080p MP4로 내보냅니다."],
      done: ["전체 길이 8~12초", "실수 장면 없음", "처음과 끝이 어색하게 끊기지 않음"],
      submit: ["완성 영상 1개", "가장 어려웠던 버튼 1개 메모"],
    },
    scripts: {
      opening: "오늘은 캡컷을 처음 여는 날입니다. 잘 만드는 것보다, 어디를 눌러야 영상이 움직이는지 손에 익히는 것이 목표입니다.",
      demo: "제가 먼저 새 프로젝트를 누르고 영상을 하나 올려볼게요. 여기 아래 긴 줄이 타임라인입니다. 이 줄에서 조각을 선택해야 자르기와 삭제가 보입니다.",
      practice: "지금부터 각자 영상 3개를 올립니다. 완벽하게 고르지 않아도 됩니다. 실수 장면이 있어야 자르기 연습을 할 수 있습니다.",
      closing: "오늘 완성 기준은 화려함이 아니라 끝까지 내보내기입니다. 파일이 저장되었다면 Day 1은 성공입니다.",
    },
    durationPlans: {
      "30분": ["화면 구조 5분", "새 프로젝트와 불러오기 7분", "자르기와 분할 12분", "내보내기 6분"],
      "1시간": ["화면 구조 10분", "강사 시연 10분", "개별 실습 25분", "서로 영상 확인 10분", "체크리스트 5분"],
      "2시간": ["기초 버튼 투어 20분", "컷 편집 시연 20분", "실습 45분", "1:1 도움 20분", "내보내기와 공유 15분"],
    },
    checklist: ["새 프로젝트 버튼을 찾았다.", "영상이나 사진을 3개 이상 불러왔다.", "타임라인에서 클립을 선택했다.", "클립 앞뒤를 한 번 이상 잘랐다.", "분할 후 삭제를 한 번 이상 해봤다.", "1080p MP4로 내보냈다."],
    mistakes: ["화면 비율을 정하지 않고 시작합니다.", "선택하지 않은 상태에서 자르기 버튼을 찾습니다.", "저장과 내보내기를 같은 것으로 착각합니다.", "필요 없는 장면을 너무 길게 남깁니다."],
    quiz: [
      { question: "타임라인은 무엇을 하는 곳인가요?", options: ["영상을 시간 순서대로 놓고 편집하는 곳", "완성 영상을 업로드하는 곳", "앱 설정을 바꾸는 곳"], answer: "영상을 시간 순서대로 놓고 편집하는 곳", explanation: "타임라인은 영상 조각이 시간 순서대로 놓이는 작업대입니다." },
      { question: "클립을 두 조각으로 나누려면 어떤 버튼을 누르나요?", options: ["분할", "필터", "내보내기"], answer: "분할", explanation: "흰 재생선을 자를 위치에 두고 [분할]을 누릅니다." },
      { question: "완성 영상을 파일로 저장하는 마지막 버튼은?", options: ["내보내기", "되돌리기", "오버레이"], answer: "내보내기", explanation: "내보내기를 해야 휴대폰이나 컴퓨터에 완성 파일이 생깁니다." },
    ],
  },
  {
    id: 2,
    title: "속도 조절과 화면 전환",
    shortTitle: "속도와 전환",
    goal: "느린 장면은 빠르게 정리하고 중요한 장면은 천천히 보여주는 방법을 익힙니다.",
    outcome: "15초 작업 과정 숏폼",
    icon: Clock3,
    tone: "green",
    skills: ["일반 속도 조절", "느리게 만들기", "빠르게 만들기", "커브 속도 이해", "화면 전환 효과", "페이드 전환", "줌 전환", "음악 비트에 맞춰 컷 나누기"],
    buttonExamples: [
      { label: "속도", press: "클립 선택 후 아래 메뉴 [속도]", result: "1배속, 2배속, 4배속을 고를 수 있습니다.", tone: "green" },
      { label: "일반", press: "[속도] 안에서 [일반]", result: "클립 전체 속도가 일정하게 바뀝니다.", tone: "blue" },
      { label: "전환", press: "클립과 클립 사이 작은 흰 사각형", result: "장면이 바뀌는 느낌을 부드럽게 만듭니다.", tone: "amber" },
      { label: "비트 맞추기", press: "음악 파형을 보며 재생선을 박자 위치로 이동", result: "박자에 맞춰 컷이 바뀝니다.", tone: "violet" },
    ],
    mission: {
      title: "요리 또는 작업 과정 15초 숏폼 만들기",
      materials: ["과정이 보이는 영상 4~6개", "빠른 느낌의 배경음악", "9:16 세로 화면"],
      steps: ["긴 준비 과정은 과감하게 자릅니다.", "반복 장면은 2배속 또는 4배속으로 처리합니다.", "중요한 순간은 0.5배속으로 천천히 보여줍니다.", "장면이 바뀌는 곳에 기본 전환을 넣습니다.", "음악 비트에 맞춰 컷 길이를 조정합니다."],
      done: ["길이 13~17초", "빠른 장면과 느린 장면이 모두 있음", "전환이 2개 이하로 과하지 않음"],
      submit: ["작업 과정 영상 1개", "가장 빨리 처리한 장면 설명"],
    },
    scripts: {
      opening: "Day 2의 핵심은 속도입니다. 영상이 지루한 이유는 대부분 필요한 장면과 필요 없는 장면의 시간이 똑같이 길기 때문입니다.",
      demo: "이 장면은 손을 씻는 과정이라 정보가 적습니다. 4배속으로 줄여볼게요. 반대로 완성품을 보여주는 장면은 천천히 두겠습니다.",
      practice: "여러분 영상에서 반복되는 장면 하나를 찾아 빠르게 만들고, 가장 중요한 장면 하나는 느리게 만들어보세요.",
      closing: "좋은 숏폼은 모든 장면이 빠른 영상이 아닙니다. 빨라야 할 곳과 멈춰 봐야 할 곳이 구분되는 영상입니다.",
    },
    durationPlans: {
      "30분": ["속도 개념 5분", "빠르게/느리게 시연 8분", "전환 5분", "15초 실습 12분"],
      "1시간": ["예시 비교 10분", "속도 실습 20분", "전환과 음악 15분", "결과 공유 15분"],
      "2시간": ["속도 감각 훈련 20분", "비트 컷 시연 20분", "개별 편집 50분", "리듬 피드백 20분", "수정 10분"],
    },
    checklist: ["반복 장면을 하나 골랐다.", "클립 속도를 2배속 이상으로 바꿨다.", "중요 장면을 느리게 처리했다.", "전환 효과를 1~2개만 넣었다.", "음악 박자와 컷 위치를 맞춰봤다.", "완성 길이를 15초 안팎으로 맞췄다."],
    mistakes: ["모든 클립에 전환을 넣어 화면이 산만해집니다.", "너무 빠르게 만들어 무엇을 하는지 보이지 않습니다.", "속도 조절 후 자막이나 음악 타이밍을 확인하지 않습니다.", "중요 장면까지 빠르게 넘깁니다."],
    quiz: [
      { question: "반복되는 장면을 짧게 보이게 할 때 좋은 기능은?", options: ["속도 조절", "배경 제거", "자막 스타일"], answer: "속도 조절", explanation: "속도를 빠르게 하면 긴 과정을 짧은 시간에 보여줄 수 있습니다." },
      { question: "전환 효과는 어디에 넣나요?", options: ["클립과 클립 사이", "자막 글자 안", "내보내기 화면"], answer: "클립과 클립 사이", explanation: "전환은 장면과 장면 사이의 바뀌는 느낌을 조절합니다." },
      { question: "숏폼 리듬을 좋게 만들려면 무엇을 맞추면 좋나요?", options: ["음악 비트와 컷", "앱 언어 설정", "파일 이름"], answer: "음악 비트와 컷", explanation: "박자에 맞춰 컷이 바뀌면 영상이 더 경쾌하게 느껴집니다." },
    ],
  },
  {
    id: 3,
    title: "자막과 오디오 마스터",
    shortTitle: "자막과 소리",
    goal: "말소리를 잘 보이게 만들고 음악, 효과음, 목소리의 균형을 맞춥니다.",
    outcome: "정보 전달형 숏폼 1개",
    icon: BookOpenCheck,
    tone: "amber",
    skills: ["자동 자막 생성", "자막 오타 수정", "자막 줄바꿈 정리", "자막 크기와 위치 조정", "강조 자막 만들기", "배경음악 넣기", "효과음 넣기", "볼륨 조절", "목소리와 음악 밸런스 맞추기"],
    buttonExamples: [
      { label: "텍스트", press: "아래 메뉴 [텍스트]", result: "자막과 제목을 넣는 메뉴가 열립니다.", tone: "amber" },
      { label: "자동 자막", press: "[텍스트] > [자동 자막]", result: "말소리가 자막으로 변환됩니다.", tone: "blue" },
      { label: "오디오", press: "아래 메뉴 [오디오]", result: "음악과 효과음을 추가합니다.", tone: "green" },
      { label: "볼륨", press: "오디오 클립 선택 후 [볼륨]", result: "목소리, 음악, 효과음 크기를 따로 맞춥니다.", tone: "rose" },
    ],
    mission: {
      title: "정보 전달형 숏폼 만들기",
      materials: ["말하는 영상 1개", "조용한 배경음악 1개", "클릭 또는 등장 효과음 1~2개"],
      steps: ["말하는 영상을 불러옵니다.", "자동 자막을 만듭니다.", "긴 문장은 짧게 나눕니다.", "중요 단어는 색상이나 크기로 강조합니다.", "배경음악은 작게 넣습니다.", "효과음은 중요한 순간에만 넣습니다."],
      done: ["자막이 화면 밖으로 나가지 않음", "목소리가 음악보다 잘 들림", "중요 단어가 한눈에 보임"],
      submit: ["정보 전달형 영상 1개", "강조한 단어 3개"],
    },
    scripts: {
      opening: "오늘부터 영상은 보는 것뿐 아니라 읽고 듣는 자료가 됩니다. 자막과 소리는 초보자 영상의 완성도를 가장 빨리 올려줍니다.",
      demo: "자동 자막을 만들면 편하지만 그대로 쓰면 길고 답답합니다. 한 줄을 짧게 나누고 중요한 단어만 크게 바꾸겠습니다.",
      practice: "여러분은 먼저 자동 자막을 만든 뒤, 가장 중요한 단어 3개만 강조하세요. 전부 강조하면 아무것도 강조되지 않습니다.",
      closing: "마지막에는 눈을 감고 한 번 들어보세요. 목소리가 또렷하게 들리면 오디오는 절반 이상 성공입니다.",
    },
    durationPlans: {
      "30분": ["자동 자막 8분", "오타와 줄바꿈 8분", "볼륨 조절 7분", "효과음 7분"],
      "1시간": ["좋은/나쁜 자막 비교 10분", "자동 자막 실습 20분", "오디오 밸런스 15분", "수정 15분"],
      "2시간": ["자막 디자인 원칙 20분", "자막 실습 35분", "음악과 효과음 30분", "상호 피드백 20분", "최종 내보내기 15분"],
    },
    checklist: ["자동 자막을 생성했다.", "오타를 3개 이상 확인했다.", "긴 자막을 짧게 나눴다.", "중요 단어를 색상이나 크기로 강조했다.", "배경음악 볼륨을 낮췄다.", "효과음을 필요한 곳에만 넣었다."],
    mistakes: ["자막이 너무 작아 모바일에서 읽기 어렵습니다.", "배경음악이 커서 목소리가 묻힙니다.", "한 화면에 자막을 너무 오래 남깁니다.", "모든 단어를 강조해서 핵심이 흐려집니다."],
    quiz: [
      { question: "말소리를 글자로 자동 변환하는 기능은?", options: ["자동 자막", "오버레이", "키프레임"], answer: "자동 자막", explanation: "자동 자막은 영상 속 말을 글자로 만들어줍니다." },
      { question: "목소리 100일 때 배경음악은 보통 어느 정도가 안전한가요?", options: ["15~30", "100", "200"], answer: "15~30", explanation: "초보자는 배경음악을 작게 깔아 목소리를 우선 들리게 하는 편이 안전합니다." },
      { question: "강조 자막을 만들 때 좋은 방법은?", options: ["핵심 단어만 크게 또는 다른 색으로", "모든 문장을 번쩍이게", "자막을 화면 밖으로 배치"], answer: "핵심 단어만 크게 또는 다른 색으로", explanation: "강조는 적게 쓸수록 더 잘 보입니다." },
    ],
  },
  {
    id: 4,
    title: "오버레이, 키프레임, 배경 제거",
    shortTitle: "움직임 효과",
    goal: "이미지와 로고를 영상 위에 올리고, 시작점과 끝점을 정해 화면 움직임을 만듭니다.",
    outcome: "제품 소개 또는 카드뉴스형 움직이는 영상",
    icon: Layers3,
    tone: "rose",
    skills: ["오버레이 추가", "이미지와 로고 넣기", "스티커 사용", "키프레임 이해", "화면 확대", "화면 이동", "사진에 움직임 주기", "인물 배경 제거", "마스크 기초", "기본 색 보정"],
    buttonExamples: [
      { label: "오버레이", press: "아래 메뉴 [오버레이] > [오버레이 추가]", result: "기본 영상 위에 새 이미지나 영상이 올라갑니다.", tone: "rose" },
      { label: "스티커", press: "아래 메뉴 [스티커]", result: "화살표, 로고, 장식 요소를 넣습니다.", tone: "amber" },
      { label: "◇ 키프레임", press: "클립 선택 후 미리보기 옆 다이아몬드 버튼", result: "처음 위치와 마지막 위치를 기억합니다.", tone: "violet" },
      { label: "배경 제거", press: "오버레이 선택 후 [배경 제거]", result: "인물이나 제품만 남길 수 있습니다.", tone: "green" },
    ],
    mission: {
      title: "제품 소개 또는 카드뉴스형 영상 만들기",
      materials: ["배경 영상 1개", "제품 또는 인물 이미지 1개", "로고나 스티커 1개"],
      steps: ["배경 영상을 넣습니다.", "제품 이미지를 오버레이로 올립니다.", "키프레임으로 천천히 확대합니다.", "로고나 스티커를 배치합니다.", "가능하면 배경 제거를 적용합니다.", "밝기와 대비를 살짝 조절합니다."],
      done: ["오버레이가 기본 영상 위에 보임", "키프레임 움직임이 1개 이상 있음", "텍스트와 이미지가 서로 가리지 않음"],
      submit: ["움직이는 소개 영상 1개", "사용한 오버레이 종류 2개"],
    },
    scripts: {
      opening: "오늘은 영상 위에 다른 요소를 올립니다. 오버레이는 종이를 한 장 더 얹는 느낌으로 이해하면 쉽습니다.",
      demo: "제품 사진을 오버레이로 올리고 처음에는 작게, 마지막에는 크게 만들어보겠습니다. 이때 다이아몬드 모양 키프레임을 씁니다.",
      practice: "각자 이미지 하나를 올린 뒤, 시작점은 작게, 끝점은 크게 설정해보세요. 움직임이 너무 빠르면 길이를 늘리면 됩니다.",
      closing: "효과가 많다고 좋은 영상이 아닙니다. 오늘은 오버레이 1개, 키프레임 1개만 정확히 성공하면 충분합니다.",
    },
    durationPlans: {
      "30분": ["오버레이 개념 6분", "이미지 올리기 8분", "키프레임 10분", "배경 제거 6분"],
      "1시간": ["레이어 구조 10분", "오버레이 실습 15분", "키프레임 실습 20분", "색 보정과 정리 15분"],
      "2시간": ["오버레이 사례 15분", "키프레임 원리 25분", "개별 프로젝트 50분", "배경 제거와 마스크 20분", "피드백 10분"],
    },
    checklist: ["오버레이 메뉴에서 이미지를 추가했다.", "오버레이 크기와 위치를 조절했다.", "키프레임 시작점을 찍었다.", "키프레임 끝점을 찍었다.", "배경 제거를 한 번 이상 시도했다.", "오버레이가 자막을 가리지 않는지 확인했다."],
    mistakes: ["오버레이를 선택하지 않은 상태에서 메뉴를 찾습니다.", "키프레임을 하나만 찍고 움직이지 않는다고 생각합니다.", "이미지와 자막이 겹쳐 읽기 어렵습니다.", "배경 제거 결과를 확인하지 않고 바로 내보냅니다."],
    quiz: [
      { question: "기본 영상 위에 이미지나 영상을 하나 더 올리는 기능은?", options: ["오버레이", "내보내기", "비율"], answer: "오버레이", explanation: "오버레이는 기본 영상 위에 다른 요소를 층처럼 올리는 기능입니다." },
      { question: "키프레임은 보통 몇 개 이상 있어야 움직임이 보이나요?", options: ["2개", "0개", "1개"], answer: "2개", explanation: "시작점과 끝점이 있어야 변화가 생깁니다." },
      { question: "인물만 남기고 뒤를 지우고 싶을 때 쓰는 기능은?", options: ["배경 제거", "음악 추출", "전환"], answer: "배경 제거", explanation: "배경 제거는 인물이나 제품을 배경에서 분리할 때 씁니다." },
    ],
  },
  {
    id: 5,
    title: "숏폼 영상 완성 프로젝트",
    shortTitle: "최종 완성",
    goal: "5일 동안 배운 기능을 조합해 실제 업로드 가능한 숏폼 영상 하나를 완성합니다.",
    outcome: "30~45초 최종 숏폼 영상",
    icon: ClipboardCheck,
    tone: "violet",
    skills: ["숏폼 기획", "첫 3초 후킹", "컷 편집 정리", "자막 스타일 통일", "음악과 효과음 정리", "템플릿 활용", "최종 점검", "내보내기 설정", "SNS 업로드용 포맷 이해"],
    buttonExamples: [
      { label: "9:16", press: "편집 화면 [비율] > [9:16]", result: "릴스, 쇼츠, 틱톡에 맞는 세로 영상이 됩니다.", tone: "violet" },
      { label: "텍스트 스타일", press: "자막 선택 후 [스타일]", result: "전체 자막 느낌을 통일합니다.", tone: "amber" },
      { label: "1080p", press: "오른쪽 위 [내보내기]에서 해상도 1080p", result: "모바일에서 보기 좋은 품질로 저장됩니다.", tone: "blue" },
      { label: "30fps", press: "내보내기 화면에서 프레임 30fps", result: "대부분의 숏폼에 무난한 설정입니다.", tone: "green" },
    ],
    mission: {
      title: "30~45초 홍보 숏폼 완성하기",
      materials: ["주제 1개", "영상 또는 사진 5개 이상", "후킹 문구 1개", "배경음악 1개", "행동 유도 문구 1개"],
      steps: ["영상 주제를 정합니다.", "첫 3초에 시선을 끄는 문구를 넣습니다.", "필요 없는 장면을 과감하게 삭제합니다.", "자막 스타일을 통일합니다.", "음악과 효과음을 정리합니다.", "마지막에 행동 유도 문구를 넣습니다.", "1080p, 30fps, MP4로 내보냅니다."],
      done: ["첫 3초 안에 주제가 보임", "자막 스타일이 통일됨", "마지막에 행동 유도 문구가 있음", "30~45초 안에 완성"],
      submit: ["최종 영상 1개", "기획표 1장", "스스로 평가한 수정 포인트 1개"],
    },
    scripts: {
      opening: "오늘은 새 기능을 많이 배우는 날이 아니라, 지금까지 배운 기능을 하나의 결과물로 묶는 날입니다.",
      demo: "먼저 기획표를 채웁니다. 주제, 첫 3초 문구, 사용할 장면, 자막 스타일, 음악 분위기, 마지막 문구를 정하면 편집이 훨씬 쉬워집니다.",
      practice: "편집을 시작하기 전에 5분 동안 기획표를 먼저 완성하세요. 기획표가 비어 있으면 타임라인에서 길을 잃기 쉽습니다.",
      closing: "완성 영상은 완벽한 영상이 아니라 업로드 가능한 영상입니다. 오늘은 하나를 끝까지 완성하는 경험이 가장 중요합니다.",
    },
    durationPlans: {
      "30분": ["기획표 5분", "컷 정리 10분", "자막과 음악 10분", "내보내기 5분"],
      "1시간": ["기획 10분", "편집 25분", "자막/오디오 15분", "최종 점검 10분"],
      "2시간": ["기획과 예시 분석 20분", "개별 편집 55분", "중간 피드백 20분", "수정 15분", "상영과 회고 10분"],
    },
    checklist: ["주제와 대상이 정해졌다.", "첫 3초 후킹 문구를 넣었다.", "사용할 장면을 5개 이상 골랐다.", "자막 스타일을 통일했다.", "음악과 효과음 볼륨을 확인했다.", "마지막 행동 유도 문구를 넣었다.", "1080p, 30fps, MP4로 내보냈다."],
    mistakes: ["기획 없이 바로 편집해서 영상 흐름이 흔들립니다.", "첫 3초가 느려서 시청자가 떠납니다.", "자막 스타일이 장면마다 달라 산만합니다.", "최종 내보내기 설정을 확인하지 않습니다."],
    quiz: [
      { question: "숏폼에서 가장 먼저 신경 써야 할 구간은?", options: ["첫 3초", "마지막 파일 이름", "앱 로딩 화면"], answer: "첫 3초", explanation: "첫 3초에 볼 이유가 보여야 끝까지 볼 가능성이 올라갑니다." },
      { question: "세로 숏폼에 가장 많이 쓰이는 화면 비율은?", options: ["9:16", "16:9", "4:3"], answer: "9:16", explanation: "릴스, 쇼츠, 틱톡은 보통 9:16 세로 화면을 사용합니다." },
      { question: "최종 내보내기에서 초보자에게 무난한 설정은?", options: ["1080p, 30fps, MP4", "144p, 10fps, TXT", "8K, 240fps, ZIP"], answer: "1080p, 30fps, MP4", explanation: "1080p, 30fps, MP4는 품질과 호환성의 균형이 좋습니다." },
    ],
  },
];

const glossary = [
  { term: "재생선", meaning: "타임라인 위에서 현재 보고 있는 위치를 알려주는 흰 세로선입니다." },
  { term: "비율", meaning: "영상의 가로와 세로 모양입니다. 숏폼은 보통 9:16을 씁니다." },
  { term: "내보내기", meaning: "편집한 결과를 실제 영상 파일로 저장하는 마지막 단계입니다." },
  { term: "파형", meaning: "음악이나 목소리의 크기를 물결 모양으로 보여주는 표시입니다." },
  { term: "후킹", meaning: "처음 몇 초 안에 계속 보고 싶게 만드는 문구나 장면입니다." },
];

const STORAGE_KEYS = {
  completed: "capcut-learning-completed-v2",
  checks: "capcut-learning-checks-v2",
  quiz: "capcut-learning-quiz-v2",
};

function readStoredRecord(key: string) {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, boolean | string>;
  } catch {
    return {};
  }
}

export default function CapcutLearningKit() {
  const [activeDayId, setActiveDayId] = useState(1);
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const activeDay = useMemo(() => days.find((day) => day.id === activeDayId) || days[0], [activeDayId]);
  const completeCount = days.filter((day) => completedDays[String(day.id)]).length;
  const progress = Math.round((completeCount / days.length) * 100);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      setCompletedDays(readStoredRecord(STORAGE_KEYS.completed) as Record<string, boolean>);
      setCheckedItems(readStoredRecord(STORAGE_KEYS.checks) as Record<string, boolean>);
      setQuizAnswers(readStoredRecord(STORAGE_KEYS.quiz) as Record<string, string>);
    }, 0);

    return () => window.clearTimeout(storageTimer);
  }, []);

  function persistCompleted(next: Record<string, boolean>) {
    setCompletedDays(next);
    window.localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(next));
  }

  function persistChecks(next: Record<string, boolean>) {
    setCheckedItems(next);
    window.localStorage.setItem(STORAGE_KEYS.checks, JSON.stringify(next));
  }

  function persistQuiz(next: Record<string, string>) {
    setQuizAnswers(next);
    window.localStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(next));
  }

  function selectDay(dayId: number) {
    setActiveDayId(dayId);
    window.setTimeout(() => {
      document.getElementById("lesson-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  return (
    <main className="min-h-screen w-full bg-[#f8fafc] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                학생용 캡컷 학습노트
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl break-words text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  캡컷 처음 배우기
                </h1>
                <p className="max-w-2xl break-words text-base font-medium leading-7 text-slate-600 sm:text-lg">
                  어려운 설명은 줄이고, 오늘 누를 버튼과 따라 할 순서만 보며 숏폼 영상을 하나씩 만들어 봅니다.
                </p>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <HeroStat label="전체 과정" value="5일" />
              <HeroStat label="최종 결과물" value="숏폼 1개" />
              <HeroStat label="진행률" value={`${progress}%`} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => selectDay(1)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Day 1 시작하기
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => selectDay(5)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                마지막 결과물 보기
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid min-w-0 content-start gap-4">
            <ProgressPanel progress={progress} completeCount={completeCount} />
            <BeginnerGuide />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <EditorAnatomyPanel />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-slate-500">Roadmap</p>
            <h2 className="text-2xl font-black text-slate-950">5일 학습 로드맵</h2>
          </div>
          <p className="hidden text-sm font-bold text-slate-500 sm:block">완료한 Day는 초록 체크로 표시됩니다.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {days.map((day) => (
            <DayRoadmapCard
              key={day.id}
              day={day}
              active={activeDayId === day.id}
              completed={Boolean(completedDays[String(day.id)])}
              onClick={() => selectDay(day.id)}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-slate-500">Easy Concepts</p>
              <h2 className="text-2xl font-black">그림으로 먼저 이해하기</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-slate-500">
              외우지 말고 모양만 기억하세요. 편집하다가 헷갈릴 때 다시 보면 됩니다.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {concepts.map((concept) => (
              <ConceptCard key={concept.title} concept={concept} />
            ))}
          </div>
        </div>
      </section>

      <section id="lesson-detail" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DayDetail
          day={activeDay}
          checkedItems={checkedItems}
          quizAnswers={quizAnswers}
          completed={Boolean(completedDays[String(activeDay.id)])}
          onToggleComplete={() => {
            persistCompleted({
              ...completedDays,
              [String(activeDay.id)]: !completedDays[String(activeDay.id)],
            });
          }}
          onToggleCheck={(key) => {
            persistChecks({ ...checkedItems, [key]: !checkedItems[key] });
          }}
          onAnswer={(key, answer) => {
            persistQuiz({ ...quizAnswers, [key]: answer });
          }}
        />
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <GlossaryBox />
          <FinalProjectGuide />
        </div>
      </section>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ProgressPanel({ progress, completeCount }: { progress: number; completeCount: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-500">전체 학습 진행</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{progress}%</p>
        </div>
        <div className="shrink-0 rounded-md bg-white p-3 text-blue-700 ring-1 ring-slate-200">
          <Timeline className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-md bg-slate-200">
        <div className="h-full rounded-md bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-600">{completeCount} / 5일 완료</p>
    </div>
  );
}

function BeginnerGuide() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex gap-3">
        <div className="shrink-0 rounded-md bg-white p-2 text-amber-700 ring-1 ring-amber-200">
          <DoorOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="font-black text-amber-950">초보자 안내</h2>
          <p className="break-words text-sm font-semibold leading-6 text-amber-900">
            모르는 단어가 나와도 괜찮습니다. 화면 아래 메뉴에서 버튼을 찾고, 체크리스트를 하나씩 누르면서 따라오면 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditorAnatomyPanel() {
  const parts = [
    { label: "미리보기", desc: "완성 화면을 보는 곳", tone: "bg-blue-100 text-blue-800" },
    { label: "하단 메뉴", desc: "텍스트, 오디오, 오버레이 버튼", tone: "bg-emerald-100 text-emerald-800" },
    { label: "타임라인", desc: "클립을 자르고 순서를 바꾸는 곳", tone: "bg-amber-100 text-amber-900" },
    { label: "내보내기", desc: "완성 파일 저장", tone: "bg-violet-100 text-violet-800" },
  ];

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0 border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-slate-500">Screen Map</p>
              <h2 className="text-2xl font-black text-slate-950">캡컷 화면에서 딱 4곳만 기억하기</h2>
            </div>
            <span className="w-fit rounded-md bg-slate-950 px-3 py-1.5 text-xs font-black text-white">초보자용</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-3">
            <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-black text-white">내보내기</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[0.55fr_0.45fr]">
                <div className="flex aspect-[9/13] min-h-64 flex-col justify-between rounded-lg bg-slate-950 p-4 text-white">
                  <div className="flex justify-between text-xs font-black text-white/50">
                    <span>미리보기</span>
                    <span>9:16</span>
                  </div>
                  <div className="mx-auto w-4/5 rounded-md bg-white px-3 py-2 text-center text-sm font-black text-slate-950">첫 3초 문구</div>
                  <div className="h-10 rounded-md bg-white/10" />
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-500">하단 메뉴</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {["텍스트", "오디오", "오버레이", "효과"].map((button) => (
                        <span key={button} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-black text-slate-700">
                          {button}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-500">타임라인</p>
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-[1.2fr_0.8fr_1fr] gap-1">
                        <span className="h-8 rounded-md bg-blue-200" />
                        <span className="h-8 rounded-md bg-blue-100" />
                        <span className="h-8 rounded-md bg-blue-200" />
                      </div>
                      <div className="ml-8 h-7 rounded-md bg-amber-200" />
                      <div className="h-5 rounded-md bg-emerald-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid content-start gap-3 p-5">
          {parts.map((part, index) => (
            <div key={part.label} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black", part.tone)}>{index + 1}</span>
              <div>
                <p className="font-black text-slate-950">{part.label}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{part.desc}</p>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-black text-blue-800">처음엔 이것만</p>
            <p className="mt-2 text-sm font-bold leading-6 text-blue-950">
              위쪽은 결과를 보는 곳, 아래쪽은 조각을 자르는 곳, 맨 아래는 버튼을 찾는 곳입니다.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function DayRoadmapCard({ day, active, completed, onClick }: { day: Day; active: boolean; completed: boolean; onClick: () => void }) {
  const Icon = day.icon;
  const tone = toneClasses[day.tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-44 rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        active ? "border-slate-950 shadow-md" : "border-slate-200",
      )}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-md", tone.bg, tone.text)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="완료" /> : <span className="text-xs font-black text-slate-400">DAY {day.id}</span>}
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{day.shortTitle}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{day.outcome}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-black text-slate-700">
        자세히 보기
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </button>
  );
}

function ConceptCard({ concept }: { concept: Concept }) {
  const tone = toneClasses[concept.tone];

  return (
    <article className={cn("flex min-h-80 flex-col rounded-lg border p-4", tone.border, tone.bg)}>
      <div className="min-h-40 rounded-md border border-white/80 bg-white p-3 shadow-sm">
        <ConceptDrawing title={concept.title} tone={concept.tone} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{concept.title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{concept.easy}</p>
      <p className={cn("mt-auto pt-3 text-xs font-black leading-5", tone.text)}>{concept.caption}</p>
    </article>
  );
}

function ConceptDrawing({ title, tone }: { title: string; tone: Concept["tone"] }) {
  if (title === "타임라인") return <TimelineDrawing />;
  if (title === "클립") return <ClipDrawing />;
  if (title === "자막") return <CaptionDrawing />;
  if (title === "오버레이") return <OverlayDrawing />;
  return <KeyframeDrawing tone={tone} />;
}

function TimelineDrawing() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-blue-500" />
        <div className="h-7 flex-1 rounded-md bg-blue-100" />
        <div className="h-7 w-12 rounded-md bg-blue-200" />
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-amber-500" />
        <div className="ml-8 h-6 w-28 rounded-md bg-amber-100" />
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-emerald-500" />
        <div className="h-5 flex-1 rounded-md bg-emerald-100" />
      </div>
      <div className="relative -mt-20 ml-20 h-20 w-0.5 bg-slate-900">
        <span className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-900" />
      </div>
    </div>
  );
}

function ClipDrawing() {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-black text-slate-500">자르기 전</p>
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-1">
          <div className="h-9 rounded-md bg-rose-100" />
          <div className="h-9 rounded-md bg-emerald-200" />
          <div className="h-9 rounded-md bg-rose-100" />
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-black text-slate-500">자르기 후</p>
        <div className="h-9 rounded-md bg-emerald-300" />
      </div>
    </div>
  );
}

function CaptionDrawing() {
  return (
    <div className="flex h-32 flex-col justify-between rounded-md bg-slate-900 p-3">
      <div className="flex justify-end">
        <div className="h-5 w-12 rounded-md bg-white/20" />
      </div>
      <div className="rounded-md bg-white px-3 py-2 text-center text-sm font-black text-slate-950">중요한 말은 짧게</div>
    </div>
  );
}

function OverlayDrawing() {
  return (
    <div className="relative h-32">
      <div className="absolute left-2 top-5 h-20 w-32 rounded-md bg-blue-100 ring-2 ring-blue-200" />
      <div className="absolute left-10 top-10 h-20 w-32 rounded-md bg-rose-100 ring-2 ring-rose-200" />
      <div className="absolute right-4 top-3 rounded-md bg-white px-2 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-200">로고</div>
    </div>
  );
}

function KeyframeDrawing({ tone }: { tone: Concept["tone"] }) {
  const color = toneClasses[tone];

  return (
    <div className="flex h-32 items-center">
      <div className="relative h-20 flex-1">
        <div className="absolute left-4 top-10 h-1 w-[calc(100%-2rem)] rounded-full bg-slate-200" />
        <div className={cn("absolute left-4 top-7 h-7 w-7 rotate-45 rounded-sm", color.solid)} />
        <div className={cn("absolute right-4 top-3 h-12 w-12 rotate-45 rounded-sm", color.soft, color.border, "border-2")} />
        <div className="absolute left-12 top-4 h-10 w-24 rounded-[50%] border-t-2 border-dashed border-slate-400" />
        <p className="absolute bottom-0 left-1 text-xs font-black text-slate-500">시작</p>
        <p className="absolute bottom-0 right-1 text-xs font-black text-slate-500">끝</p>
      </div>
    </div>
  );
}

function DayDetail({
  day,
  checkedItems,
  quizAnswers,
  completed,
  onToggleComplete,
  onToggleCheck,
  onAnswer,
}: {
  day: Day;
  checkedItems: Record<string, boolean>;
  quizAnswers: Record<string, string>;
  completed: boolean;
  onToggleComplete: () => void;
  onToggleCheck: (key: string) => void;
  onAnswer: (key: string, answer: string) => void;
}) {
  const Icon = day.icon;
  const tone = toneClasses[day.tone];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className={cn("inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md", tone.bg, tone.text)}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-500">DAY {day.id}</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{day.title}</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{day.goal}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleComplete}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition",
              completed ? "bg-emerald-600 text-white" : "bg-slate-950 text-white hover:bg-slate-800",
            )}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {completed ? "완료됨" : "학습 완료 체크"}
          </button>
        </div>
      </div>

      <StudentQuickStartCard day={day} />

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SkillCard day={day} />
        <ButtonExampleCard examples={day.buttonExamples} />
      </div>

      <MissionCard mission={day.mission} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Checklist day={day} checkedItems={checkedItems} onToggleCheck={onToggleCheck} />
        <MistakeCard mistakes={day.mistakes} />
      </div>

      <QuizCard day={day} quizAnswers={quizAnswers} onAnswer={onAnswer} />
    </div>
  );
}

function SectionTitle({ icon: Icon, label, title }: { icon: LucideIcon; label: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-md bg-slate-100 p-2 text-slate-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-black uppercase text-slate-500">{label}</p>
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
      </div>
    </div>
  );
}

function StudentQuickStartCard({ day }: { day: Day }) {
  const items = [
    { label: "1. 오늘 만들 것", value: day.outcome },
    { label: "2. 먼저 누를 버튼", value: day.buttonExamples[0]?.label || day.skills[0] },
    { label: "3. 끝나면 확인", value: day.checklist[day.checklist.length - 1] },
  ];

  return (
    <article className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-md bg-white p-2 text-blue-700 ring-1 ring-blue-200">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-blue-700">Start Here</p>
          <h3 className="text-xl font-black text-slate-950">오늘은 이것만 하면 됩니다</h3>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-blue-100 bg-white p-4">
            <p className="text-xs font-black text-blue-700">{item.label}</p>
            <p className="mt-2 text-base font-black leading-6 text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SkillCard({ day }: { day: Day }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={BookOpenCheck} label="Learn" title="오늘 배우는 기능" />
      <div className="flex flex-wrap gap-2">
        {day.skills.map((skill) => (
          <span key={skill} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-black text-blue-800">예상 결과물</p>
        <p className="mt-1 text-lg font-black text-slate-950">{day.outcome}</p>
      </div>
    </article>
  );
}

function ButtonExampleCard({ examples }: { examples: ButtonExample[] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={Search} label="Tap Here" title="오늘 꼭 누를 버튼" />
      <div className="grid gap-3 sm:grid-cols-2">
        {examples.map((example) => {
          const tone = toneClasses[example.tone];
          return (
            <div key={example.label} className={cn("rounded-lg border p-4", tone.border, tone.bg)}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("inline-flex min-h-10 items-center rounded-md px-4 py-2 text-sm font-black text-white shadow-sm", tone.solid)}>
                  {example.label}
                </span>
                <span className="text-xs font-black text-slate-500">누르는 곳</span>
              </div>
              <ButtonPressVisual example={example} />
              <p className="mt-3 text-sm font-bold leading-6 text-slate-800">{example.press}</p>
              <p className={cn("mt-2 text-xs font-black", tone.text)}>{example.result}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ButtonPressVisual({ example }: { example: ButtonExample }) {
  const tone = toneClasses[example.tone];
  const menuButtons = ["텍스트", "오디오", "오버레이", "속도"];
  const activeIndex = Math.abs(example.label.length) % menuButtons.length;

  return (
    <div className="mt-4 rounded-lg border border-white/80 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black text-slate-500">캡컷 화면 예시</span>
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-black", tone.bg, tone.text)}>여기를 누름</span>
      </div>
      <div className="rounded-md bg-slate-950 p-3">
        <div className="mx-auto flex aspect-[9/12] max-h-36 w-24 flex-col justify-between rounded-md bg-slate-800 p-2">
          <div className="h-4 rounded bg-white/10" />
          <div className="rounded bg-white px-2 py-1 text-center text-[10px] font-black text-slate-950">영상</div>
          <div className="h-3 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {menuButtons.map((button, index) => (
          <span
            key={button}
            className={cn(
              "rounded-md px-1.5 py-2 text-center text-[11px] font-black",
              index === activeIndex ? `${tone.solid} text-white` : "bg-slate-100 text-slate-600",
            )}
          >
            {index === activeIndex ? example.label : button}
          </span>
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={PlusCircle} label="Mission" title={mission.title} />
      <div className="grid gap-4 md:grid-cols-2">
        <MiniList title="준비물" items={mission.materials} />
        <MiniList title="완성 기준" items={mission.done} />
      </div>
      <div className="mt-5">
        <h4 className="text-sm font-black text-slate-800">따라 하기 순서</h4>
        <ol className="mt-3 space-y-2">
          {mission.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-black text-white">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-5">
        <MiniList title="제출 전 체크" items={mission.submit} />
      </div>
    </article>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-black text-slate-800">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Checklist({ day, checkedItems, onToggleCheck }: { day: Day; checkedItems: Record<string, boolean>; onToggleCheck: (key: string) => void }) {
  const doneCount = day.checklist.filter((_, index) => checkedItems[`${day.id}-${index}`]).length;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={ClipboardCheck} label="Worksheet" title="학생용 실습지" />
      <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs font-black text-slate-500">이름</p>
            <div className="mt-3 h-6 border-b border-dashed border-slate-300" />
          </div>
          <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs font-black text-slate-500">날짜</p>
            <div className="mt-3 h-6 border-b border-dashed border-slate-300" />
          </div>
          <div className="rounded-md bg-emerald-50 p-3 text-emerald-900 ring-1 ring-emerald-200">
            <p className="text-xs font-black">완료</p>
            <p className="mt-1 text-xl font-black">{doneCount}/{day.checklist.length}</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-600">체크할 때마다 자동으로 저장됩니다. 새로고침해도 남아 있어 학생 실습지처럼 사용할 수 있습니다.</p>
      </div>
      <div className="space-y-2">
        {day.checklist.map((item, index) => {
          const key = `${day.id}-${index}`;
          const checked = Boolean(checkedItems[key]);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggleCheck(key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border p-3 text-left transition",
                checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-white",
              )}
              aria-pressed={checked}
            >
              <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white")}>
                {checked ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
              </span>
              <span className={cn("text-sm font-bold leading-6", checked ? "text-emerald-900" : "text-slate-700")}>{item}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-900">오늘 내가 헷갈린 버튼</p>
        <div className="mt-3 space-y-3">
          <div className="h-8 rounded-md border border-dashed border-slate-300 bg-white" />
          <div className="h-8 rounded-md border border-dashed border-slate-300 bg-white" />
        </div>
      </div>
    </article>
  );
}

function MistakeCard({ mistakes }: { mistakes: string[] }) {
  return (
    <article className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <SectionTitle icon={AlertTriangle} label="Common Mistakes" title="초보자가 자주 하는 실수" />
      <ul className="space-y-3">
        {mistakes.map((mistake) => (
          <li key={mistake} className="flex gap-3 rounded-md bg-white p-3 text-sm font-bold leading-6 text-rose-950 ring-1 ring-rose-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            {mistake}
          </li>
        ))}
      </ul>
    </article>
  );
}

function QuizCard({ day, quizAnswers, onAnswer }: { day: Day; quizAnswers: Record<string, string>; onAnswer: (key: string, answer: string) => void }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionTitle icon={PenLine} label="Mini Quiz" title="마지막 3문항 확인 퀴즈" />
      <div className="grid gap-4 lg:grid-cols-3">
        {day.quiz.map((quiz, index) => {
          const key = `${day.id}-quiz-${index}`;
          const selected = quizAnswers[key];
          const correct = selected === quiz.answer;

          return (
            <div key={quiz.question} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Q{index + 1}. {quiz.question}</p>
              <div className="mt-3 space-y-2">
                {quiz.options.map((option) => {
                  const isSelected = selected === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAnswer(key, option)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm font-bold transition",
                        isSelected && correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "",
                        isSelected && !correct ? "border-rose-300 bg-rose-50 text-rose-900" : "",
                        !isSelected ? "border-slate-200 bg-white text-slate-700 hover:border-blue-300" : "",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {selected ? (
                <div className={cn("mt-3 rounded-md p-3 text-sm font-bold leading-6", correct ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900")}>
                  {correct ? "정답입니다. " : "다시 생각해보세요. "}
                  {quiz.explanation}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function GlossaryBox() {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <SectionTitle icon={Search} label="Glossary" title="초보자용 쉬운 용어" />
      <div className="space-y-3">
        {glossary.map((item) => (
          <div key={item.term} className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-black text-slate-950">{item.term}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{item.meaning}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function FinalProjectGuide() {
  const items = ["영상 주제", "첫 3초 문구", "사용할 장면", "자막 스타일", "음악 분위기", "효과음 위치", "내보내기 설정", "최종 평가 리스트"];

  return (
    <article className="rounded-lg border border-violet-200 bg-violet-50 p-5">
      <SectionTitle icon={ClipboardCheck} label="Final Project" title="Day 5 최종 프로젝트 기획표" />
      <p className="text-sm font-bold leading-6 text-violet-950">
        마지막 영상을 만들기 전에 이 8칸만 채우면 무엇을 넣을지 쉽게 정리할 수 있습니다.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={item} className="rounded-md border border-violet-200 bg-white p-4">
            <p className="text-xs font-black text-violet-700">STEP {index + 1}</p>
            <p className="mt-1 text-base font-black text-slate-950">{item}</p>
            <div className="mt-3 h-8 rounded-md border border-dashed border-violet-200 bg-violet-50" />
          </div>
        ))}
      </div>
    </article>
  );
}

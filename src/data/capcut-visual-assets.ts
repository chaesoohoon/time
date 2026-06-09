import type { LessonKey } from "./capcut-screen-lessons";

export type VisualAssetType =
  | "ai"
  | "before-after"
  | "comparison"
  | "flow"
  | "formula"
  | "layer"
  | "practice"
  | "screen"
  | "timeline";

export type VisualAsset = {
  id: string;
  title: string;
  type: VisualAssetType;
  day?: 1 | 2 | 3 | 4 | 5;
  lessonKeys?: LessonKey[];
  src: string;
  beforeSrc?: string;
  afterSrc?: string;
  fallback: "css-wireframe";
  description: string;
  relatedSkill: string;
  recommendedRatio: "16:9" | "9:16";
  expectedResultDescription?: string;
  studentQuestion?: string;
};

export type PracticeVisualAsset = {
  title: string;
  previewImage: string;
  beforeImage: string;
  afterImage: string;
  expectedResultDescription: string;
};

export const capcutVisualAssets: VisualAsset[] = [
  {
    id: "capcut-main-screen",
    title: "캡컷 PC 화면 5대 영역 안내",
    type: "screen",
    lessonKeys: ["map", "day-1"],
    day: 1,
    src: "/assets/capcut/screenshots/capcut-main-screen.png",
    fallback: "css-wireframe",
    description: "캡컷 PC 화면을 5개 영역으로 단순화해 처음 보는 학생도 구조를 잡게 합니다.",
    relatedSkill: "화면 구조 이해",
    recommendedRatio: "16:9",
    studentQuestion: "자료를 가져오는 곳과 실제로 편집하는 곳은 각각 어디인가요?",
  },
  {
    id: "import-to-timeline-flow",
    title: "가져오기에서 타임라인까지",
    type: "flow",
    lessonKeys: ["start", "day-1"],
    day: 1,
    src: "/assets/capcut/visuals/import-to-timeline-flow.png",
    fallback: "css-wireframe",
    description: "가져오기, 미디어 보관함, 타임라인 드래그를 3단계 화살표로 보여줍니다.",
    relatedSkill: "가져오기",
    recommendedRatio: "16:9",
    studentQuestion: "파일을 가져온 뒤 바로 편집되나요, 아니면 어디에 올려야 하나요?",
  },
  {
    id: "cut-edit-before-after",
    title: "실수 장면 삭제 전/후",
    type: "before-after",
    lessonKeys: ["day-1"],
    day: 1,
    src: "/assets/capcut/before-after/cut-edit-before-after.png",
    beforeSrc: "/assets/capcut/before-after/cut-edit-before.png",
    afterSrc: "/assets/capcut/before-after/cut-edit-after.png",
    fallback: "css-wireframe",
    description: "불필요한 장면을 분할하고 삭제하면 타임라인이 어떻게 짧아지는지 보여줍니다.",
    relatedSkill: "분할 / 삭제",
    recommendedRatio: "16:9",
    expectedResultDescription: "실수 장면과 불필요한 끝부분을 삭제해 필요한 장면만 남긴 타임라인을 만듭니다.",
    studentQuestion: "편집 후 영상이 짧아졌는데 내용은 더 명확해졌나요?",
  },
  {
    id: "day1-self-intro-preview",
    title: "10초 자기소개 영상 결과 미리보기",
    type: "practice",
    lessonKeys: ["day-1"],
    day: 1,
    src: "/assets/capcut/practice/day1-self-intro-preview.png",
    fallback: "css-wireframe",
    description: "Day 1 실습 결과물이 어떤 모습이어야 하는지 보여주는 세로 쇼츠 미리보기입니다.",
    relatedSkill: "컷 편집 결과물",
    recommendedRatio: "9:16",
    expectedResultDescription: "실수 장면을 잘라낸 뒤 이름 자막과 마지막 인사 장면이 있는 8~12초 자기소개 영상을 만듭니다.",
  },
  {
    id: "speed-compare",
    title: "1배속 / 2배속 / 4배속 비교",
    type: "comparison",
    lessonKeys: ["day-2"],
    day: 2,
    src: "/assets/capcut/visuals/speed-compare.png",
    fallback: "css-wireframe",
    description: "같은 영상이 배속에 따라 얼마나 짧아지는지 막대로 비교합니다.",
    relatedSkill: "속도 조절",
    recommendedRatio: "16:9",
    studentQuestion: "반복 장면은 왜 2배속이나 4배속으로 줄이면 좋을까요?",
  },
  {
    id: "beat-sync-timeline",
    title: "Beat Sync 타임라인",
    type: "timeline",
    lessonKeys: ["day-2"],
    day: 2,
    src: "/assets/capcut/ai/beat-sync-timeline.png",
    fallback: "css-wireframe",
    description: "오디오 트랙의 비트 마커와 사진 클립 끝점이 맞는 구조를 보여줍니다.",
    relatedSkill: "Beat Sync / 자동 마커",
    recommendedRatio: "16:9",
    studentQuestion: "모든 비트에 컷을 맞추는 것과 강한 비트만 맞추는 것 중 어느 쪽이 더 보기 편할까요?",
  },
  {
    id: "transition-good-bad",
    title: "전환 효과 과한 예 / 적당한 예",
    type: "before-after",
    lessonKeys: ["day-2"],
    day: 2,
    src: "/assets/capcut/before-after/transition-good-bad.png",
    beforeSrc: "/assets/capcut/before-after/transition-too-much.png",
    afterSrc: "/assets/capcut/before-after/transition-balanced.png",
    fallback: "css-wireframe",
    description: "전환을 많이 넣은 산만한 타임라인과 필요한 곳에만 넣은 타임라인을 비교합니다.",
    relatedSkill: "전환 효과",
    recommendedRatio: "16:9",
    expectedResultDescription: "전환은 모든 컷에 넣지 않고 장면 변화가 필요한 곳에만 사용합니다.",
  },
  {
    id: "day2-process-shortform-preview",
    title: "작업 과정 15초 숏폼 결과 미리보기",
    type: "practice",
    lessonKeys: ["day-2"],
    day: 2,
    src: "/assets/capcut/practice/day2-process-shortform-preview.png",
    fallback: "css-wireframe",
    description: "빠르게 넘길 장면과 천천히 보여줄 장면이 구분된 작업 과정 숏폼 예시입니다.",
    relatedSkill: "속도 / 전환 결과물",
    recommendedRatio: "9:16",
    expectedResultDescription: "반복 장면은 빠르게, 중요한 순간은 천천히 보여주는 15초 작업 과정 숏폼을 만듭니다.",
  },
  {
    id: "caption-good-bad",
    title: "좋은 자막 / 나쁜 자막 비교",
    type: "before-after",
    lessonKeys: ["day-3"],
    day: 3,
    src: "/assets/capcut/before-after/caption-good-bad.png",
    beforeSrc: "/assets/capcut/before-after/caption-bad.png",
    afterSrc: "/assets/capcut/before-after/caption-good.png",
    fallback: "css-wireframe",
    description: "모바일에서 잘 안 읽히는 자막과 읽기 좋은 자막을 나란히 비교합니다.",
    relatedSkill: "자막 가독성",
    recommendedRatio: "16:9",
    expectedResultDescription: "짧고 큰 자막, 외곽선, 핵심 단어 강조로 모바일에서도 읽히는 자막을 만듭니다.",
  },
  {
    id: "audio-volume-balance",
    title: "목소리 / 음악 / 효과음 볼륨",
    type: "comparison",
    lessonKeys: ["day-3"],
    day: 3,
    src: "/assets/capcut/visuals/audio-volume-balance.png",
    fallback: "css-wireframe",
    description: "목소리 100, 배경음악 20, 효과음 60의 안전한 볼륨 기준을 막대로 보여줍니다.",
    relatedSkill: "오디오 볼륨",
    recommendedRatio: "16:9",
    studentQuestion: "배경음악이 목소리보다 크면 시청자는 무엇을 놓치게 될까요?",
  },
  {
    id: "auto-caption-flow",
    title: "자동 자막 생성 흐름",
    type: "flow",
    lessonKeys: ["day-3"],
    day: 3,
    src: "/assets/capcut/visuals/auto-caption-flow.png",
    fallback: "css-wireframe",
    description: "말소리 분석, 자동 자막 생성, 오타 수정, 줄바꿈 정리를 순서로 보여줍니다.",
    relatedSkill: "자동 자막",
    recommendedRatio: "16:9",
    studentQuestion: "자동 자막이 만들어진 뒤 사람이 꼭 확인해야 하는 부분은 무엇인가요?",
  },
  {
    id: "day3-caption-video-preview",
    title: "정보 전달 쇼츠 결과 미리보기",
    type: "practice",
    lessonKeys: ["day-3"],
    day: 3,
    src: "/assets/capcut/practice/day3-caption-video-preview.png",
    fallback: "css-wireframe",
    description: "큰 자막과 조용한 배경음악이 들어간 정보 전달형 쇼츠 예시입니다.",
    relatedSkill: "자막 / 오디오 결과물",
    recommendedRatio: "9:16",
    expectedResultDescription: "자동 자막을 고치고 음악 볼륨을 낮춰 말이 잘 들리는 정보 전달 쇼츠를 만듭니다.",
  },
  {
    id: "overlay-layer-structure",
    title: "오버레이 레이어 구조",
    type: "layer",
    lessonKeys: ["day-4"],
    day: 4,
    src: "/assets/capcut/visuals/overlay-layer-structure.png",
    fallback: "css-wireframe",
    description: "배경 영상, 제품 이미지, 자막/로고가 층처럼 쌓이는 구조를 보여줍니다.",
    relatedSkill: "오버레이",
    recommendedRatio: "16:9",
    studentQuestion: "자막은 배경보다 위 레이어에 있어야 할까요, 아래 레이어에 있어야 할까요?",
  },
  {
    id: "keyframe-zoom",
    title: "키프레임 시작점 / 끝점",
    type: "timeline",
    lessonKeys: ["day-4"],
    day: 4,
    src: "/assets/capcut/visuals/keyframe-zoom.png",
    fallback: "css-wireframe",
    description: "사진 크기 100% 시작점과 130% 끝점 사이에 움직임이 자동으로 생기는 원리입니다.",
    relatedSkill: "키프레임",
    recommendedRatio: "16:9",
    studentQuestion: "시작점과 끝점이 다르면 중간 움직임은 누가 만들어줄까요?",
  },
  {
    id: "smart-cutout-before-after",
    title: "Smart Cutout 전/후",
    type: "before-after",
    lessonKeys: ["day-4"],
    day: 4,
    src: "/assets/capcut/before-after/smart-cutout-before-after.png",
    beforeSrc: "/assets/capcut/before-after/smart-cutout-before.png",
    afterSrc: "/assets/capcut/before-after/smart-cutout-after.png",
    fallback: "css-wireframe",
    description: "복잡한 배경에서 인물만 남기고 새 배경에 합성되는 과정을 비교합니다.",
    relatedSkill: "배경 제거 / Smart Cutout",
    recommendedRatio: "16:9",
    expectedResultDescription: "배경을 제거한 인물이나 제품을 새 배경 위에 자연스럽게 합성합니다.",
  },
  {
    id: "day4-product-cardnews-preview",
    title: "제품 소개 카드뉴스 결과 미리보기",
    type: "practice",
    lessonKeys: ["day-4"],
    day: 4,
    src: "/assets/capcut/practice/day4-product-cardnews-preview.png",
    fallback: "css-wireframe",
    description: "배경, 제품 이미지, 자막, 키프레임이 들어간 카드뉴스형 영상 예시입니다.",
    relatedSkill: "오버레이 / 키프레임 결과물",
    recommendedRatio: "9:16",
    expectedResultDescription: "제품 이미지를 오버레이로 올리고 키프레임으로 움직임을 준 카드뉴스형 영상을 만듭니다.",
  },
  {
    id: "shortform-structure",
    title: "15초 숏폼 구성 공식",
    type: "formula",
    lessonKeys: ["day-5"],
    day: 5,
    src: "/assets/capcut/visuals/shortform-structure.png",
    fallback: "css-wireframe",
    description: "0~3초 후킹, 3~10초 핵심 내용, 10~15초 행동 유도를 타임라인으로 보여줍니다.",
    relatedSkill: "쇼츠 구성",
    recommendedRatio: "16:9",
    studentQuestion: "내 영상의 첫 3초는 시청자가 계속 볼 이유를 보여주나요?",
  },
  {
    id: "ai-first-scene",
    title: "AI 이미지로 첫 장면 만들기",
    type: "ai",
    lessonKeys: ["day-5"],
    day: 5,
    src: "/assets/capcut/ai/ai-image-generation-example.png",
    fallback: "css-wireframe",
    description: "입력 문구 작성, 이미지 생성, 결과 선택, 타임라인 배치 흐름을 보여줍니다.",
    relatedSkill: "AI 이미지 생성",
    recommendedRatio: "16:9",
    expectedResultDescription: "AI 이미지와 큰 제목 자막으로 첫 3초에 시선을 끄는 쇼츠 첫 장면을 만듭니다.",
  },
  {
    id: "ai-video-before-after",
    title: "AI 초안과 직접 편집 완성본 비교",
    type: "before-after",
    lessonKeys: ["day-5"],
    day: 5,
    src: "/assets/capcut/ai/ai-video-workflow.png",
    beforeSrc: "/assets/capcut/before-after/ai-video-draft.png",
    afterSrc: "/assets/capcut/before-after/ai-video-edited.png",
    fallback: "css-wireframe",
    description: "AI가 만든 초안과 사람이 자막, 로고, 컷, 음악을 정리한 완성본을 비교합니다.",
    relatedSkill: "AI 영상 생성 후 편집",
    recommendedRatio: "16:9",
    expectedResultDescription: "AI 초안을 그대로 제출하지 않고 자막, 로고, 음악, 컷 길이를 직접 수정합니다.",
    studentQuestion: "AI가 만든 초안에서 사람이 꼭 고쳐야 하는 부분은 무엇인가요?",
  },
  {
    id: "day5-final-shortform-preview",
    title: "최종 홍보 숏폼 결과 미리보기",
    type: "practice",
    lessonKeys: ["day-5"],
    day: 5,
    src: "/assets/capcut/practice/day5-final-shortform-preview.png",
    fallback: "css-wireframe",
    description: "후킹, 핵심 메시지, 행동 유도까지 갖춘 최종 홍보 숏폼 예시입니다.",
    relatedSkill: "최종 프로젝트",
    recommendedRatio: "9:16",
    expectedResultDescription: "첫 3초 후킹, 핵심 메시지, 행동 유도 문구가 있는 최종 홍보 숏폼을 완성합니다.",
  },
  {
    id: "ai-video-generation-process",
    title: "AI 영상 생성 후 편집 흐름",
    type: "ai",
    lessonKeys: ["day-5"],
    day: 5,
    src: "/assets/capcut/ai/ai-video-generation-process.png",
    fallback: "css-wireframe",
    description: "입력 문구로 만든 AI 영상 초안을 타임라인에서 사람이 고치는 흐름입니다.",
    relatedSkill: "AI 영상 생성",
    recommendedRatio: "16:9",
  },
];

export const visualAssetsByLesson: Record<LessonKey, string[]> = {
  map: ["capcut-main-screen"],
  start: ["import-to-timeline-flow"],
  "day-1": ["capcut-main-screen", "import-to-timeline-flow", "cut-edit-before-after", "day1-self-intro-preview"],
  "day-2": ["speed-compare", "beat-sync-timeline", "transition-good-bad", "day2-process-shortform-preview"],
  "day-3": ["caption-good-bad", "audio-volume-balance", "auto-caption-flow", "day3-caption-video-preview"],
  "day-4": ["overlay-layer-structure", "keyframe-zoom", "smart-cutout-before-after", "day4-product-cardnews-preview"],
  "day-5": ["shortform-structure", "ai-first-scene", "ai-video-before-after", "day5-final-shortform-preview"],
};

export const practiceVisualAssets: Record<string, PracticeVisualAsset> = {
  "10초 자기소개 영상 만들기": {
    title: "10초 자기소개 영상 만들기",
    previewImage: "/assets/capcut/practice/day1-self-intro-preview.png",
    beforeImage: "/assets/capcut/before-after/raw-self-intro.png",
    afterImage: "/assets/capcut/practice/day1-self-intro-preview.png",
    expectedResultDescription: "실수 장면을 잘라내고 이름 자막을 넣어 8~12초 자기소개 영상으로 정리합니다.",
  },
  "작업 과정 15초 숏폼 만들기": {
    title: "작업 과정 15초 숏폼 만들기",
    previewImage: "/assets/capcut/practice/day2-process-shortform-preview.png",
    beforeImage: "/assets/capcut/before-after/process-slow-before.png",
    afterImage: "/assets/capcut/practice/day2-process-shortform-preview.png",
    expectedResultDescription: "반복 장면은 빠르게 줄이고 중요한 순간은 천천히 보여주는 15초 작업 과정 숏폼을 만듭니다.",
  },
  "정보 전달 쇼츠 만들기": {
    title: "정보 전달 쇼츠 만들기",
    previewImage: "/assets/capcut/practice/day3-caption-video-preview.png",
    beforeImage: "/assets/capcut/before-after/caption-bad.png",
    afterImage: "/assets/capcut/practice/day3-caption-video-preview.png",
    expectedResultDescription: "자동 자막을 고치고 볼륨 균형을 맞춰 말이 잘 들리는 정보 전달 쇼츠를 만듭니다.",
  },
  "제품 소개형 움직이는 카드뉴스 영상 만들기": {
    title: "제품 소개형 움직이는 카드뉴스 영상 만들기",
    previewImage: "/assets/capcut/practice/day4-product-cardnews-preview.png",
    beforeImage: "/assets/capcut/before-after/plain-product-photo.png",
    afterImage: "/assets/capcut/practice/day4-product-cardnews-preview.png",
    expectedResultDescription: "제품 이미지와 자막을 레이어로 쌓고 키프레임으로 움직임을 넣어 카드뉴스형 영상을 만듭니다.",
  },
  "배경 제거 합성 영상": {
    title: "배경 제거 합성 영상",
    previewImage: "/assets/capcut/before-after/smart-cutout-before-after.png",
    beforeImage: "/assets/capcut/before-after/smart-cutout-before.png",
    afterImage: "/assets/capcut/before-after/smart-cutout-after.png",
    expectedResultDescription: "배경을 제거한 인물이나 제품을 새 배경 위에 자연스럽게 합성합니다.",
  },
  "템플릿 활용 홍보 영상": {
    title: "템플릿 활용 홍보 영상",
    previewImage: "/assets/capcut/practice/template-promo-preview.png",
    beforeImage: "/assets/capcut/before-after/template-default.png",
    afterImage: "/assets/capcut/practice/template-promo-preview.png",
    expectedResultDescription: "기본 템플릿 문구와 이미지를 모두 바꾸고 로고와 문의 문구가 보이는 홍보 영상으로 완성합니다.",
  },
  "15~30초 홍보 숏폼 완성하기": {
    title: "15~30초 홍보 숏폼 완성하기",
    previewImage: "/assets/capcut/practice/day5-final-shortform-preview.png",
    beforeImage: "/assets/capcut/before-after/unplanned-promo-before.png",
    afterImage: "/assets/capcut/practice/day5-final-shortform-preview.png",
    expectedResultDescription: "첫 3초 후킹, 핵심 메시지, 마지막 행동 유도까지 갖춘 최종 홍보 숏폼을 만듭니다.",
  },
  "음악 비트에 맞춘 15초 사진 슬라이드 쇼츠": {
    title: "음악 비트에 맞춘 15초 사진 슬라이드 쇼츠",
    previewImage: "/assets/capcut/ai/beat-sync-timeline.png",
    beforeImage: "/assets/capcut/before-after/no-beat-sync-before.png",
    afterImage: "/assets/capcut/ai/beat-sync-timeline.png",
    expectedResultDescription: "자동 비트 마커를 기준으로 사진 길이를 맞춰 리듬감 있는 15초 쇼츠를 만듭니다.",
  },
  "AI 이미지로 쇼츠 첫 장면 만들기": {
    title: "AI 이미지로 쇼츠 첫 장면 만들기",
    previewImage: "/assets/capcut/practice/ai-image-thumbnail-preview.png",
    beforeImage: "/assets/capcut/before-after/plain-first-scene.png",
    afterImage: "/assets/capcut/before-after/ai-thumbnail-first-scene.png",
    expectedResultDescription: "AI 이미지와 큰 제목 자막을 활용해 첫 3초에 시선을 끄는 쇼츠 첫 장면을 만듭니다.",
  },
  "AI 영상 생성 후 직접 편집하기": {
    title: "AI 영상 생성 후 직접 편집하기",
    previewImage: "/assets/capcut/ai/ai-video-workflow.png",
    beforeImage: "/assets/capcut/before-after/ai-video-draft.png",
    afterImage: "/assets/capcut/before-after/ai-video-edited.png",
    expectedResultDescription: "AI 영상 초안을 그대로 쓰지 않고 자막, 음악, 컷, 로고를 직접 수정해 완성도를 높입니다.",
  },
  "이미지에서 영상 만들기": {
    title: "이미지에서 영상 만들기",
    previewImage: "/assets/capcut/practice/image-to-video-preview.png",
    beforeImage: "/assets/capcut/before-after/static-photo-before.png",
    afterImage: "/assets/capcut/practice/image-to-video-preview.png",
    expectedResultDescription: "정적인 사진을 움직이는 영상처럼 만들고 자막과 음악을 더해 홍보용 숏폼으로 완성합니다.",
  },
};

export function getVisualAsset(id: string) {
  return capcutVisualAssets.find((asset) => asset.id === id) ?? null;
}

export function getVisualAssetsForLesson(key: LessonKey) {
  return visualAssetsByLesson[key].map(getVisualAsset).filter(Boolean) as VisualAsset[];
}

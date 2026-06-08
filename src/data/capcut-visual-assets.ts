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
  imagePrompt: string;
  relatedSkill: string;
  usageLocation: string;
  recommendedRatio: "16:9" | "9:16";
  saveFileName: string;
  expectedResultDescription?: string;
  studentQuestion?: string;
};

export type PracticeVisualAsset = {
  title: string;
  previewImage: string;
  beforeImage: string;
  afterImage: string;
  visualPrompt: string;
  expectedResultDescription: string;
};

const commonStyle =
  "초보자 영상 편집 수업용 교육 이미지, 캡컷 PC 화면을 연상시키는 다크 UI, 청록색 포인트 컬러, 한국어 라벨, 깔끔한 인포그래픽, 고해상도, 16:9 비율, 글자는 크고 읽기 쉽게, 복잡하지 않은 구성.";

const prompt = (content: string) => `${content} ${commonStyle}`;

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
    imagePrompt: prompt(
      "캡컷 PC 영상 편집 프로그램 화면을 초보자 교육용으로 단순화한 다크 UI 일러스트. 왼쪽 미디어 가져오기 영역, 가운데 미리보기 화면, 오른쪽 세부 정보 패널, 아래 긴 타임라인, 위쪽 메뉴 바가 명확히 보이는 구조. 각 영역에 ① ② ③ ④ ⑤ 번호 표시. 실제 로고나 상표 텍스트는 사용하지 않고, 교육용 UI 다이어그램 스타일.",
    ),
    relatedSkill: "화면 구조 이해",
    usageLocation: "첫 화면 이해하기, Day 1",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/screenshots/capcut-main-screen.png",
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
    imagePrompt: prompt(
      "영상 편집 초보자를 위한 캡컷 시작 3단계 설명 이미지. 1단계 파일 가져오기 버튼, 2단계 미디어 보관함에 영상 파일이 들어온 모습, 3단계 영상을 아래 타임라인으로 드래그하는 모습. 다크 UI 기반의 교육용 벡터 일러스트, 청록색 화살표, 번호 라벨 1 2 3, 한눈에 이해되는 깔끔한 구성.",
    ),
    relatedSkill: "가져오기",
    usageLocation: "처음 시작 3단계, Day 1",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/import-to-timeline-flow.png",
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
    imagePrompt: prompt(
      "영상 타임라인 컷 편집 전후 비교 이미지. 위쪽에는 편집 전 타임라인: 필요한 장면, 실수 장면, 필요한 장면, 불필요한 끝부분이 색상 블록으로 표시됨. 아래쪽에는 편집 후 타임라인: 필요한 장면 두 개만 남아 있음. 가위 아이콘, 삭제 아이콘, 텍스트는 한국어로 짧고 읽기 쉽게.",
    ),
    relatedSkill: "분할 / 삭제",
    usageLocation: "Day 1 컷 편집",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/before-after/cut-edit-before-after.png",
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
    imagePrompt: prompt(
      "영상 편집 초보자의 10초 자기소개 숏폼 완성 예시 이미지. 세로 영상 미리보기 안에 밝은 인물 장면, 큰 이름 자막, 짧은 소개 문구, 마지막 인사 장면이 보임. 수업 결과물 미리보기 카드 스타일.",
    ),
    relatedSkill: "컷 편집 결과물",
    usageLocation: "Day 1 실습 예제",
    recommendedRatio: "9:16",
    saveFileName: "public/assets/capcut/practice/day1-self-intro-preview.png",
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
    imagePrompt: prompt(
      "영상 편집 속도 조절 비교 교육 이미지. 1배속은 긴 막대 10초, 2배속은 절반 길이 5초, 4배속은 짧은 막대 2.5초로 표현. 캡컷 스타일의 다크 타임라인 UI, 초보자가 빠르게 이해할 수 있는 인포그래픽, 한국어 라벨.",
    ),
    relatedSkill: "속도 조절",
    usageLocation: "Day 2 속도 조절",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/speed-compare.png",
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
    imagePrompt: prompt(
      "음악 비트에 맞춘 영상 편집 타임라인 설명 이미지. 아래에는 오디오 트랙 파형이 있고 강한 박자마다 청록색 마커가 표시됨. 위에는 사진 클립들이 비트 마커에 맞춰 정확히 배치됨. Beat Sync 또는 자동 비트 마커 개념을 설명하는 교육용 다이어그램, 한국어 라벨.",
    ),
    relatedSkill: "Beat Sync / 자동 마커",
    usageLocation: "Day 2, 음악 비트 자동 편집 섹션",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/ai/beat-sync-timeline.png",
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
    imagePrompt: prompt(
      "영상 전환 효과를 과하게 쓴 예와 적당히 쓴 예를 비교하는 교육 이미지. 왼쪽은 모든 컷 사이에 화려한 전환 아이콘이 너무 많아 산만함. 오른쪽은 중요한 장면 전환 2~3개에만 심플한 전환이 들어가 정돈된 모습. 한국어 라벨 '과한 전환' '적당한 전환'.",
    ),
    relatedSkill: "전환 효과",
    usageLocation: "Day 2 전환 효과",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/before-after/transition-good-bad.png",
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
    imagePrompt: prompt(
      "요리 또는 작업 과정 15초 숏폼 완성 예시 이미지. 빠른 컷, 중요한 순간 슬로우, 짧은 자막, 리듬감 있는 음악 표시가 포함된 세로 영상 미리보기 카드.",
    ),
    relatedSkill: "속도 / 전환 결과물",
    usageLocation: "Day 2 실습 예제",
    recommendedRatio: "9:16",
    saveFileName: "public/assets/capcut/practice/day2-process-shortform-preview.png",
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
    imagePrompt: prompt(
      "숏폼 영상 자막 좋은 예와 나쁜 예를 비교하는 교육 이미지. 왼쪽은 나쁜 자막: 글자가 작고 문장이 너무 길고 배경과 잘 구분되지 않음. 오른쪽은 좋은 자막: 큰 흰색 글자, 검정 외곽선, 핵심 단어 노란색 강조, 2줄 이하, 화면 하단 배치. 세로 영상 미리보기 두 개를 나란히 배치, 한국어 라벨.",
    ),
    relatedSkill: "자막 가독성",
    usageLocation: "Day 3 자막 수업",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/before-after/caption-good-bad.png",
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
    imagePrompt: prompt(
      "영상 편집 오디오 볼륨 밸런스 교육 이미지. 목소리 100, 배경음악 20, 효과음 60을 막대 그래프로 표현. 목소리는 가장 크고, 배경음악은 작게, 효과음은 중간 정도로 표시. 다크 UI 기반 인포그래픽, 한국어 라벨.",
    ),
    relatedSkill: "오디오 볼륨",
    usageLocation: "Day 3 오디오 수업",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/audio-volume-balance.png",
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
    imagePrompt: prompt(
      "자동 자막 생성 흐름 교육 이미지. 1 말소리 분석, 2 자동 자막 생성, 3 오타 수정, 4 줄바꿈 정리, 5 모바일 화면에서 확인 순서로 표현. 캡컷 텍스트 메뉴를 연상시키는 다크 UI, 한국어 라벨, 청록색 화살표.",
    ),
    relatedSkill: "자동 자막",
    usageLocation: "Day 3 자막 수업",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/auto-caption-flow.png",
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
    imagePrompt: prompt(
      "정보 전달형 숏폼 완성 예시 이미지. 세로 영상 미리보기 안에 말하는 사람, 큰 핵심 자막, 강조 단어, 작게 깔린 배경음악 아이콘, 깔끔한 강의자료 스타일.",
    ),
    relatedSkill: "자막 / 오디오 결과물",
    usageLocation: "Day 3 실습 예제",
    recommendedRatio: "9:16",
    saveFileName: "public/assets/capcut/practice/day3-caption-video-preview.png",
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
    imagePrompt: prompt(
      "영상 편집 오버레이 레이어 구조 설명 이미지. 가장 아래에는 배경 영상 레이어, 중간에는 제품 이미지 레이어, 위에는 자막, 로고, 스티커 레이어가 쌓여 있는 3D 레이어 다이어그램. 캡컷 편집 개념을 초보자에게 설명하는 교육용 이미지, 한국어 라벨.",
    ),
    relatedSkill: "오버레이",
    usageLocation: "Day 4 오버레이",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/overlay-layer-structure.png",
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
    imagePrompt: prompt(
      "키프레임으로 사진을 천천히 확대하는 개념 설명 이미지. 왼쪽에는 시작점: 사진 크기 100%, 오른쪽에는 끝점: 사진 크기 130%, 가운데에는 자동 움직임을 나타내는 화살표. 타임라인 위에 시작 키프레임과 끝 키프레임 점 표시. 한국어 라벨, 다크 UI.",
    ),
    relatedSkill: "키프레임",
    usageLocation: "Day 4 키프레임",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/keyframe-zoom.png",
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
    imagePrompt: prompt(
      "AI 배경 제거 전후 비교 교육 이미지. 왼쪽에는 복잡한 배경 앞에 서 있는 인물 실루엣, 오른쪽에는 배경이 제거되고 깔끔한 컬러 배경 위에 인물만 남은 모습. Smart Cutout 개념 설명, 초보자용 전후 비교, 한국어 라벨 ‘전’ ‘후’.",
    ),
    relatedSkill: "배경 제거 / Smart Cutout",
    usageLocation: "Day 4 배경 제거",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/before-after/smart-cutout-before-after.png",
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
    imagePrompt: prompt(
      "제품 소개 카드뉴스형 숏폼 완성 예시 이미지. 세로 영상 미리보기 안에 제품 이미지, 큰 제목 자막, 로고, 스티커, 살짝 확대되는 키프레임 표시가 포함됨. 깔끔한 광고형 디자인.",
    ),
    relatedSkill: "오버레이 / 키프레임 결과물",
    usageLocation: "Day 4 실습 예제",
    recommendedRatio: "9:16",
    saveFileName: "public/assets/capcut/practice/day4-product-cardnews-preview.png",
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
    imagePrompt: prompt(
      "15초 숏폼 영상 구성 공식 인포그래픽. 가로 타임라인을 0~3초 후킹, 3~10초 핵심 내용, 10~15초 행동 유도로 나누어 보여줌. 각 구간에 아이콘과 예시 문구 포함. 초보자 영상 편집 수업용, 한국어, 깔끔한 카드형 디자인.",
    ),
    relatedSkill: "쇼츠 구성",
    usageLocation: "Day 5 최종 프로젝트",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/visuals/shortform-structure.png",
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
    description: "프롬프트 입력, 이미지 생성, 결과 선택, 타임라인 배치 흐름을 보여줍니다.",
    imagePrompt: prompt(
      "AI 이미지 생성 과정을 설명하는 교육용 인포그래픽. 1 프롬프트 입력, 2 AI 이미지 생성, 3 결과 이미지 선택, 4 캡컷 타임라인에 넣기 순서로 표현. 영상 편집 수업용, 다크 UI와 밝은 카드 조합, 한국어 라벨, 청록색 화살표.",
    ),
    relatedSkill: "AI 이미지 생성",
    usageLocation: "AI 이미지 생성 섹션, Day 5",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/ai/ai-image-generation-example.png",
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
    imagePrompt: prompt(
      "AI 영상 생성 초안과 사람이 직접 편집한 완성본을 비교하는 교육 이미지. 왼쪽은 AI 초안: 자막이 길고 장면이 어색한 상태. 오른쪽은 수정 후 완성본: 자막이 짧고 로고가 추가되고 컷이 정리된 상태. 영상 편집 수업용 전후 비교 이미지, 한국어 라벨.",
    ),
    relatedSkill: "AI 영상 생성 후 편집",
    usageLocation: "AI 영상 생성 실습, Day 5",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/ai/ai-video-workflow.png",
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
    imagePrompt: prompt(
      "15~30초 홍보 숏폼 완성 예시 이미지. 세로 영상 미리보기 안에 첫 3초 후킹 문구, 핵심 메시지 3개, 브랜드 로고, 마지막 행동 유도 문구가 보임. 깔끔하고 전문적인 교육 홍보 스타일.",
    ),
    relatedSkill: "최종 프로젝트",
    usageLocation: "Day 5 실습 예제",
    recommendedRatio: "9:16",
    saveFileName: "public/assets/capcut/practice/day5-final-shortform-preview.png",
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
    description: "프롬프트로 만든 AI 영상 초안을 타임라인에서 사람이 고치는 흐름입니다.",
    imagePrompt: prompt(
      "AI 영상 생성 후 편집 흐름을 설명하는 교육용 인포그래픽. 1 주제 프롬프트 입력, 2 AI 영상 초안 생성, 3 어색한 컷 삭제, 4 자막 수정, 5 로고와 행동 유도 문구 추가, 6 내보내기 순서. 캡컷 PC 다크 UI 스타일, 한국어 라벨.",
    ),
    relatedSkill: "AI 영상 생성",
    usageLocation: "AI 영상 생성 상세 페이지",
    recommendedRatio: "16:9",
    saveFileName: "public/assets/capcut/ai/ai-video-generation-process.png",
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
    visualPrompt: prompt("10초 자기소개 숏폼 전후 비교 이미지. 왼쪽은 긴 원본 영상과 실수 장면, 오른쪽은 이름 자막과 마지막 인사가 들어간 짧고 깔끔한 완성본."),
    expectedResultDescription: "실수 장면을 잘라내고 이름 자막을 넣어 8~12초 자기소개 영상으로 정리합니다.",
  },
  "작업 과정 15초 숏폼 만들기": {
    title: "작업 과정 15초 숏폼 만들기",
    previewImage: "/assets/capcut/practice/day2-process-shortform-preview.png",
    beforeImage: "/assets/capcut/before-after/process-slow-before.png",
    afterImage: "/assets/capcut/practice/day2-process-shortform-preview.png",
    visualPrompt: prompt("작업 과정 숏폼 전후 비교 이미지. 왼쪽은 반복 장면이 길어 지루한 원본, 오른쪽은 2배속과 4배속, 중요한 장면 슬로우, 짧은 전환이 적용된 15초 완성본."),
    expectedResultDescription: "반복 장면은 빠르게 줄이고 중요한 순간은 천천히 보여주는 15초 작업 과정 숏폼을 만듭니다.",
  },
  "정보 전달 쇼츠 만들기": {
    title: "정보 전달 쇼츠 만들기",
    previewImage: "/assets/capcut/practice/day3-caption-video-preview.png",
    beforeImage: "/assets/capcut/before-after/caption-bad.png",
    afterImage: "/assets/capcut/practice/day3-caption-video-preview.png",
    visualPrompt: prompt("정보 전달 쇼츠 전후 비교 이미지. 왼쪽은 자막이 길고 음악이 커서 읽고 듣기 어려운 영상, 오른쪽은 큰 자막, 강조 단어, 낮은 배경음악으로 정리된 완성본."),
    expectedResultDescription: "자동 자막을 고치고 볼륨 균형을 맞춰 말이 잘 들리는 정보 전달 쇼츠를 만듭니다.",
  },
  "제품 소개형 움직이는 카드뉴스 영상 만들기": {
    title: "제품 소개형 움직이는 카드뉴스 영상 만들기",
    previewImage: "/assets/capcut/practice/day4-product-cardnews-preview.png",
    beforeImage: "/assets/capcut/before-after/plain-product-photo.png",
    afterImage: "/assets/capcut/practice/day4-product-cardnews-preview.png",
    visualPrompt: prompt("제품 사진을 카드뉴스형 영상으로 바꾸는 전후 비교 이미지. 왼쪽은 정적인 제품 사진, 오른쪽은 배경, 제품 오버레이, 큰 제목 자막, 로고, 키프레임 움직임이 들어간 완성본."),
    expectedResultDescription: "제품 이미지와 자막을 레이어로 쌓고 키프레임으로 움직임을 넣어 카드뉴스형 영상을 만듭니다.",
  },
  "배경 제거 합성 영상": {
    title: "배경 제거 합성 영상",
    previewImage: "/assets/capcut/before-after/smart-cutout-before-after.png",
    beforeImage: "/assets/capcut/before-after/smart-cutout-before.png",
    afterImage: "/assets/capcut/before-after/smart-cutout-after.png",
    visualPrompt: prompt("AI 배경 제거 합성 영상 전후 비교 이미지. 왼쪽은 복잡한 배경의 인물 또는 제품, 오른쪽은 배경 제거 후 새 배경 위에 자연스럽게 합성된 모습."),
    expectedResultDescription: "배경을 제거한 인물이나 제품을 새 배경 위에 자연스럽게 합성합니다.",
  },
  "템플릿 활용 홍보 영상": {
    title: "템플릿 활용 홍보 영상",
    previewImage: "/assets/capcut/practice/template-promo-preview.png",
    beforeImage: "/assets/capcut/before-after/template-default.png",
    afterImage: "/assets/capcut/practice/template-promo-preview.png",
    visualPrompt: prompt("템플릿 활용 홍보 영상 전후 비교 이미지. 왼쪽은 기본 템플릿 문구와 임시 이미지가 남아 있는 상태, 오른쪽은 브랜드 사진, 로고, 문의 문구, 색상이 교체된 완성본."),
    expectedResultDescription: "기본 템플릿 문구와 이미지를 모두 바꾸고 로고와 문의 문구가 보이는 홍보 영상으로 완성합니다.",
  },
  "15~30초 홍보 숏폼 완성하기": {
    title: "15~30초 홍보 숏폼 완성하기",
    previewImage: "/assets/capcut/practice/day5-final-shortform-preview.png",
    beforeImage: "/assets/capcut/before-after/unplanned-promo-before.png",
    afterImage: "/assets/capcut/practice/day5-final-shortform-preview.png",
    visualPrompt: prompt("홍보 숏폼 최종 프로젝트 전후 비교 이미지. 왼쪽은 목적이 불분명하고 장면이 길게 늘어진 초안, 오른쪽은 첫 3초 후킹, 핵심 메시지 3개, 행동 유도 문구가 정리된 완성본."),
    expectedResultDescription: "첫 3초 후킹, 핵심 메시지, 마지막 행동 유도까지 갖춘 최종 홍보 숏폼을 만듭니다.",
  },
  "음악 비트에 맞춘 15초 사진 슬라이드 쇼츠": {
    title: "음악 비트에 맞춘 15초 사진 슬라이드 쇼츠",
    previewImage: "/assets/capcut/ai/beat-sync-timeline.png",
    beforeImage: "/assets/capcut/before-after/no-beat-sync-before.png",
    afterImage: "/assets/capcut/ai/beat-sync-timeline.png",
    visualPrompt: prompt("음악 비트에 맞춘 사진 슬라이드 쇼츠 전후 비교 이미지. 왼쪽은 사진 전환이 음악과 맞지 않는 타임라인, 오른쪽은 자동 비트 마커에 사진 클립 끝점이 맞춰진 리듬감 있는 타임라인."),
    expectedResultDescription: "자동 비트 마커를 기준으로 사진 길이를 맞춰 리듬감 있는 15초 쇼츠를 만듭니다.",
  },
  "AI 이미지로 쇼츠 첫 장면 만들기": {
    title: "AI 이미지로 쇼츠 첫 장면 만들기",
    previewImage: "/assets/capcut/practice/ai-image-thumbnail-preview.png",
    beforeImage: "/assets/capcut/before-after/plain-first-scene.png",
    afterImage: "/assets/capcut/before-after/ai-thumbnail-first-scene.png",
    visualPrompt: prompt("AI 이미지로 쇼츠 첫 장면을 만드는 전후 비교 이미지. 왼쪽은 평범한 첫 장면과 작은 자막, 오른쪽은 AI 이미지 배경과 큰 제목 자막으로 첫 3초에 시선을 끄는 썸네일형 장면."),
    expectedResultDescription: "AI 이미지와 큰 제목 자막을 활용해 첫 3초에 시선을 끄는 쇼츠 첫 장면을 만듭니다.",
  },
  "AI 영상 생성 후 직접 편집하기": {
    title: "AI 영상 생성 후 직접 편집하기",
    previewImage: "/assets/capcut/ai/ai-video-workflow.png",
    beforeImage: "/assets/capcut/before-after/ai-video-draft.png",
    afterImage: "/assets/capcut/before-after/ai-video-edited.png",
    visualPrompt: prompt("AI 영상 생성 초안과 사람이 편집한 완성본 비교 이미지. 왼쪽은 AI 초안, 오른쪽은 자막 정리, 로고 추가, 음악 조절, 컷 정리가 완료된 완성본."),
    expectedResultDescription: "AI 영상 초안을 그대로 쓰지 않고 자막, 음악, 컷, 로고를 직접 수정해 완성도를 높입니다.",
  },
  "이미지에서 영상 만들기": {
    title: "이미지에서 영상 만들기",
    previewImage: "/assets/capcut/practice/image-to-video-preview.png",
    beforeImage: "/assets/capcut/before-after/static-photo-before.png",
    afterImage: "/assets/capcut/practice/image-to-video-preview.png",
    visualPrompt: prompt("이미지에서 영상 만들기 전후 비교 이미지. 왼쪽은 정적인 사진 3장, 오른쪽은 자동 움직임, 자막, 음악이 들어간 세로형 홍보 숏폼 완성본."),
    expectedResultDescription: "정적인 사진을 움직이는 영상처럼 만들고 자막과 음악을 더해 홍보용 숏폼으로 완성합니다.",
  },
};

export function getVisualAsset(id: string) {
  return capcutVisualAssets.find((asset) => asset.id === id) ?? null;
}

export function getVisualAssetsForLesson(key: LessonKey) {
  return visualAssetsByLesson[key].map(getVisualAsset).filter(Boolean) as VisualAsset[];
}

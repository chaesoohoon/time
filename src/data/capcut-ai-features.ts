export type AiFeature = {
  id: string;
  title: string;
  navLabel: string;
  difficulty: string;
  badge: string;
  relatedDay: string;
  purpose: string;
  easy: string;
  examples: string[];
  practice: string;
  prompt?: string;
  caution: string;
};

export const aiFeatureCards: AiFeature[] = [
  {
    id: "ai-image",
    title: "AI 이미지 생성",
    navLabel: "AI 이미지 생성",
    difficulty: "초급~중급",
    badge: "무료/Pro/Credits 확인",
    relatedDay: "Day 4, Day 5",
    purpose: "쇼츠 첫 장면, 썸네일, 홍보 이미지, 카드뉴스 배경 만들기",
    easy: "텍스트로 원하는 이미지를 설명하면 AI가 이미지를 만들어주는 기능입니다.",
    examples: ["유튜브 썸네일 배경", "홍보 영상 첫 장면", "제품 광고 이미지", "카드뉴스 표지", "수업 예제 이미지"],
    practice: "학원 홍보 숏폼에 사용할 밝고 전문적인 배경 이미지를 생성해보세요.",
    prompt:
      "밝은 교육 공간, 컴퓨터 수업 분위기, 젊은 수강생들이 집중하는 모습, 깔끔한 홍보 이미지 스타일, 세로형 숏폼 배경",
    caution: "AI 이미지는 한 번에 완벽하게 나오지 않을 수 있습니다. 입력 문구를 조금씩 바꾸며 비교하세요.",
  },
  {
    id: "ai-video",
    title: "AI 영상 생성",
    navLabel: "AI 영상 생성",
    difficulty: "중급",
    badge: "Credits 확인 가능성 높음",
    relatedDay: "Day 5",
    purpose: "홍보 영상 초안, 정보 전달 쇼츠, 제품 소개 영상 아이디어 만들기",
    easy: "텍스트나 아이디어를 입력하면 AI가 영상 초안을 만들어주는 기능입니다.",
    examples: ["홍보 영상 초안", "정보 전달 쇼츠", "제품 소개 영상", "교육 콘텐츠 예고편", "SNS 광고 아이디어"],
    practice: "15초 학원 홍보 영상을 AI 영상 생성으로 먼저 만든 뒤, 자막과 음악을 직접 수정해보세요.",
    prompt:
      "20대 초보자를 위한 영상편집 수업 홍보 영상, 밝고 활기찬 분위기, 첫 장면은 '영상 편집 처음이라면?' 문구, 마지막 장면은 수강 신청 유도",
    caution: "AI 영상 생성 결과물은 완성본이 아니라 초안입니다. 컷 길이, 자막, 음악, 로고, 문의 문구를 반드시 수정하세요.",
  },
  {
    id: "image-to-video",
    title: "이미지에서 영상 만들기",
    navLabel: "이미지에서 영상 만들기",
    difficulty: "초급~중급",
    badge: "Credits/Pro 확인",
    relatedDay: "Day 4, Day 5",
    purpose: "정적인 사진을 움직이는 홍보 영상이나 릴스처럼 만들기",
    easy: "사진이나 이미지를 넣으면 AI가 움직임, 전환, 분위기를 추가해서 영상처럼 만들어주는 기능입니다.",
    examples: ["제품 사진 홍보 영상", "수업 결과물 릴스", "여행 사진 영상", "포트폴리오 영상", "움직이는 카드뉴스"],
    practice: "정적인 제품 사진 3장을 가져와 15초 제품 소개 영상으로 만들어보세요.",
    caution: "자동 움직임이 어색하면 그대로 쓰지 말고 길이를 줄이거나 직접 키프레임으로 보정하세요.",
  },
  {
    id: "ai-design",
    title: "AI Design / 썸네일 제작",
    navLabel: "AI Design / 썸네일 제작",
    difficulty: "초급",
    badge: "무료/Pro 확인",
    relatedDay: "Day 5",
    purpose: "영상 첫 장면, 포스터, 이벤트 이미지, 카드뉴스 표지 빠르게 만들기",
    easy: "AI를 활용해 포스터, 썸네일, 광고 이미지, SNS 이미지를 빠르게 만드는 기능입니다.",
    examples: ["유튜브 썸네일", "쇼츠 첫 장면", "학원 홍보 이미지", "이벤트 포스터", "카드뉴스 표지"],
    practice: "캡컷 수업 홍보용 썸네일 이미지를 AI Design으로 만든 뒤 영상 첫 장면에 넣어보세요.",
    caution: "문구가 너무 많으면 모바일에서 읽기 어렵습니다. 큰 제목 1개와 짧은 보조 문구만 남기세요.",
  },
  {
    id: "text-to-speech",
    title: "텍스트 음성 변환",
    navLabel: "텍스트 음성 변환",
    difficulty: "초급",
    badge: "프리미엄 음성 확인",
    relatedDay: "Day 3",
    purpose: "녹음 없이 정보 전달 영상이나 홍보 영상 내레이션 만들기",
    easy: "문장을 입력하면 AI 음성으로 읽어주는 기능입니다.",
    examples: ["홍보 영상 내레이션", "정보 전달 쇼츠", "카드뉴스형 영상", "수업자료 요약", "제품 설명 영상"],
    practice: "직접 목소리를 녹음하지 않고 AI 음성으로 20초 정보 전달 영상을 만들어보세요.",
    caution: "문장이 너무 길면 부자연스럽게 들릴 수 있습니다. 짧은 문장으로 끊어 쓰세요.",
  },
  {
    id: "auto-caption",
    title: "자동 자막",
    navLabel: "자동 자막",
    difficulty: "초급",
    badge: "대부분 기본 기능",
    relatedDay: "Day 3",
    purpose: "강의, 인터뷰, 쇼츠, 홍보 영상의 말소리를 빠르게 자막화하기",
    easy: "영상 속 말을 분석해서 자막을 자동으로 만들어주는 기능입니다.",
    examples: ["강의 영상 자막", "인터뷰 자막", "쇼츠 자막", "홍보 영상 자막", "정보 전달 영상 자막"],
    practice: "말하는 영상에 자동 자막을 만든 뒤 사람 이름, 기관명, 전문용어를 직접 고쳐보세요.",
    caution: "자동 자막은 편하지만 완벽하지 않습니다. 고유명사와 전문용어는 반드시 확인하세요.",
  },
  {
    id: "smart-cutout",
    title: "배경 제거 / Smart Cutout",
    navLabel: "배경 제거 / Smart Cutout",
    difficulty: "중급",
    badge: "Pro/Credits 확인",
    relatedDay: "Day 4",
    purpose: "인물이나 제품만 남겨 새 배경, 광고 이미지, 썸네일에 합성하기",
    easy: "인물이나 사물을 자동으로 따서 배경을 제거하는 기능입니다.",
    examples: ["강사만 남기고 배경 바꾸기", "제품 광고 영상", "썸네일 인물 이미지", "가상 배경 합성", "카드뉴스형 영상"],
    practice: "인물 영상을 가져와 배경을 제거하고 AI 이미지로 만든 배경 위에 합성해보세요.",
    caution: "머리카락, 손가락, 투명 물체 주변은 깨질 수 있으니 확대해서 확인하세요.",
  },
  {
    id: "motion-tracking",
    title: "모션 트래킹",
    navLabel: "모션 트래킹",
    difficulty: "중급",
    badge: "버전별 위치 확인",
    relatedDay: "Day 4",
    purpose: "움직이는 얼굴, 제품, 손동작을 따라가는 스티커나 강조 표시 만들기",
    easy: "움직이는 사람이나 물건을 따라가게 만드는 기능입니다.",
    examples: ["얼굴 이름표", "제품 강조 표시", "따라다니는 스티커", "특정 부분 설명", "움직이는 화살표"],
    practice: "움직이는 사람 얼굴 위에 이름표를 붙이고 얼굴을 따라 움직이게 만들어보세요.",
    caution: "처음에는 짧고 움직임이 단순한 구간부터 적용해야 성공률이 높습니다.",
  },
  {
    id: "beat-sync",
    title: "음악 비트 자동 감지 / Beat Sync",
    navLabel: "음악 비트 자동 편집",
    difficulty: "초급~중급",
    badge: "기능명/위치 확인",
    relatedDay: "Day 2",
    purpose: "음악 박자에 맞춰 사진이나 영상 컷이 바뀌는 리듬감 있는 편집 만들기",
    easy: "음악의 박자를 자동으로 찾아 컷 편집이나 전환 타이밍을 맞추기 쉽게 도와주는 기능입니다.",
    examples: ["사진 슬라이드쇼", "여행 영상 하이라이트", "댄스 영상", "제품 등장 장면", "쇼츠 컷 리듬"],
    practice: "사진 8~12장을 음악 비트에 맞춰 15초 쇼츠로 편집해보세요.",
    caution: "Beat Sync, Mark beats, Auto beat, 비트 표시처럼 버전마다 이름이 다를 수 있습니다.",
  },
];

export const aiVersionNotice =
  "캡컷은 업데이트가 자주 되는 프로그램입니다. 기능 이름, 위치, 무료 사용 가능 여부는 PC / 모바일 / 웹 / Pro 여부와 버전에 따라 달라질 수 있습니다. 수업에서는 현재 PC 화면을 기준으로 기능 위치와 사용 가능 여부를 함께 확인하세요.";

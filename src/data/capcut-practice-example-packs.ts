export type PracticeExample = {
  id: string;
  title: string;
  scenario: string;
  materials: string[];
  buttonPath: string[];
  prompt?: string;
  targetResult: string;
  checkpoints: string[];
  timeBox: "10분" | "20분" | "30분" | "40분";
};

export const practiceExamplePacks: Record<string, PracticeExample[]> = {
  "10초 자기소개 영상 만들기": [
    {
      id: "self-intro-student",
      title: "처음 배우는 수강생 자기소개",
      scenario: "수강생이 자기 이름, 배우고 싶은 이유, 오늘 목표를 10초 안에 말합니다.",
      materials: ["말하는 영상 2개", "손 흔드는 사진 1장", "이름 자막 문구"],
      buttonPath: ["가져오기", "타임라인 드래그", "Ctrl+B", "Delete", "텍스트", "내보내기"],
      targetResult: "실수 장면을 지우고 이름 자막이 들어간 8~12초 자기소개 영상",
      checkpoints: ["시작 1초 안에 이름이 보임", "실수 장면이 남지 않음", "마지막 인사가 어색하게 끊기지 않음"],
      timeBox: "20분",
    },
    {
      id: "self-intro-portfolio",
      title: "포트폴리오 첫 장면용 소개",
      scenario: "내가 만들고 싶은 영상 분야를 한 문장으로 소개합니다.",
      materials: ["말하는 영상 1개", "작업 화면 사진 1장", "짧은 목표 문구"],
      buttonPath: ["가져오기", "사진 2초 배치", "자막 추가", "컷 정리", "재생 확인"],
      targetResult: "처음 2초에 목표가 보이고 뒤에 말하는 장면이 이어지는 짧은 포트폴리오 인트로",
      checkpoints: ["첫 장면이 너무 길지 않음", "목표 문구가 모바일에서 읽힘", "말하는 장면 볼륨이 충분함"],
      timeBox: "20분",
    },
  ],
  "작업 과정 15초 숏폼 만들기": [
    {
      id: "process-cooking",
      title: "요리 과정 15초 압축",
      scenario: "재료 준비부터 완성 접시까지 긴 과정을 리듬감 있게 줄입니다.",
      materials: ["요리 과정 영상 5개", "완성 사진 1장", "빠른 배경음악"],
      buttonPath: ["속도", "2배속", "4배속", "전환", "오디오", "내보내기"],
      targetResult: "준비 장면은 빠르게, 완성 장면은 2초 이상 보여주는 요리 숏폼",
      checkpoints: ["반복 동작이 4배속 처리됨", "완성 장면이 충분히 보임", "전환이 3개 이하"],
      timeBox: "30분",
    },
    {
      id: "process-design",
      title: "디자인 작업 과정 쇼츠",
      scenario: "포토샵, 일러스트, 캡컷 작업 화면을 단계별로 보여줍니다.",
      materials: ["작업 화면 녹화 3개", "완성 결과 이미지", "단계 자막 3개"],
      buttonPath: ["자르기", "속도", "텍스트", "전환", "미리보기"],
      targetResult: "작업 전, 작업 중, 완성 결과가 분명하게 보이는 15초 과정 영상",
      checkpoints: ["각 단계 자막이 1초 이상 보임", "작업 화면이 너무 빨리 지나가지 않음", "완성 결과가 마지막에 보임"],
      timeBox: "30분",
    },
  ],
  "정보 전달 쇼츠 만들기": [
    {
      id: "info-tip-three",
      title: "초보자 팁 3가지 쇼츠",
      scenario: "영상 편집 초보자가 자주 헷갈리는 버튼 3개를 알려줍니다.",
      materials: ["말하는 영상 1개", "캡컷 화면 캡처 3장", "조용한 배경음악"],
      buttonPath: ["자동 자막", "자막 수정", "오디오", "볼륨", "효과음"],
      targetResult: "자동 자막을 정리하고 핵심 단어 3개가 강조된 정보 전달 쇼츠",
      checkpoints: ["자막이 2줄 이하", "핵심 단어만 강조", "배경음악이 목소리보다 작음"],
      timeBox: "30분",
    },
    {
      id: "info-review",
      title: "수업 후기 요약 쇼츠",
      scenario: "수강 후기 문장을 읽기 쉬운 자막 중심 영상으로 바꿉니다.",
      materials: ["후기 문장 3개", "수업 사진 2장", "차분한 음악"],
      buttonPath: ["텍스트", "자막 스타일", "오디오", "볼륨", "내보내기"],
      targetResult: "후기 핵심 문장이 크게 보이고 음악은 낮게 깔린 카드뉴스형 쇼츠",
      checkpoints: ["문장 하나가 너무 길지 않음", "사진과 자막이 서로 가리지 않음", "마지막에 문의 문구가 있음"],
      timeBox: "20분",
    },
  ],
  "제품 소개형 움직이는 카드뉴스 영상 만들기": [
    {
      id: "product-cardnews",
      title: "제품 장점 3개 카드뉴스",
      scenario: "제품 사진 1장으로 장점 3가지를 보여주는 움직이는 카드뉴스를 만듭니다.",
      materials: ["제품 사진 1장", "배경 이미지 1장", "장점 문구 3개", "로고"],
      buttonPath: ["오버레이", "텍스트", "키프레임", "스티커", "내보내기"],
      targetResult: "제품이 천천히 확대되고 장점 자막이 순서대로 등장하는 카드뉴스 영상",
      checkpoints: ["제품이 화면 밖으로 잘리지 않음", "자막이 제품을 가리지 않음", "키프레임 움직임이 과하지 않음"],
      timeBox: "40분",
    },
    {
      id: "class-cardnews",
      title: "수업 안내 카드뉴스",
      scenario: "수업명, 대상, 배울 내용을 세 장면으로 나눠 보여줍니다.",
      materials: ["수업 사진 2장", "아이콘 또는 스티커", "안내 문구 3개"],
      buttonPath: ["배경 배치", "오버레이", "텍스트", "키프레임", "전환"],
      targetResult: "수업 안내 문구가 장면별로 정리된 15초 카드뉴스형 영상",
      checkpoints: ["한 장면에 문구가 2개 이하", "색상과 폰트가 통일됨", "마지막에 신청 안내가 있음"],
      timeBox: "40분",
    },
  ],
  "배경 제거 합성 영상": [
    {
      id: "cutout-instructor",
      title: "강사 소개 배경 합성",
      scenario: "강사 인물 영상에서 배경을 제거하고 수업 배경 이미지 위에 합성합니다.",
      materials: ["강사 영상 1개", "강의실 배경 이미지", "이름표 자막"],
      buttonPath: ["클립 선택", "배경 제거", "오버레이", "크기 조절", "자막"],
      targetResult: "인물만 깔끔하게 남고 새 배경 위에 자연스럽게 배치된 소개 영상",
      checkpoints: ["머리카락 주변 깨짐 확인", "인물 밝기와 배경 밝기가 어울림", "이름표가 얼굴을 가리지 않음"],
      timeBox: "30분",
    },
  ],
  "템플릿 활용 홍보 영상": [
    {
      id: "template-academy",
      title: "학원 홍보 템플릿 교체",
      scenario: "기본 템플릿을 학원 홍보 영상으로 바꿉니다.",
      materials: ["수업 사진 3장", "로고", "문의 문구", "브랜드 색상"],
      buttonPath: ["템플릿", "문구 수정", "사진 교체", "음악 확인", "내보내기"],
      targetResult: "기본 문구가 남지 않고 학원 이름과 문의 문구가 분명한 홍보 영상",
      checkpoints: ["템플릿 기본 문구가 모두 바뀜", "사진 비율이 찌그러지지 않음", "로고와 문의 문구가 읽힘"],
      timeBox: "30분",
    },
  ],
  "15~30초 홍보 숏폼 완성하기": [
    {
      id: "final-academy-promo",
      title: "캡컷 5일 수업 홍보 쇼츠",
      scenario: "영상 편집 초보자를 대상으로 5일 수업의 장점을 알립니다.",
      materials: ["수업 사진 3장", "강의 장면 영상 2개", "AI 이미지 첫 장면", "문의 문구"],
      buttonPath: ["첫 3초 문구", "컷 편집", "자동 자막", "음악", "내보내기"],
      prompt: "영상편집 처음이라면? 5일 동안 캡컷으로 쇼츠 완성하기",
      targetResult: "후킹, 핵심 메시지 3개, 마지막 신청 문구가 들어간 15~30초 홍보 숏폼",
      checkpoints: ["첫 3초에 볼 이유가 보임", "핵심 메시지가 3개 이하", "마지막 행동 유도 문구가 있음"],
      timeBox: "40분",
    },
    {
      id: "final-product-promo",
      title: "소상공인 제품 홍보 쇼츠",
      scenario: "제품 사진과 짧은 영상으로 구매 또는 문의를 유도합니다.",
      materials: ["제품 사진 3장", "사용 장면 영상 1개", "가격 또는 장점 문구", "문의 문구"],
      buttonPath: ["AI 이미지", "오버레이", "자막", "Beat Sync", "내보내기"],
      targetResult: "제품 장점과 문의 문구가 분명한 세로형 홍보 쇼츠",
      checkpoints: ["제품이 선명하게 보임", "가격 또는 장점이 짧게 보임", "음악이 영상 분위기와 맞음"],
      timeBox: "40분",
    },
  ],
  "음악 비트에 맞춘 15초 사진 슬라이드 쇼츠": [
    {
      id: "beat-travel",
      title: "여행 사진 비트 슬라이드",
      scenario: "사진 10장을 음악 비트에 맞춰 여행 하이라이트로 만듭니다.",
      materials: ["사진 10장", "빠른 음악 1개", "제목 자막", "마지막 저장 유도 문구"],
      buttonPath: ["오디오 선택", "Beat Sync", "자동 마커", "사진 길이 맞추기", "전환"],
      targetResult: "강한 박자에 맞춰 사진이 바뀌는 15초 여행 쇼츠",
      checkpoints: ["모든 비트가 아니라 강한 비트 위주", "사진 길이가 마커와 맞음", "전환 효과가 과하지 않음"],
      timeBox: "30분",
    },
  ],
  "AI 이미지로 쇼츠 첫 장면 만들기": [
    {
      id: "ai-first-academy",
      title: "수업 홍보 첫 화면",
      scenario: "AI 이미지로 밝은 수업 분위기의 첫 장면을 만들고 큰 제목을 얹습니다.",
      materials: ["수업 주제", "첫 장면 문구", "AI 이미지 2~4개"],
      buttonPath: ["AI 이미지", "입력 문구", "생성", "타임라인", "텍스트"],
      prompt: "밝은 컴퓨터 교육 공간, 영상편집을 배우는 초보자, 깔끔한 홍보 이미지, 세로형 쇼츠 첫 화면",
      targetResult: "첫 3초에 영상 주제가 바로 보이는 썸네일형 첫 장면",
      checkpoints: ["자막이 이미지보다 잘 읽힘", "이미지가 복잡하지 않음", "다음 장면과 연결됨"],
      timeBox: "30분",
    },
  ],
  "AI 영상 생성 후 직접 편집하기": [
    {
      id: "ai-video-edit-promo",
      title: "AI 홍보 초안 다듬기",
      scenario: "AI가 만든 홍보 영상 초안을 사람이 직접 고쳐 완성본으로 만듭니다.",
      materials: ["AI 생성 초안", "로고", "핵심 문구 3개", "배경음악"],
      buttonPath: ["AI 영상", "초안 확인", "컷 삭제", "자막 수정", "로고 추가", "내보내기"],
      prompt: "20대 초보자를 위한 캡컷 수업 홍보 영상, 밝고 빠른 쇼츠 스타일, 마지막은 수강 신청 유도",
      targetResult: "AI 초안보다 자막이 짧고 로고와 행동 유도 문구가 분명한 완성 영상",
      checkpoints: ["AI 자막 오타 수정", "불필요한 장면 삭제", "로고와 문의 문구 추가"],
      timeBox: "40분",
    },
  ],
  "이미지에서 영상 만들기": [
    {
      id: "image-to-video-product",
      title: "제품 사진 3장 움직이는 홍보 영상",
      scenario: "정적인 제품 사진을 움직이는 쇼츠로 바꿉니다.",
      materials: ["제품 사진 3장", "장점 문구 3개", "음악 1개"],
      buttonPath: ["이미지 선택", "이미지→영상", "움직임 확인", "자막", "음악"],
      targetResult: "사진이 정지 이미지처럼 보이지 않고 장점 자막이 함께 나오는 제품 홍보 쇼츠",
      checkpoints: ["움직임이 과하지 않음", "사진과 자막 분위기가 맞음", "마지막 행동 유도 문구가 있음"],
      timeBox: "30분",
    },
  ],
  "AI Design으로 쇼츠 썸네일 만들기": [
    {
      id: "ai-design-thumbnail",
      title: "클릭하고 싶은 수업 썸네일",
      scenario: "AI Design으로 영상 첫 장면과 썸네일에 같이 쓸 이미지를 만듭니다.",
      materials: ["영상 주제", "큰 제목 1개", "보조 문구 1개", "브랜드 색상"],
      buttonPath: ["AI Design", "썸네일", "문구 입력", "생성", "첫 장면 배치"],
      prompt: "캡컷 5일 수업 홍보 썸네일, 큰 제목 '영상편집 처음이라면?', 밝고 전문적인 교육 디자인",
      targetResult: "모바일에서 큰 제목이 먼저 읽히는 썸네일형 첫 장면",
      checkpoints: ["문구가 2개 이하", "제목이 가장 큼", "브랜드 정보가 작게 보임"],
      timeBox: "30분",
    },
  ],
  "자동 자막 오류 수정과 강조 자막 만들기": [
    {
      id: "caption-fix-ai",
      title: "AI 자동 자막을 사람이 읽기 좋게 고치기",
      scenario: "자동으로 생성된 자막의 오타와 줄바꿈을 직접 고칩니다.",
      materials: ["말하는 영상 1개", "자동 자막 결과", "강조 단어 3개"],
      buttonPath: ["텍스트", "자동 자막", "자막 선택", "오타 수정", "스타일"],
      targetResult: "고유명사와 숫자 오타가 수정되고 핵심 단어만 강조된 정보 전달 쇼츠",
      checkpoints: ["고유명사 확인", "자막 2줄 이하", "강조 단어 3개 이하"],
      timeBox: "30분",
    },
  ],
  "AI 음성으로 내레이션 쇼츠 만들기": [
    {
      id: "tts-narration",
      title: "녹음 없이 정보 전달 쇼츠",
      scenario: "직접 녹음하지 않고 AI 음성으로 짧은 내레이션을 만듭니다.",
      materials: ["내레이션 문장 5개", "관련 사진 3장", "조용한 음악"],
      buttonPath: ["텍스트", "텍스트 음성 변환", "목소리 선택", "오디오 볼륨", "자막"],
      targetResult: "짧은 AI 음성과 읽기 쉬운 자막이 함께 나오는 정보 전달 쇼츠",
      checkpoints: ["문장이 짧게 끊김", "AI 음성이 음악보다 잘 들림", "자막과 음성 타이밍이 맞음"],
      timeBox: "30분",
    },
  ],
  "Smart Cutout으로 인물 합성하기": [
    {
      id: "smart-cutout-person",
      title: "인물만 남겨 새 배경에 합성",
      scenario: "인물 영상의 배경을 제거하고 AI 이미지 배경 위에 올립니다.",
      materials: ["인물 영상 1개", "새 배경 이미지", "이름표 자막"],
      buttonPath: ["클립 선택", "배경 제거", "오버레이", "위치 조절", "확대 확인"],
      targetResult: "인물이 새 배경 위에 자연스럽게 놓인 소개 영상",
      checkpoints: ["머리카락 경계 확인", "인물 밝기 조절", "이름표 위치 확인"],
      timeBox: "30분",
    },
  ],
  "모션 트래킹 이름표 붙이기": [
    {
      id: "motion-tracking-name-tag",
      title: "움직이는 얼굴을 따라가는 이름표",
      scenario: "움직이는 사람 얼굴 근처에 이름표가 따라다니게 만듭니다.",
      materials: ["움직이는 인물 영상", "이름표 텍스트", "짧은 강조 효과음"],
      buttonPath: ["오버레이", "이름표", "트래킹", "대상 지정", "적용"],
      targetResult: "이름표가 얼굴 주변을 자연스럽게 따라가는 짧은 소개 장면",
      checkpoints: ["짧은 구간부터 적용", "이름표가 얼굴을 가리지 않음", "트래킹이 튀는 지점 확인"],
      timeBox: "30분",
    },
  ],
};

export function getPracticeExamplePack(title: string) {
  return practiceExamplePacks[title] ?? [];
}

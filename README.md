# 강의실 운영 현황

국제 첨단점 학원 내부에서 매일 켜놓고 보는 강의실 운영 상황판입니다.

Google Sheets의 `rooms`, `instructors`, `courses`, `schedules`, `closures`, `review_notes` 데이터를 서버에서 CSV로 읽어와 오늘 현황, 주간/월간/연간 일정, 강의실별/강사별 보기, 빈 강의실 찾기, 중복 배정 경고를 보여줍니다.

## Getting Started

환경 변수:

```bash
NEXT_PUBLIC_GOOGLE_SHEET_ID=1E-L-1WfHiqmFey0oPwmSjaRvljAsiFbQk9japkGQ7eI
```

운영 데이터베이스:

[강의실 운영 현황 통합 DB](https://docs.google.com/spreadsheets/d/1E-L-1WfHiqmFey0oPwmSjaRvljAsiFbQk9japkGQ7eI/edit)

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 데이터 연결

CSV export URL 형식:

```text
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={SHEET_NAME}
```

시트가 비공개이거나 탭 이름이 맞지 않으면 샘플 데이터로 대체하지 않고 오류 화면을 표시합니다.

## Scripts

```bash
npm run lint
npm run build
```

## Google Sheets 바로 저장 설정

앱의 `시간표 작성` 화면은 기본적으로 입력값을 검사하고, 쓰기 연결이 설정되어 있으면 Google Sheets에 바로 저장합니다.

1. Google Sheets에서 `확장 프로그램 > Apps Script`를 엽니다.
2. `scripts/google-sheets-write-webapp.gs` 내용을 붙여넣습니다.
3. Apps Script의 `프로젝트 설정 > 스크립트 속성`에 `WRITE_SECRET` 값을 추가합니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
   - 실행 사용자: 나
   - 액세스 권한: 링크가 있는 모든 사용자
5. `.env.local`에 아래 값을 추가하고 개발 서버를 재시작합니다.

```bash
GOOGLE_SHEETS_WRITE_WEB_APP_URL=https://script.google.com/macros/s/...
GOOGLE_SHEETS_WRITE_SECRET=Apps Script에 넣은 WRITE_SECRET과 같은 값
```

이 값들은 서버에서만 사용됩니다. 브라우저로 노출되지 않도록 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- date-fns
- papaparse
- lucide-react

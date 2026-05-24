import { NextResponse } from "next/server";
import { loadAllSheetData } from "@/lib/googleSheets";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await loadAllSheetData();
    return NextResponse.json({
      data,
      loadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Google Sheets 데이터를 불러오지 못했습니다. 시트 공유 설정 또는 시트 이름을 확인하세요.",
        detail: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 502 },
    );
  }
}

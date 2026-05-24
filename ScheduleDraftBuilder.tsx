"use client";

import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { SHEET_ID } from "@/lib/constants";

type ErrorStateProps = {
  message?: string;
};

export default function ErrorState({ message }: ErrorStateProps) {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Google Sheets 데이터를 불러오지 못했습니다.</h1>
            <p className="mt-3 text-slate-600">
              시트 공유 설정이 “링크가 있는 모든 사용자 보기 가능”인지, 시트 이름이 정확한지 확인하세요.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">확인할 설정</p>
              <p className="mt-2">Google Sheets에서 공유 버튼을 누른 뒤 일반 액세스를 다음처럼 바꿔주세요.</p>
              <p className="mt-2 rounded-xl bg-white px-3 py-2 font-medium text-slate-900">
                링크가 있는 모든 사용자 · 보기 가능
              </p>
            </div>
            {message ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                통합 DB 열기
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" />
                다시 불러오기
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

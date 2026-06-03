import type { Metadata } from "next";
import CapcutVisualLearningKit from "@/components/CapcutVisualLearningKit";

export const metadata: Metadata = {
  title: "캡컷 PC 화면 주석형 학습",
  description: "캡컷 PC 화면 캡처 위 번호 핫스팟을 누르며 가져오기, 타임라인, 자막, 오디오, 내보내기를 배우는 5일 수업 사이트",
};

export default function CapcutPage() {
  return <CapcutVisualLearningKit />;
}

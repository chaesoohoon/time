import type { Metadata } from "next";
import CapcutLearningKit from "@/components/CapcutLearningKit";

export const metadata: Metadata = {
  title: "처음 배우는 캡컷 5일 완성",
  description: "강사와 학생이 함께 쓰는 초보자용 캡컷 5일 학습 키트",
};

export default function CapcutPage() {
  return <CapcutLearningKit />;
}

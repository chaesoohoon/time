import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: number | string;
  description: string;
  tone?: "blue" | "green" | "amber" | "slate" | "red" | "purple";
};

const tones = {
  blue: "bg-toss-blue-light text-toss-blue",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-toss-bg text-toss-gray-secondary",
  red: "bg-red-50 text-red-500",
  purple: "bg-purple-50 text-purple-600",
};

export default function StatCard({ icon: Icon, title, value, description, tone = "slate" }: StatCardProps) {
  return (
    <section className="rounded-[24px] bg-white p-6 shadow-toss border-0 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-toss-gray-tertiary">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-toss-gray-primary">{value}</p>
        </div>
        <div className={cn("rounded-[16px] p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-toss-gray-secondary">{description}</p>
    </section>
  );
}

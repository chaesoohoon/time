import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-toss-border bg-white p-8 text-center shadow-sm" role="status">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-toss-bg text-toss-gray-tertiary">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-black text-toss-gray-primary">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-toss-gray-secondary">{description}</p>
    </div>
  );
}

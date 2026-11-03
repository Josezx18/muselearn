import { Skeleton } from "@/components/ui";
export default function Loading() {
  return <div className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
}

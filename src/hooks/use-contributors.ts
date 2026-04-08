import { useQuery } from "@tanstack/react-query";
import type { ContributorSummary } from "@/types";

async function fetchContributors(): Promise<ContributorSummary[]> {
  const res = await fetch("/api/contributors");
  if (!res.ok) throw new Error("Failed to fetch contributors");
  return res.json();
}

export function useContributors() {
  return useQuery({
    queryKey: ["contributors"],
    queryFn: fetchContributors,
  });
}

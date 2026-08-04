"use client";

import { useRouter } from "next/navigation";
import { TierDetailPage } from "@/components/tier-detail-page";

export default function MembershipSilverPage() {
  const router = useRouter();
  return (
    <TierDetailPage
      tier="Silver"
      onBack={() => router.push("/")}
      onOpenLogin={(tab) => router.push(`/auth?tab=${tab}`)}
    />
  );
}

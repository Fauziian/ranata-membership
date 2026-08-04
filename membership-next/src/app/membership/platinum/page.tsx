"use client";

import { useRouter } from "next/navigation";
import { TierDetailPage } from "@/components/tier-detail-page";

export default function MembershipPlatinumPage() {
  const router = useRouter();
  return (
    <TierDetailPage
      tier="Platinum"
      onBack={() => router.push("/")}
      onOpenLogin={(tab) => router.push(`/auth?tab=${tab}`)}
    />
  );
}

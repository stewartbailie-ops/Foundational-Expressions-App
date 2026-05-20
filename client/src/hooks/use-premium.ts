import { useQuery } from "@tanstack/react-query";
import { isPremiumActive, isBasicOrBetter } from "@shared/schema";

type BillingStatus = {
  tier?: string | null;
  status?: string | null;
  trialEndsAt?: string | null;
  configured?: boolean;
};

export function usePremium() {
  const { data, isLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    staleTime: 60_000,
  });
  const advisor = {
    subscriptionTier: data?.tier ?? null,
    subscriptionStatus: data?.status ?? null,
    trialEndsAt: data?.trialEndsAt ?? null,
  };
  return {
    isLoading,
    tier: data?.tier ?? "trial",
    status: data?.status ?? "trialing",
    trialEndsAt: data?.trialEndsAt ?? null,
    isPremium: isPremiumActive(advisor),
    isBasicOrBetter: isBasicOrBetter(advisor),
  };
}

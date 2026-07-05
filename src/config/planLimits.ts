import type { Plan } from "../types/domain";

export interface PlanLimits {
  nativeLanguages: number;
  targetLanguages: number;
  dailyConnects: number | null;
  profilePhotos: number;
}

export const DEFAULT_PLAN: Plan = "free";

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    nativeLanguages: 1,
    targetLanguages: 1,
    // TODO: Enforce daily connect limits when the connect usage model exists.
    dailyConnects: null,
    profilePhotos: 1,
  },
  premium: {
    nativeLanguages: 2,
    targetLanguages: 3,
    // TODO: Enforce daily connect limits when the connect usage model exists.
    dailyConnects: null,
    // Multiple profile photos are not implemented yet.
    profilePhotos: 1,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[DEFAULT_PLAN];
}

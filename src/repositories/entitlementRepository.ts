import { doc, getDoc } from "firebase/firestore";
import { DEFAULT_PLAN } from "../config/planLimits";
import type { Entitlement, Plan } from "../types/domain";
import { getConfiguredDb } from "./firestoreHelpers";

function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "premium";
}

export async function getUserPlan(uid: string): Promise<Plan> {
  try {
    const snapshot = await getDoc(doc(getConfiguredDb(), "entitlements", uid));
    if (!snapshot.exists()) return DEFAULT_PLAN;

    const entitlement = snapshot.data() as Partial<Entitlement>;
    if (entitlement.active === true && isPlan(entitlement.plan)) {
      return entitlement.plan;
    }
    return DEFAULT_PLAN;
  } catch {
    // Entitlements are optional in this preview build. Missing rules, missing documents,
    // or transient read failures must not block existing free users.
    return DEFAULT_PLAN;
  }
}

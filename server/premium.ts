import type { Request, Response, NextFunction } from "express";
import { isPremiumActive, isBasicOrBetter } from "@shared/schema";
import { storage } from "./storage";

async function loadSessionAdvisor(req: Request) {
  const advisorId = (req.session as any)?.advisorId;
  if (typeof advisorId !== "number") return undefined;
  return storage.getAdvisor(advisorId);
}

export function requirePremium() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const advisor = await loadSessionAdvisor(req);
    if (!advisor) return res.status(401).json({ message: "Unauthorized" });
    if (!isPremiumActive(advisor)) {
      return res.status(402).json({ message: "Premium subscription required", tier: advisor.subscriptionTier ?? "trial" });
    }
    (req as any).advisor = advisor;
    next();
  };
}

export function requireBasicOrBetter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const advisor = await loadSessionAdvisor(req);
    if (!advisor) return res.status(401).json({ message: "Unauthorized" });
    if (!isBasicOrBetter(advisor)) {
      return res.status(402).json({ message: "Subscription required", tier: advisor.subscriptionTier ?? "trial" });
    }
    (req as any).advisor = advisor;
    next();
  };
}

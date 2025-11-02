import { Router, Request, Response } from "express";
import { zeroTrustGuard, roleGuard } from "@middlewares/accessGuard";
import policyService from "@services/policy.service";
import riskEngine from "@services/riskEngine";

const proxyRouter = Router();

proxyRouter.get("/config", (req: Request, res: Response) => {
  res.json({
    protectedResources: policyService["resources"], // Access private field for demo
    riskThresholds: riskEngine.thresholds,
  });
});

// Test risk calculation
proxyRouter.post("/test-risk", (req: Request, res: Response) => {
  const { posture, context } = req.body;

  const riskScore = riskEngine.evaluate(req.ip, posture, context);
  const decision = riskEngine.getRiskDecision(riskScore);

  res.json({
    riskScore,
    decision,
    message: `Risk score: ${riskScore.toFixed(2)} → Decision: ${decision}`,
  });
});

export default proxyRouter;

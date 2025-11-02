import { Router, Request, Response } from "express";
import { roleGuard } from "@middlewares/accessGuard";

const adminRouter = Router();

adminRouter.use(roleGuard(["admin"]));

adminRouter.get("/dashboard", (req: Request, res: Response) => {
  res.json({
    message: "Admin Dashboard",
    user: req.user,
    stats: {
      totalAccessAttempts: 1250,
      blockedAttempts: 45,
      mfaChallenges: 120,
      allowedAccess: 1085,
    },
  });
});

// View recent access logs
adminRouter.get("/logs", (req: Request, res: Response) => {
  // TODO: Fetch from database
  res.json({
    logs: [
      {
        timestamp: new Date().toISOString(),
        user: "banker1",
        resource: "/api/banking/dashboard",
        decision: "allow",
        riskScore: 0.15,
      },
      {
        timestamp: new Date().toISOString(),
        user: "unknown_user",
        resource: "/api/admin/users",
        decision: "block",
        riskScore: 0.85,
      },
    ],
  });
});

// Configure risk policies
adminRouter.get("/policies", (req: Request, res: Response) => {
  res.json({
    currentPolicies: {
      allowThreshold: 0.3,
      mfaThreshold: 0.6,
      blockThreshold: 0.8,
    },
  });
});

adminRouter.put("/policies", (req: Request, res: Response) => {
  const { allowThreshold, mfaThreshold, blockThreshold } = req.body;

  // TODO: Update config file or database
  res.json({
    message: "Policies updated successfully",
    newPolicies: { allowThreshold, mfaThreshold, blockThreshold },
  });
});

export default adminRouter;

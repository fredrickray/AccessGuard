import { Router, Request, Response, NextFunction } from "express";
import { roleGuard } from "@middlewares/accessGuard";
import User from "@models/User";

const adminRouter = Router();

adminRouter.use(roleGuard(["admin"]));

adminRouter.get(
  "/dashboard",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Fetch admin user from database
      const adminUser = await User.findById(userId);

      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      // Fetch all non-admin users from database
      const nonAdminUsers = await User.find({
        roles: { $ne: "admin" },
      }).select("-password");

      res.json({
        message: "Admin Dashboard",
        admin: {
          id: adminUser._id,
          username: adminUser.username,
          email: adminUser.email,
          roles: adminUser.roles,
        },
        users: nonAdminUsers,
        stats: {
          totalUsers: nonAdminUsers.length,
          compliantDevices: 980,
          accessDenials: 75,
          atRiskDevices: 15,
          totalAccessAttempts: 1250,
          blockedAttempts: 45,
          mfaChallenges: 120,
          allowedAccess: 1085,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await User.find({
        roles: { $ne: "admin" },
      }).select("-password");
      res.json({ users });
    } catch (error) {
      next(error);
    }
  }
);

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

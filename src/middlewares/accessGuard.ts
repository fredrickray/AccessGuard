import { Request, Response, NextFunction } from "express";
import verifyJwt from "./auth.middleware";
import { Unauthorized, Forbidden } from "./error.middleware";
import policyService from "@services/policy.service";
import riskEngine from "@services/riskEngine";
import logger from "@cores/logger";
import type {
  DecodedToken,
  DevicePosture,
  AccessContext,
  RiskDecision,
} from "@type/index";

export function roleGuard(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const decodedToken = verifyJwt(req) as DecodedToken | null;

      if (!decodedToken) {
        throw new Unauthorized("Authentication required");
      }

      const userRoles = decodedToken.roles || [];
      const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasAccess) {
        throw new Forbidden("Insufficient permissions");
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function zeroTrustGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. Check if path is protected
    const resource = policyService.getResourceForPath(req.originalUrl);

    if (!resource) {
      // Path not protected, allow through
      return next();
    }

    // 2. Verify JWT authentication
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn(
        `Unauthorized: Missing or invalid auth header for ${resource.name}`
      );
      throw new Unauthorized(`Missing or invalid authorization header`);
    }

    const token = authHeader.slice(7);
    const user = verifyJwt(req) as DecodedToken | null;

    if (!user) {
      throw new Unauthorized("User not authenticated");
    }

    req.user = user;

    // 3. Check role-based access
    const userRoles = user.roles || [];
    const hasRoleAccess = resource.requiredRoles.some((role: string) =>
      userRoles.includes(role)
    );

    if (!hasRoleAccess) {
      logger.warn(
        `Access denied for user ${user.username} to ${req.path} - insufficient roles`
      );
      throw new Forbidden(
        "User does not have required roles for this resource"
      );
    }

    // 4. Extract device posture and context from headers
    const posture = parseDevicePosture(req);
    const context = parseAccessContext(req);

    req.devicePosture = posture;
    req.accessContext = context;

    // Debug: Log parsed risk data
    logger.info(
      {
        devicePosture: posture,
        accessContext: context,
      },
      "Parsed risk data from headers"
    );

    // 5. Evaluate risk score
    const riskScore = riskEngine.evaluate(req.ip, posture, context);
    const decision = riskEngine.getRiskDecision(riskScore);

    logger.info(
      {
        riskScore: parseFloat(riskScore.toFixed(2)),
        decision,
        threshold_allow: riskEngine.thresholds.allow,
        threshold_mfa: riskEngine.thresholds.mfa,
        threshold_block: riskEngine.thresholds.block,
      },
      "Risk evaluation result"
    );

    const accessDecision: RiskDecision = {
      decision,
      riskScore,
      user: user.username,
      timestamp: new Date(),
    };

    req.accessDecision = accessDecision;

    // 6. Log the decision
    logger.info(
      {
        user: user.username,
        path: req.path,
        decision,
        riskScore: parseFloat(riskScore.toFixed(2)),
        ip: req.ip,
      },
      "Access decision logged"
    );

    // 7. Enforce decision
    if (decision === "block") {
      logger.warn(
        { riskScore, ip: req.ip, path: req.path },
        "High-risk activity detected - access blocked"
      );

      throw new Forbidden("Access Denied", {
        message: "High-risk activity detected - access blocked",
        riskScore: parseFloat(riskScore.toFixed(2)),
        contactSupport: true,
      });
    }

    if (decision === "mfa") {
      logger.info(
        { riskScore, ip: req.ip },
        `Step-Up Authentication required for ${user.username} due to elevated risk`
      );

      throw new Unauthorized("Step-Up Authentication Required", {
        message: "Additional verification needed due to elevated risk",
        riskScore: parseFloat(riskScore.toFixed(2)),
        mfaRequired: true,
      });
    }

    // Allow access
    next();
  } catch (error) {
    next(error);
  }
}

function parseDevicePosture(req: Request): Partial<DevicePosture> {
  try {
    const postureHeader = req.headers["x-device-posture"] as string;
    return postureHeader ? JSON.parse(postureHeader) : {};
  } catch (error) {
    logger.error({ error }, "Failed to parse device posture");
    // logger.error("Failed to parse device posture:", error);
    return {};
  }
}

function parseAccessContext(req: Request): Partial<AccessContext> {
  try {
    const contextHeader = req.headers["x-access-context"] as string;
    const parsed = contextHeader ? JSON.parse(contextHeader) : {};

    // Add current timestamp if not present
    if (!parsed.accessTime) {
      parsed.accessTime = new Date().toISOString();
    }

    return parsed;
  } catch (error) {
    logger.error({ error }, "Failed to parse access context");
    // logger.error("Failed to parse access context:", error);
    return { accessTime: new Date().toISOString() };
  }
}

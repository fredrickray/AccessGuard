import { Router, Request, Response, NextFunction } from "express";
import authService from "@services/auth.service";
import logger from "@cores/logger";

const authRouter = Router();

/**
 * POST /auth/signup
 * Register a new user
 */
authRouter.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, roles } = req.body;

    const result = await authService.signup({
      username,
      email,
      password,
      roles,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login existing user
 */
authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    const result = await authService.login({
      username,
      password,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user profile (protected route)
 */
authRouter.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    user: req.user,
    message: "User profile retrieved successfully",
  });
});

export default authRouter;

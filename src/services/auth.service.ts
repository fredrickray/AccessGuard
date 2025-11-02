import jwt from "jsonwebtoken";
import User, { IUser } from "@models/User";
import * as settings from "@config/settings.json";
import logger from "@cores/logger";

interface SignupPayload {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

interface LoginPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    userId: string;
    username: string;
    email: string;
    roles: string[];
  };
  token?: string;
  error?: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    try {
      const { username, email, password, roles } = payload;

      // Validate input
      if (!username || !email || !password) {
        return {
          success: false,
          message: "Username, email, and password are required",
          error: "MISSING_FIELDS",
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        const field = existingUser.username === username ? "username" : "email";
        return {
          success: false,
          message: `User with this ${field} already exists`,
          error: "USER_EXISTS",
        };
      }

      // Create new user
      const newUser = new User({
        username,
        email,
        password,
        roles: roles || ["user"],
      });

      await newUser.save();

      logger.info(
        { userId: newUser._id, username },
        "✅ New user registered successfully"
      );

      // Generate JWT token
      const token = this.generateToken({
        userId: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        roles: newUser.roles,
      });

      return {
        success: true,
        message: "User registered successfully",
        user: {
          userId: newUser._id.toString(),
          username: newUser.username,
          email: newUser.email,
          roles: newUser.roles,
        },
        token,
      };
    } catch (error: any) {
      logger.error({ error }, "Signup error");
      return {
        success: false,
        message: "Failed to register user",
        error: error.message,
      };
    }
  }

  /**
   * Login existing user
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const { username, password } = payload;

      // Validate input
      if (!username || !password) {
        return {
          success: false,
          message: "Username and password are required",
          error: "MISSING_FIELDS",
        };
      }

      // Find user and include password field
      const user = await User.findOne({ username }).select("+password");

      if (!user) {
        logger.warn({ username }, "❌ Login failed: user not found");
        return {
          success: false,
          message: "Invalid username or password",
          error: "INVALID_CREDENTIALS",
        };
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn({ username }, "❌ Login failed: user is inactive");
        return {
          success: false,
          message: "User account is inactive",
          error: "USER_INACTIVE",
        };
      }

      // Compare passwords
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        logger.warn({ username }, "❌ Login failed: invalid password");
        return {
          success: false,
          message: "Invalid username or password",
          error: "INVALID_CREDENTIALS",
        };
      }

      logger.info({ userId: user._id, username }, "✅ User logged in successfully");

      // Generate JWT token
      const token = this.generateToken({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        roles: user.roles,
      });

      return {
        success: true,
        message: "Login successful",
        user: {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          roles: user.roles,
        },
        token,
      };
    } catch (error: any) {
      logger.error({ error }, "Login error");
      return {
        success: false,
        message: "Failed to login",
        error: error.message,
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      logger.error({ userId }, "Failed to get user by ID");
      return null;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<IUser[]> {
    try {
      return await User.find({ isActive: true }).select("-password");
    } catch (error) {
      logger.error({}, "Failed to get all users");
      return [];
    }
  }

  /**
   * Update user roles (admin only)
   */
  async updateUserRoles(userId: string, roles: string[]): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { roles },
        { new: true }
      );

      if (user) {
        logger.info({ userId, roles }, "✅ User roles updated");
      }

      return user;
    } catch (error) {
      logger.error({ userId }, "Failed to update user roles");
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: any): string {
    return jwt.sign(payload, settings.jwt.secret, {
      issuer: settings.jwt.issuer,
      expiresIn: "24h",
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, settings.jwt.secret, {
        issuer: settings.jwt.issuer,
      });
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();

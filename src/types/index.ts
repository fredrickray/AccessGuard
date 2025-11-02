// src/types/index.ts

import { Request } from "express";

export interface DecodedToken {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface DevicePosture {
  diskEncrypted: boolean;
  antivirus: boolean;
  osVersion?: string;
  isJailbroken?: boolean;
  lastSecurityUpdate?: string;
}

export interface AccessContext {
  impossibleTravel: boolean;
  country: string;
  city?: string;
  timezone?: string;
  ipReputation?: number;
  isVPN?: boolean;
  isTor?: boolean;
  accessTime?: string;
}

export interface RiskDecision {
  decision: "allow" | "mfa" | "block";
  riskScore: number;
  user: string;
  timestamp: Date;
  reason?: string;
}

export interface ProtectedResource {
  name: string;
  prefix: string;
  requiredRoles: string[];
  description?: string;
}

export interface RiskThresholds {
  allow: number;
  mfa: number;
  block: number;
}

export interface Settings {
  risk: RiskThresholds;
  maxFailedAttempts?: number;
  sessionTimeout?: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      accessDecision?: RiskDecision;
      devicePosture?: Partial<DevicePosture>;
      accessContext?: Partial<AccessContext>;
    }
  }
}

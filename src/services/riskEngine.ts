import * as settings from "@config/settings.json";
import { readFileSync } from "fs";
import { join } from "path";
import {
  DevicePosture,
  AccessContext,
  RiskThresholds,
  Settings,
} from "@type/index";

interface RiskEngineResponse {
  score: number;
  reason: string;
}

const evaluateRisk = async (
  userId: string,
  ipAddress: string,
  resource: string
): Promise<RiskEngineResponse> => {
  // Placeholder logic for risk evaluation
  let score = 0;
  let reason = "Low risk";

  // Simple heuristic: increase risk score for unknown IPs or sensitive resources
  if (ipAddress.startsWith("192.168.")) {
    score += 10;
    reason = "Accessing from internal network";
  }

  if (resource.includes("admin")) {
    score += 50;
    reason = "Accessing sensitive resource";
  }

  return { score, reason };
};

interface RiskFactor {
  name: string;
  weight: number;
  triggered: boolean;
}

class RiskEngine {
  public thresholds: RiskThresholds;
  private settings: Settings;

  constructor() {
    this.settings = this.loadSettings();
    this.thresholds = this.settings.risk;
  }

  private loadSettings(): Settings {
    try {
      const settingsPath = join(process.cwd(), "src/config", "settings.json");
      return JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Fallback defaults
      return {
        risk: { allow: 0.3, mfa: 0.6, block: 0.8 },
      };
    }
  }

  evaluate(
    ip: string | undefined,
    posture: Partial<DevicePosture>,
    context: Partial<AccessContext>
  ): number {
    const factors: RiskFactor[] = [];

    // Device Posture Checks (40% weight)
    if (!posture.diskEncrypted) {
      factors.push({ name: "Unencrypted disk", weight: 0.2, triggered: true });
    }

    if (!posture.antivirus) {
      factors.push({ name: "No antivirus", weight: 0.2, triggered: true });
    }

    if (posture.isJailbroken) {
      factors.push({ name: "Jailbroken device", weight: 0.3, triggered: true });
    }

    // Context Checks (60% weight)
    if (context.impossibleTravel) {
      factors.push({
        name: "Impossible travel detected",
        weight: 0.4,
        triggered: true,
      });
    }

    if (context.country && !this.isTrustedCountry(context.country)) {
      factors.push({
        name: "Untrusted country",
        weight: 0.15,
        triggered: true,
      });
    }

    if (context.isVPN || context.isTor) {
      factors.push({ name: "VPN/Tor detected", weight: 0.25, triggered: true });
    }

    if (context.ipReputation && context.ipReputation < 50) {
      factors.push({ name: "Low IP reputation", weight: 0.2, triggered: true });
    }

    // Time-based check
    if (this.isOutsideWorkHours(context.accessTime)) {
      factors.push({
        name: "Outside work hours",
        weight: 0.1,
        triggered: true,
      });
    }

    // Calculate total score
    const totalScore = factors.reduce((sum, factor) => sum + factor.weight, 0);

    // Cap at 1.0
    return Math.min(1, totalScore);
  }

  getRiskDecision(score: number): "allow" | "mfa" | "block" {
    if (score >= this.thresholds.block) return "block";
    if (score >= this.thresholds.mfa) return "mfa";
    return "allow";
  }

  private isTrustedCountry(country: string): boolean {
    const trustedCountries = ["NG", "US", "GB", "CA", "AU"]; // Can load from config
    return trustedCountries.includes(country.toUpperCase());
  }

  /**
   * Check if access is outside normal work hours (6 AM - 10 PM)
   */
  private isOutsideWorkHours(accessTime?: string): boolean {
    if (!accessTime) return false;

    const hour = new Date(accessTime).getHours();
    return hour < 6 || hour > 22;
  }

  /**
   * Reload settings from config
   */
  reloadSettings(): void {
    this.settings = this.loadSettings();
    this.thresholds = this.settings.risk;
  }
}

export default new RiskEngine();

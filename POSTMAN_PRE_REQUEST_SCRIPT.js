// Postman Pre-request Script for Risk Engine Testing
// Add this to your Collection or Request Pre-request tab

// Select which test scenario to run
const SCENARIO = "LOW_RISK"; // Change to: LOW_RISK, MEDIUM_RISK, HIGH_RISK, OUTSIDE_HOURS, JAILBROKEN

const scenarios = {
  LOW_RISK: {
    name: "Low Risk (Allow - Score ~0)",
    posture: {
      diskEncrypted: true,
      antivirus: true,
      isJailbroken: false,
    },
    context: {
      impossibleTravel: false,
      country: "NG",
      city: "Lagos",
      timezone: "Africa/Lagos",
      ipReputation: 95,
      isVPN: false,
      isTor: false,
      accessTime: new Date().toISOString(),
    },
  },

  MEDIUM_RISK: {
    name: "Medium Risk (MFA - Score ~0.45)",
    posture: {
      diskEncrypted: false,
      antivirus: false,
      isJailbroken: false,
    },
    context: {
      impossibleTravel: false,
      country: "CN",
      city: "Beijing",
      timezone: "Asia/Shanghai",
      ipReputation: 50,
      isVPN: true,
      isTor: false,
      accessTime: new Date().toISOString(),
    },
  },

  HIGH_RISK: {
    name: "High Risk (Block - Score ~0.85)",
    posture: {
      diskEncrypted: false,
      antivirus: false,
      isJailbroken: true,
    },
    context: {
      impossibleTravel: true,
      country: "KP",
      city: "Pyongyang",
      timezone: "Asia/Pyongyang",
      ipReputation: 20,
      isVPN: true,
      isTor: true,
      accessTime: new Date().toISOString(),
    },
  },

  OUTSIDE_HOURS: {
    name: "Outside Work Hours - Evening (Score ~0.1)",
    posture: {
      diskEncrypted: true,
      antivirus: true,
      isJailbroken: false,
    },
    context: {
      impossibleTravel: false,
      country: "NG",
      city: "Lagos",
      timezone: "Africa/Lagos",
      ipReputation: 90,
      isVPN: false,
      isTor: false,
      accessTime: new Date(new Date().setHours(23, 45, 0)).toISOString(),
    },
  },

  JAILBROKEN: {
    name: "Jailbroken Device Only (Score ~0.3)",
    posture: {
      diskEncrypted: true,
      antivirus: true,
      isJailbroken: true,
    },
    context: {
      impossibleTravel: false,
      country: "NG",
      city: "Lagos",
      timezone: "Africa/Lagos",
      ipReputation: 95,
      isVPN: false,
      isTor: false,
      accessTime: new Date().toISOString(),
    },
  },
};

// Get selected scenario
const scenario = scenarios[SCENARIO];

if (!scenario) {
  console.error(`❌ Invalid scenario: ${SCENARIO}`);
  console.log("Valid scenarios:", Object.keys(scenarios).join(", "));
  pm.request.headers.add({ key: "x-test-error", value: "Invalid scenario" });
} else {
  console.log(`✅ Running: ${scenario.name}`);

  // Set custom headers
  pm.request.headers.add({
    key: "x-device-posture",
    value: JSON.stringify(scenario.posture),
  });

  pm.request.headers.add({
    key: "x-access-context",
    value: JSON.stringify(scenario.context),
  });

  // Save scenario info to environment for reference
  pm.environment.set("current_test_scenario", scenario.name);
  pm.environment.set(
    "expected_risk_score",
    SCENARIO === "LOW_RISK"
      ? "0.0"
      : SCENARIO === "JAILBROKEN"
      ? "0.3"
      : SCENARIO === "OUTSIDE_HOURS"
      ? "0.1"
      : SCENARIO === "MEDIUM_RISK"
      ? "0.45"
      : "0.85"
  );

  console.log("Headers set:");
  console.log("  x-device-posture:", JSON.stringify(scenario.posture));
  console.log("  x-access-context:", JSON.stringify(scenario.context));
}

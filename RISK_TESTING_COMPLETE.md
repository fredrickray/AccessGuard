# ✅ Risk Engine Testing Setup Complete

## What Was the Problem?

When you tested the API, the `devicePosture` and `accessContext` were empty objects in the logs:

```
Parsed posture: {}
Parsed context: { accessTime: '...' }  // Only accessTime
```

This meant the risk engine always scored requests with **0.0 risk** because no risk factors were being evaluated.

---

## The Solution

The risk data needs to be sent via **custom HTTP headers** that your API expects:

1. **`x-device-posture`** - Device security information
2. **`x-access-context`** - Access context and environmental data

The middleware automatically parses these headers and feeds them to the risk engine.

---

## Quick Start - 3 Ways to Test

### 🚀 Option 1: Import Postman Collection (Easiest)

1. Download: `Access-Guard-Risk-Testing.postman_collection.json`
2. In Postman: **File → Import** → Select the file
3. Click **Login** to get a token
4. Run any risk test request (Low Risk, Medium Risk, etc.)
5. Check the response and server logs

**Benefits**:

- Pre-configured requests
- Automatic header injection
- Built-in test assertions
- Can change scenarios easily

---

### 💻 Option 2: cURL Script (Fastest for CLI)

```bash
cd /Users/fredrickanyanwu/Documents/access-guard
bash test-risk-scenarios.sh
```

This will run 5 different risk scenarios automatically and show you the results.

---

### 📝 Option 3: Manual Postman Request

1. Create a new GET request to `/api/banking/dashboard`
2. Go to **Headers** tab
3. Add these two headers:
   ```
   x-device-posture: {"diskEncrypted":false,"antivirus":false,"isJailbroken":true}
   x-access-context: {"impossibleTravel":true,"country":"US","ipReputation":30,"isVPN":true}
   ```
4. Send and check the response

---

## Key Changes Made

### 1. Enhanced Logging in `accessGuard.ts`

Now logs parsed risk data and risk evaluation results:

```json
{
  "devicePosture": {"diskEncrypted": false, "antivirus": false},
  "accessContext": {"country": "US", "ipReputation": 30}
}
{
  "riskScore": 0.45,
  "decision": "mfa",
  "threshold_allow": 0.3,
  "threshold_mfa": 0.6
}
```

### 2. Cleaned Up Logs

Removed debug `console.log()` statements from `policy.service.ts`

### 3. Documentation Created

- ✅ `RISK_ENGINE_TESTING.md` - Comprehensive guide with all scenarios
- ✅ `RISK_TESTING_QUICK_START.md` - Quick reference
- ✅ `POSTMAN_PRE_REQUEST_SCRIPT.js` - Ready-to-use script
- ✅ `test-risk-scenarios.sh` - cURL testing script
- ✅ `Access-Guard-Risk-Testing.postman_collection.json` - Postman collection

---

## Test Scenarios Included

| Scenario      | Expected Score | HTTP Status | Use Case                           |
| ------------- | -------------- | ----------- | ---------------------------------- |
| Low Risk      | 0.0            | ✅ 200      | Secure device, trusted location    |
| Medium Risk   | 0.45           | 🔐 401      | Missing security, VPN detected     |
| High Risk     | 0.85           | ❌ 403      | Multiple red flags, block access   |
| Outside Hours | 0.1            | ✅ 200      | Evening access on secure device    |
| Jailbroken    | 0.3            | ✅ 200      | Only device issue, context is good |

---

## What Risk Factors Are Being Evaluated?

### Device Posture (40% weight)

- `diskEncrypted`: Is the device's disk encrypted?
- `antivirus`: Is antivirus software installed?
- `isJailbroken`: Is the device rooted/jailbroken?

### Access Context (60% weight)

- `impossibleTravel`: Suspicious travel patterns
- `country`: Country of access (trusted list: NG, US, GB, CA, AU)
- `ipReputation`: IP reputation score (0-100)
- `isVPN`: VPN detected
- `isTor`: Tor network detected
- `accessTime`: Time of access (for work hours check)

---

## Expected Responses

### ✅ Allow (HTTP 200)

```json
{
  "user": "ajebodev",
  "balance": 150000,
  "riskScore": 0.0,
  "decision": "allow"
}
```

### 🔐 MFA Required (HTTP 401)

```json
{
  "message": "Unauthorized",
  "details": {
    "message": "Step-Up Authentication Required",
    "riskScore": 0.45,
    "mfaRequired": true
  }
}
```

### ❌ Block (HTTP 403)

```json
{
  "message": "Access Denied",
  "details": {
    "message": "High-risk activity detected - access blocked",
    "riskScore": 0.85,
    "contactSupport": true
  }
}
```

---

## Server Logs to Expect

When you send a request with risk data, monitor these logs:

```
[TIME] INFO: Parsed risk data from headers
    devicePosture: { diskEncrypted: false, antivirus: false, isJailbroken: true }
    accessContext: { impossibleTravel: true, country: "US", ipReputation: 30 }

[TIME] INFO: Risk evaluation result
    riskScore: 0.85
    decision: "block"
    threshold_allow: 0.3
    threshold_mfa: 0.6
    threshold_block: 0.8

[TIME] INFO: Access decision logged
    user: "ajebodev"
    path: "/banking/dashboard"
    decision: "block"
```

If you see **empty objects**, the headers aren't being received:

1. Check header names (lowercase with hyphens)
2. Verify JSON is valid (no trailing commas, proper quotes)
3. Make sure Postman isn't overriding at collection level

---

## Testing Checklist

- [ ] Run `bash test-risk-scenarios.sh` and verify all 5 scenarios
- [ ] Or import Postman collection and run requests
- [ ] Check server logs for "Parsed risk data from headers"
- [ ] Verify riskScores match expectations (0.0, 0.45, 0.85, etc.)
- [ ] Verify HTTP status codes match decisions (200, 401, 403)
- [ ] Confirm empty posture/context logs are gone

---

## Next Steps

1. **Test all scenarios** to understand how risk factors affect scores
2. **Implement MFA UI** to handle 401 responses (MFA Required)
3. **Add device telemetry** to collect real device posture data from clients
4. **Monitor IP reputation** via third-party APIs for production
5. **Fine-tune thresholds** in `settings.json` based on your security needs

---

## Files Ready to Use

```
/Documents/access-guard/
├── RISK_ENGINE_TESTING.md                        # 📖 Comprehensive guide
├── RISK_TESTING_QUICK_START.md                   # ⚡ Quick reference
├── POSTMAN_PRE_REQUEST_SCRIPT.js                 # 🔧 Copy to Postman
├── test-risk-scenarios.sh                        # 🚀 Run with: bash test-risk-scenarios.sh
└── Access-Guard-Risk-Testing.postman_collection.json  # 📦 Import into Postman
```

---

## Support

**Issue**: Headers not being parsed

- ✅ Check header names are exactly `x-device-posture` and `x-access-context`
- ✅ Check JSON is valid: `{"key":"value","key2":"value2"}`
- ✅ Check Authorization header has valid JWT token

**Issue**: Always getting riskScore 0

- ✅ Are you sending the custom headers?
- ✅ Check server logs for "Parsed risk data from headers"
- ✅ Verify headers aren't empty objects in the logs

**Issue**: Want to adjust risk thresholds

- ✅ Edit `src/config/settings.json` to change `allow`, `mfa`, `block` values
- ✅ Restart the server for changes to take effect

---

**Ready to test! Pick your preferred method above and run a scenario.** 🚀

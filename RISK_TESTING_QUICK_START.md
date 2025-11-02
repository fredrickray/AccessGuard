# Risk Engine Testing - Quick Start

## Problem Summary

Currently, when testing the API, the device posture and access context headers are not being parsed, so the risk engine always evaluates with empty data (resulting in a risk score of 0).

**Logs show**:

```
Parsed posture: {}
Parsed context: { accessTime: '...' }  // Only accessTime populated
```

## Solution: Send Risk Data via Custom Headers

The API expects risk data in **two custom HTTP headers**:

### Header 1: Device Posture

```
x-device-posture: {"diskEncrypted":true,"antivirus":false,"isJailbroken":false}
```

### Header 2: Access Context

```
x-access-context: {"country":"US","ipReputation":50,"isVPN":true,"accessTime":"2025-11-27T09:00:00Z"}
```

## Quick Testing Methods

### Method 1: Using cURL (Fastest)

```bash
#!/bin/bash
TOKEN="your_jwt_token"

curl -X GET http://localhost:3000/api/banking/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H 'x-device-posture: {"diskEncrypted":false,"antivirus":false,"isJailbroken":true}' \
  -H 'x-access-context: {"impossibleTravel":true,"country":"US","ipReputation":30,"isVPN":true}' \
  | jq '.'
```

**Or use the provided script**:

```bash
cd /Users/fredrickanyanwu/Documents/access-guard
bash test-risk-scenarios.sh
```

---

### Method 2: Using Postman (Easiest UI)

**Option A: Pre-request Script (Recommended)**

1. Open your request in Postman
2. Click the **Pre-request Script** tab
3. Copy the contents from `POSTMAN_PRE_REQUEST_SCRIPT.js`
4. Paste into the pre-request script box
5. Change the `SCENARIO` variable to test different scenarios:
   - `LOW_RISK` (score ~0)
   - `MEDIUM_RISK` (score ~0.45)
   - `HIGH_RISK` (score ~0.85)
   - `OUTSIDE_HOURS` (score ~0.1)
   - `JAILBROKEN` (score ~0.3)
6. Send the request

**Option B: Manual Headers**

1. Go to **Headers** tab
2. Add these two custom headers:
   - `x-device-posture`: `{"diskEncrypted":false,"antivirus":false,"isJailbroken":true}`
   - `x-access-context`: `{"country":"US","ipReputation":30,"isVPN":true}`
3. Send the request

---

## What to Expect

### Low Risk (Allow) - HTTP 200

```json
{
  "user": "ajebodev",
  "balance": 150000,
  "riskScore": 0.0,
  "decision": "allow"
}
```

### Medium Risk (MFA) - HTTP 401

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

### High Risk (Block) - HTTP 403

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

## Server Logs - What to Look For

When you send a request with risk data, you should see these logs:

```
[TIME] INFO: Parsed risk data from headers
    devicePosture: {
      "diskEncrypted": false,
      "antivirus": false,
      "isJailbroken": true
    }
    accessContext: {
      "impossibleTravel": true,
      "country": "US",
      "ipReputation": 30,
      "isVPN": true,
      "accessTime": "2025-11-27T09:30:00Z"
    }

[TIME] INFO: Risk evaluation result
    riskScore: 0.85
    decision: "block"
    threshold_allow: 0.3
    threshold_mfa: 0.6
    threshold_block: 0.8
```

If you see **empty objects**, the headers aren't being received correctly:

- ❌ Check header names (lowercase, with hyphens)
- ❌ Check JSON format (must be valid JSON)
- ❌ Check Postman collection-level settings aren't overriding headers

---

## Test Scenarios Overview

| Scenario          | Device                           | Context                               | Expected Score | Decision    |
| ----------------- | -------------------------------- | ------------------------------------- | -------------- | ----------- |
| **Low Risk**      | ✅ Encrypted, AV, Not Jailbroken | ✅ NG, High IP Rep, No VPN            | 0.0            | Allow (200) |
| **Medium Risk**   | ❌ No Encryption/AV              | ⚠️ CN, Medium IP Rep, VPN             | 0.45           | MFA (401)   |
| **High Risk**     | ❌ Jailbroken                    | ❌ Impossible Travel, Tor, Low IP Rep | 0.85           | Block (403) |
| **Outside Hours** | ✅ Secure                        | ⚠️ Evening Access (after 22:00)       | 0.1            | Allow (200) |
| **Jailbroken**    | ❌ Jailbroken Only               | ✅ Good Context                       | 0.3            | Allow (200) |

---

## Debugging Checklist

- [ ] Did you get a **valid JWT token** from login?
- [ ] Are headers exactly named `x-device-posture` and `x-access-context`?
- [ ] Is the header value valid JSON with no spaces around `:` and `,`?
- [ ] Are you seeing "Parsed risk data from headers" in server logs?
- [ ] Does the riskScore in logs match your expectations?
- [ ] Is the HTTP status code matching the decision (200 for allow, 401 for mfa, 403 for block)?

---

## Risk Score Calculation Reference

### Device Posture (max 0.7)

- Unencrypted disk: +0.2
- No antivirus: +0.2
- Jailbroken: +0.3

### Access Context (max 1.1, capped at 1.0)

- Impossible travel: +0.4
- Untrusted country: +0.15
- VPN/Tor: +0.25
- Low IP reputation: +0.2
- Outside work hours: +0.1

**Example**: Jailbroken (0.3) + VPN (0.25) + Outside hours (0.1) = **0.65** → MFA

---

## Files Created/Updated

- ✅ `RISK_ENGINE_TESTING.md` - Comprehensive testing guide
- ✅ `test-risk-scenarios.sh` - cURL script for testing
- ✅ `POSTMAN_PRE_REQUEST_SCRIPT.js` - Postman pre-request script
- ✅ `src/middlewares/accessGuard.ts` - Added detailed logging
- ✅ `src/services/policy.service.ts` - Removed debug logs

---

## Next Steps

1. **Test Low Risk scenario** - Verify you get HTTP 200 with riskScore 0.0
2. **Test Medium Risk scenario** - Verify you get HTTP 401 with riskScore ~0.45
3. **Test High Risk scenario** - Verify you get HTTP 403 with riskScore ~0.85
4. **Check server logs** - Ensure "Parsed risk data" logs show actual values (not empty objects)
5. **Implement MFA flow** - Once MFA responses work, you can build the MFA challenge UI

Run the tests and let me know what scores you're getting!

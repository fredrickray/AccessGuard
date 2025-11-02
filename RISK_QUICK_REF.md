# Risk Engine Testing - One-Page Reference

## The Problem
Risk data (device posture & access context) wasn't being sent to the API, so risk scoring was always 0.

## The Solution
Send risk data via custom HTTP headers:
- `x-device-posture`: Device security info
- `x-access-context`: Access environment info

---

## Quick Test Commands

### cURL - All 5 Scenarios
```bash
bash test-risk-scenarios.sh
```

### cURL - Single Low Risk Test
```bash
curl -X GET http://localhost:3000/api/banking/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H 'x-device-posture: {"diskEncrypted":true,"antivirus":true,"isJailbroken":false}' \
  -H 'x-access-context: {"country":"NG","ipReputation":95,"isVPN":false}'
```

### Postman - Import Collection
File → Import → Select `Access-Guard-Risk-Testing.postman_collection.json`

---

## Risk Factors & Scores

| Factor | Weight | Impact |
|--------|--------|--------|
| Disk not encrypted | 0.2 | Device security |
| No antivirus | 0.2 | Device security |
| Jailbroken device | 0.3 | Device security |
| Impossible travel | 0.4 | Behavior anomaly |
| Untrusted country | 0.15 | Geographic |
| VPN/Tor | 0.25 | Network |
| Low IP reputation | 0.2 | IP quality |
| Outside work hours | 0.1 | Time-based |

**Thresholds**:
- Score < 0.3 → ✅ **Allow** (200)
- Score 0.3-0.6 → 🔐 **MFA** (401)
- Score ≥ 0.8 → ❌ **Block** (403)

---

## Test Scenarios (Expected Scores)

### Low Risk (0.0)
- Device: Encrypted ✅, AV ✅, Not jailbroken ✅
- Context: NG, High IP Rep, No VPN
- Response: HTTP 200, riskScore 0.0

### Medium Risk (0.45)
- Device: No encryption ❌, No AV ❌
- Context: CN, Medium IP Rep, VPN ⚠️
- Response: HTTP 401, mfaRequired: true

### High Risk (0.85)
- Device: Jailbroken ❌
- Context: Impossible travel ❌, Tor ❌, Low IP Rep ❌
- Response: HTTP 403, contactSupport: true

### Jailbroken (0.3)
- Device: Jailbroken only ❌
- Context: Good (NG, High IP Rep, No VPN)
- Response: HTTP 200, riskScore 0.3

### Outside Hours (0.1)
- Device: Secure ✅
- Context: Evening (23:45) ⚠️
- Response: HTTP 200, riskScore 0.1

---

## Server Logs to Watch

```
Parsed risk data from headers
  devicePosture: { diskEncrypted: false, antivirus: false, isJailbroken: true }
  accessContext: { country: "US", ipReputation: 30, isVPN: true }

Risk evaluation result
  riskScore: 0.85
  decision: "block"
  threshold_allow: 0.3
  threshold_mfa: 0.6
  threshold_block: 0.8
```

---

## Response Examples

### ✅ Allow (200)
```json
{
  "user": "ajebodev",
  "balance": 150000,
  "riskScore": 0.0,
  "decision": "allow"
}
```

### 🔐 MFA (401)
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

### ❌ Block (403)
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

## Debugging

**Seeing empty posture/context?**
- ❌ Check header names (case-sensitive, lowercase)
- ❌ Validate JSON format (no spaces around colons)
- ❌ Check Authorization header has valid token
- ❌ Check Postman isn't overriding at collection level

**Postman pre-request script to autoload headers?**
```javascript
const scenario = {
  posture: { diskEncrypted: false, antivirus: false, isJailbroken: true },
  context: { country: "US", ipReputation: 30, isVPN: true }
};

pm.request.headers.add({
  key: 'x-device-posture',
  value: JSON.stringify(scenario.posture)
});

pm.request.headers.add({
  key: 'x-access-context',
  value: JSON.stringify(scenario.context)
});
```

---

## Files Available

| File | Purpose |
|------|---------|
| `test-risk-scenarios.sh` | Run 5 scenarios with cURL |
| `POSTMAN_PRE_REQUEST_SCRIPT.js` | Copy to Postman pre-request tab |
| `Access-Guard-Risk-Testing.postman_collection.json` | Import into Postman |
| `RISK_ENGINE_TESTING.md` | Full documentation |
| `RISK_TESTING_QUICK_START.md` | Quick start guide |

---

## Next: Test It!

1. ✅ Run `bash test-risk-scenarios.sh` OR
2. ✅ Import Postman collection and run requests
3. ✅ Monitor server logs for parsed risk data
4. ✅ Verify riskScores and HTTP status codes match expectations

Done! 🚀

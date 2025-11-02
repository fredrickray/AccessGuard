# Risk Engine Testing Guide

## Overview

The risk engine evaluates access based on:

1. **Device Posture** (40% weight)

   - `diskEncrypted`: Device has disk encryption
   - `antivirus`: Antivirus software installed
   - `isJailbroken`: Device is rooted/jailbroken

2. **Access Context** (60% weight)
   - `impossibleTravel`: Suspicious travel patterns detected
   - `country`: Country code (e.g., "NG", "US")
   - `city`: City name
   - `timezone`: Timezone
   - `ipReputation`: IP reputation score (0-100)
   - `isVPN`: VPN detected
   - `isTor`: Tor network detected
   - `accessTime`: ISO timestamp for work hours check

## Risk Thresholds (from settings.json)

- **Allow**: score < 0.3
- **MFA Required**: 0.3 ≤ score < 0.6
- **Block**: score ≥ 0.8

## How to Send Risk Data via Postman

Risk data is sent in **custom headers** to the API:

### 1. Device Posture Header

**Header Name**: `x-device-posture`
**Header Value**: JSON string

```json
{
  "diskEncrypted": false,
  "antivirus": false,
  "isJailbroken": true,
  "osVersion": "15.1",
  "lastSecurityUpdate": "2025-11-15"
}
```

### 2. Access Context Header

**Header Name**: `x-access-context`
**Header Value**: JSON string

```json
{
  "impossibleTravel": true,
  "country": "US",
  "city": "New York",
  "timezone": "America/New_York",
  "ipReputation": 30,
  "isVPN": false,
  "isTor": false,
  "accessTime": "2025-11-27T23:30:00Z"
}
```

## Test Scenarios

### Test 1: Low Risk (Allow)

**Expected Score**: ~0 (everything normal)

**Device Posture Header**:

```json
{
  "diskEncrypted": true,
  "antivirus": true,
  "isJailbroken": false
}
```

**Access Context Header**:

```json
{
  "impossibleTravel": false,
  "country": "NG",
  "city": "Lagos",
  "timezone": "Africa/Lagos",
  "ipReputation": 95,
  "isVPN": false,
  "isTor": false,
  "accessTime": "2025-11-27T09:00:00Z"
}
```

**Expected Result**: ✅ **Allow** (riskScore: 0.0)

---

### Test 2: Medium Risk (MFA Required)

**Expected Score**: ~0.45 (multiple risk factors)

**Device Posture Header**:

```json
{
  "diskEncrypted": false,
  "antivirus": false,
  "isJailbroken": false
}
```

**Access Context Header**:

```json
{
  "impossibleTravel": false,
  "country": "CN",
  "city": "Beijing",
  "timezone": "Asia/Shanghai",
  "ipReputation": 50,
  "isVPN": true,
  "isTor": false,
  "accessTime": "2025-11-27T02:00:00Z"
}
```

**Expected Result**: 🔐 **MFA Required** (riskScore: ~0.45)

---

### Test 3: High Risk (Block)

**Expected Score**: ~0.85+ (severe risk factors)

**Device Posture Header**:

```json
{
  "diskEncrypted": false,
  "antivirus": false,
  "isJailbroken": true
}
```

**Access Context Header**:

```json
{
  "impossibleTravel": true,
  "country": "KP",
  "city": "Pyongyang",
  "timezone": "Asia/Pyongyang",
  "ipReputation": 20,
  "isVPN": true,
  "isTor": true,
  "accessTime": "2025-11-27T03:00:00Z"
}
```

**Expected Result**: ❌ **Block** (riskScore: ~0.85)

---

### Test 4: Outside Work Hours (Medium-Low Risk)

**Expected Score**: ~0.1

**Device Posture Header**:

```json
{
  "diskEncrypted": true,
  "antivirus": true,
  "isJailbroken": false
}
```

**Access Context Header**:

```json
{
  "impossibleTravel": false,
  "country": "NG",
  "city": "Lagos",
  "timezone": "Africa/Lagos",
  "ipReputation": 90,
  "isVPN": false,
  "isTor": false,
  "accessTime": "2025-11-27T23:45:00Z"
}
```

**Expected Result**: 🔐 **MFA Required** (riskScore: ~0.1 - just outside work hours)

- Triggered: Outside work hours (22:45, work hours are 6 AM - 10 PM)

---

## How to Test in Postman

### Step 1: Set Up Pre-request Script

Create a **Pre-request Script** in your Postman collection or request:

```javascript
// Risk data for testing
const devicePosture = {
  diskEncrypted: false,
  antivirus: false,
  isJailbroken: true,
  osVersion: "15.1",
  lastSecurityUpdate: "2025-11-15",
};

const accessContext = {
  impossibleTravel: true,
  country: "US",
  city: "New York",
  timezone: "America/New_York",
  ipReputation: 30,
  isVPN: false,
  isTor: false,
  accessTime: new Date().toISOString(),
};

// Set custom headers
pm.request.headers.add({
  key: "x-device-posture",
  value: JSON.stringify(devicePosture),
});

pm.request.headers.add({
  key: "x-access-context",
  value: JSON.stringify(accessContext),
});
```

### Step 2: Alternative - Manual Header Entry

If you prefer not to use pre-request scripts:

1. Go to **Headers** tab in Postman
2. Add custom headers manually:
   - `x-device-posture`: `{"diskEncrypted":false,"antivirus":false,"isJailbroken":true}`
   - `x-access-context`: `{"impossibleTravel":true,"country":"US","ipReputation":30,"isVPN":true}`

### Step 3: Send Request

```
GET /api/banking/dashboard
Authorization: Bearer {{token}}
x-device-posture: {"diskEncrypted":false,"antivirus":false,"isJailbroken":true}
x-access-context: {"impossibleTravel":true,"country":"US","ipReputation":30,"isVPN":true}
```

### Step 4: Check Response

```json
{
  "message": "Unauthorized",
  "details": {
    "message": "Step-Up Authentication Required",
    "mfaRequired": true,
    "riskScore": 0.45
  }
}
```

---

## Risk Score Calculation Reference

### Device Posture Weights

- Unencrypted disk: +0.2
- No antivirus: +0.2
- Jailbroken device: +0.3
- **Subtotal max: 0.7**

### Access Context Weights

- Impossible travel: +0.4
- Untrusted country (not NG, US, GB, CA, AU): +0.15
- VPN/Tor detected: +0.25
- Low IP reputation (<50): +0.2
- Outside work hours (before 6 AM or after 10 PM): +0.1
- **Subtotal max: 1.1** (capped at 1.0)

---

## Complete Postman Collection Template

```json
{
  "name": "Risk Engine Testing",
  "item": [
    {
      "name": "Low Risk - Allow",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "x-device-posture",
            "value": "{\"diskEncrypted\":true,\"antivirus\":true,\"isJailbroken\":false}"
          },
          {
            "key": "x-access-context",
            "value": "{\"impossibleTravel\":false,\"country\":\"NG\",\"ipReputation\":95,\"isVPN\":false,\"isTor\":false,\"accessTime\":\"2025-11-27T09:00:00Z\"}"
          }
        ],
        "url": "http://localhost:3000/api/banking/dashboard"
      }
    },
    {
      "name": "Medium Risk - MFA",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "x-device-posture",
            "value": "{\"diskEncrypted\":false,\"antivirus\":false,\"isJailbroken\":false}"
          },
          {
            "key": "x-access-context",
            "value": "{\"impossibleTravel\":false,\"country\":\"CN\",\"ipReputation\":50,\"isVPN\":true,\"isTor\":false,\"accessTime\":\"2025-11-27T02:00:00Z\"}"
          }
        ],
        "url": "http://localhost:3000/api/banking/dashboard"
      }
    },
    {
      "name": "High Risk - Block",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "x-device-posture",
            "value": "{\"diskEncrypted\":false,\"antivirus\":false,\"isJailbroken\":true}"
          },
          {
            "key": "x-access-context",
            "value": "{\"impossibleTravel\":true,\"country\":\"KP\",\"ipReputation\":20,\"isVPN\":true,\"isTor\":true,\"accessTime\":\"2025-11-27T03:00:00Z\"}"
          }
        ],
        "url": "http://localhost:3000/api/banking/dashboard"
      }
    }
  ]
}
```

---

## Debugging Tips

### If posture/context are still empty objects:

1. **Check header names** - Must be exactly `x-device-posture` and `x-access-context` (lowercase, with hyphens)

2. **Check header format** - Value must be valid JSON string:

   ```
   // ✅ Correct
   {"diskEncrypted":true,"antivirus":false}

   // ❌ Wrong
   {diskEncrypted: true, antivirus: false}  // Single quotes, spaces
   ```

3. **Add logging** - In `accessGuard.ts`, temporarily add:

   ```typescript
   console.log("Raw headers:", req.headers);
   console.log("Parsed posture:", posture);
   console.log("Parsed context:", context);
   ```

4. **Test with curl**:
   ```bash
   curl -X GET http://localhost:3000/api/banking/dashboard \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-device-posture: {\"diskEncrypted\":false,\"antivirus\":false,\"isJailbroken\":true}" \
     -H "x-access-context: {\"impossibleTravel\":true,\"country\":\"US\",\"ipReputation\":30}"
   ```

---

## Expected HTTP Responses

### ✅ Low Risk (Allow - 200)

```json
{
  "data": {
    "user": "ajebodev",
    "balance": 150000,
    "riskScore": 0.0,
    "decision": "allow"
  }
}
```

### 🔐 Medium Risk (MFA - 401)

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

### ❌ High Risk (Block - 403)

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

## Next Steps

1. ✅ Create test requests in Postman for each risk scenario
2. ✅ Run each test and verify the risk scores match expectations
3. ✅ Monitor server logs to see which risk factors are being triggered
4. ✅ Once confident, integrate MFA flow for "mfa" decision responses

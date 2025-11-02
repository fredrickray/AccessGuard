# 🔐 JWT Authentication - Route Protection Guide

## ✅ What's Now Fixed

The auth middleware (`zeroTrustGuard`) is now properly protecting all `/api/*` routes by being registered **BEFORE** the routes themselves.

---

## 📊 Route Protection Map

### 🟢 PUBLIC ROUTES (No JWT Required)
```
GET  /api/health              ✅ No auth needed - health check
POST /auth/signup             ✅ No auth needed - create new user
POST /auth/login              ✅ No auth needed - authenticate user
```

### 🔴 PROTECTED ROUTES (JWT Required)
```
GET  /auth/me                 ✅ JWT required - get user profile

GET  /api/banking/dashboard   ✅ JWT + banker role required
GET  /api/banking/transactions ✅ JWT + banker role required
POST /api/banking/transfer    ✅ JWT + banker role required

GET  /api/hr/employees        ✅ JWT + hr role required
GET  /api/hr/payroll          ✅ JWT + hr role required

GET  /api/admin/users         ✅ JWT + admin role required
GET  /api/admin/system        ✅ JWT + admin role required
GET  /api/reports/financial   ✅ JWT + analyst/manager/admin role required

GET  /admin/dashboard         ✅ JWT + admin role required
GET  /admin/logs              ✅ JWT + admin role required
GET  /admin/policies          ✅ JWT + admin role required
PUT  /admin/policies          ✅ JWT + admin role required
```

---

## 🔄 How JWT Protection Works Now

### Request Flow:

```
Request arrives
    ↓
Check path
    ↓
Is it `/auth/*` ?
  ├─→ YES: Go directly to auth route (No JWT check)
  │
  └─→ NO: Continue to next middleware
         ↓
Is it `/api/*` ?
  ├─→ YES: Apply zeroTrustGuard middleware
  │         ├─ Check for JWT token in Authorization header
  │         ├─ Validate JWT signature & issuer
  │         ├─ Check user roles vs required roles
  │         ├─ Evaluate risk score
  │         └─ Allow/MFA/Block decision
  │
  └─→ NO: Check other routes (proxy, admin, etc.)
```

---

## 🧪 Test JWT Protection Now

### Test 1: Try Without JWT (Should FAIL ❌)

**Request:**
```
GET http://localhost:7777/api/banking/dashboard
```

**No Authorization Header**

**Expected Response (401 Unauthorized):**
```json
{
  "error": "User not authenticated",
  "message": "User not authenticated"
}
```

---

### Test 2: With JWT (Should SUCCEED ✅)

**First, Login:**
```
POST http://localhost:7777/auth/login

Body:
{
  "username": "banker1",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy token, then:**
```
GET http://localhost:7777/api/banking/dashboard

Header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "app": "Banking Dashboard",
  "user": "banker1",
  "riskScore": 0.15,
  "data": { ... }
}
```

---

## 🔍 Where Auth Middleware is Used

### 1. **Server Route Registration** (`src/server.ts`)
```typescript
routes() {
  // ❌ Public - registered FIRST (no auth)
  this.app.use("/auth", authRouter);

  // ✅ Auth Guard - registered SECOND (protects everything after)
  this.app.use("/api", zeroTrustGuard);

  // ✅ Protected - comes after guard
  this.app.use("/api", demoAppRouter);
  this.app.use("/api/admin", adminRouter);
}
```

### 2. **Auth Middleware** (`src/middlewares/auth.middleware.ts`)
- `verifyJwt()` - Validates JWT token from Authorization header
- Used by `zeroTrustGuard` to extract user info

### 3. **Zero Trust Guard** (`src/middlewares/accessGuard.ts`)
- `zeroTrustGuard()` - Main middleware that enforces JWT + risk assessment
- Checks if path is in protected resources
- Validates JWT
- Checks user roles
- Evaluates risk score
- Enforces decisions (allow/mfa/block)

### 4. **Role Guard** (`src/middlewares/accessGuard.ts`)
- `roleGuard()` - Specific role checking (used in admin routes)

---

## 🔑 JWT Token Structure

Your JWT is composed of:

```
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "65a7b8c9d1e2f3g4h5i6j7k8",
  "username": "banker1",
  "email": "banker1@bank.com",
  "roles": ["banker"],
  "iat": 1701001445,
  "exp": 1701087845,
  "iss": "accessguard"
}
```

**Signature:**
- Signed with secret: `"demo-secret"` (from `settings.json`)
- Algorithm: HMAC-SHA256

---

## 🛡️ Error Scenarios

### Scenario 1: Missing JWT Header

**Request:**
```
GET /api/banking/dashboard
(No Authorization header)
```

**Response (401):**
```json
{
  "error": "User not authenticated"
}
```

---

### Scenario 2: Invalid Token

**Request:**
```
GET /api/banking/dashboard
Authorization: Bearer invalid.token.here
```

**Response (401):**
```json
{
  "error": "User not authenticated"
}
```

---

### Scenario 3: Insufficient Role

**Request:**
```
GET /api/banking/dashboard
Authorization: Bearer {{admin_token}}
(Admin trying to access banker endpoint)
```

**Response (403):**
```json
{
  "error": "User does not have required roles for this resource"
}
```

---

### Scenario 4: High Risk Score

**Request:**
```
GET /api/banking/dashboard
Authorization: Bearer {{token}}
x-device-posture: {"diskEncrypted": false, "isJailbroken": true}
x-access-context: {"country": "RU", "impossibleTravel": true, "isVPN": true}
```

**Response (401 or 403):**
```json
{
  "error": "Step-Up Authentication Required",
  "message": "Additional verification needed due to elevated risk",
  "riskScore": 0.95,
  "mfaRequired": true
}
```

---

## 📋 Quick Checklist

- ✅ Auth routes are public (`/auth/login`, `/auth/signup`)
- ✅ API routes are protected (`/api/*`)
- ✅ JWT is validated on every protected request
- ✅ Roles are checked based on resource config
- ✅ Risk engine evaluates device/context
- ✅ Proper error messages for each failure
- ✅ Error handlers catch all exceptions

---

## 🚀 Your Setup is Now Complete!

The JWT authentication middleware is properly protecting your API. Try making requests without a token to see it work! 🔐


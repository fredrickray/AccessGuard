# 🧪 Zero Trust Guard - Testing Guide

## Test Setup

### Test 1: Request WITHOUT JWT (Should FAIL ❌)

In Postman:

1. Uncheck the **Authorization** header completely
2. Make sure `{{jwt_token}}` is NOT in the value
3. Request: `GET http://localhost:7777/api/banking/dashboard`
4. Click Send

### Expected Response:

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### Expected Server Logs:

```
🔐 ZERO TRUST GUARD CHECK
📍 Path: /api/banking/dashboard
📌 Full URL: GET /api/banking/dashboard
🔍 Resource found: Banking Operations
🛡️ Path IS protected, requiring roles: [ 'hr', 'banker' ]
🔑 Authorization header: ❌ Missing
❌ JWT verification FAILED - throwing Unauthorized

❌ ERROR in Zero Trust Guard: User not authenticated
```

---

## Test 2: Request WITH JWT (Should SUCCEED ✅)

### Step 1: Login First

```
POST http://localhost:7777/auth/login

Body:
{
  "username": "banker1",
  "password": "password123"
}
```

**Save the token!**

### Step 2: Use Token

1. Check the **Authorization** header
2. Set value to: `Bearer {{jwt_token}}` (OR paste actual token)
3. Request: `GET http://localhost:7777/api/banking/dashboard`
4. Click Send

### Expected Response:

```json
{
  "app": "Banking Dashboard",
  "user": "banker1",
  "riskScore": 0.15,
  "data": { ... }
}
```

### Expected Server Logs:

```
🔐 ZERO TRUST GUARD CHECK
📍 Path: /api/banking/dashboard
📌 Full URL: GET /api/banking/dashboard
🔍 Resource found: Banking Operations
🛡️ Path IS protected, requiring roles: [ 'hr', 'banker' ]
🔑 Authorization header: ✅ Present
✅ JWT verified for user: banker1
👤 User roles: [ 'banker' ]
🔐 Required roles: [ 'hr', 'banker' ]
✅ User has required roles
📊 Risk Score: 0.15
🎯 Decision: allow
✅ ACCESS ALLOWED
```

---

## 🎯 Key Points to Check

1. **Authorization header checkbox**

   - ☑️ Checked = Header is sent
   - ☐ Unchecked = Header is NOT sent

2. **Authorization header value**

   - Should be: `Bearer {{jwt_token}}`
   - OR: `Bearer eyJhbGciOiJIUzI1NiIs...`
   - NOT: `{{jwt_token}}` alone

3. **Postman environment variable**

   - Make sure `{{jwt_token}}` has a value
   - Check: Manage Environments → Select your environment

4. **Server logs**
   - Check terminal where server is running
   - Look for "ZERO TRUST GUARD CHECK"
   - Check if Authorization header is "Missing" or "Present"

---

## ❌ Possible Issues

| Symptom                   | Cause                                                   | Fix                                 |
| ------------------------- | ------------------------------------------------------- | ----------------------------------- |
| Still works without JWT   | Authorization header is unchecked but shouldn't be sent | Make sure header is truly unchecked |
| Works but shows "Missing" | Postman auto-adding from collection                     | Remove auth from collection level   |
| Shows different path      | Wrong endpoint                                          | Check URL in Postman                |
| "Insufficient roles"      | User role doesn't match resource                        | Use correct role for that endpoint  |

---

## 📋 What Each Resource Requires

| Endpoint | Prefix         | Required Roles                    |
| -------- | -------------- | --------------------------------- |
| Banking  | `/api/banking` | `["hr", "banker"]`                |
| HR       | `/api/hr`      | `["sales", "hr", "admin"]`        |
| Admin    | `/api/admin`   | `["admin"]`                       |
| Reports  | `/api/reports` | `["analyst", "manager", "admin"]` |

---

**Check your server console logs as you test to see the detailed flow! 🔍**

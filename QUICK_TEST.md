# 🧪 Quick Test - Zero Trust Guard

## Step 1: Test WITHOUT JWT (Should Fail ❌)

Open a terminal and run:

```bash
curl -X GET http://localhost:7777/api/banking/dashboard
```

**Expected Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

---

## Step 2: Login to Get Token ✅

```bash
curl -X POST http://localhost:7777/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "banker1",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "...",
    "username": "banker1",
    "email": "banker1@bank.com",
    "roles": ["banker"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the token value!**

---

## Step 3: Test WITH JWT (Should Work ✅)

Replace `YOUR_TOKEN_HERE` with the token from Step 2:

```bash
curl -X GET http://localhost:7777/api/banking/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (200 OK):**

```json
{
  "app": "Banking Dashboard",
  "user": "banker1",
  "riskScore": 0.15,
  "data": {
    "accountBalance": 1250000.5,
    "recentTransactions": [...],
    "pendingApprovals": 3
  },
  "timestamp": "2025-11-26T..."
}
```

---

## ⏱️ If Request is Still Hanging:

1. **Check server logs** - Look for any errors
2. **Try `/api/health`** - Should return instantly without auth
3. **Check MongoDB** - Make sure it's running and connected
4. **Kill and restart server** - `pkill -f "npm run dev"` then `npm run dev`

---

## 📝 In Postman:

### Request 1 (No Auth - Should Fail)

```
GET http://localhost:7777/api/banking/dashboard
Headers: (EMPTY - no Authorization header)
Response: 401 Unauthorized
```

### Request 2 (With Auth - Should Work)

```
GET http://localhost:7777/api/banking/dashboard
Headers:
  Authorization: Bearer {{jwt_token}}
Response: 200 OK with data
```

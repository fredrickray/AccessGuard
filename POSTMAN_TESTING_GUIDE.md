# Access Guard - Postman Testing Guide

## 📋 Quick Setup

### 1. Prerequisites

- MongoDB running locally on `mongodb://localhost:27017/AccessGuard`
- Or use MongoDB Atlas and set `MONGODB_URI` in `.env`
- Postman installed

### 2. Start Your Server

```bash
npm run dev
```

The server will start on port 7777 and connect to MongoDB.

---

## 🔐 Authentication Flow

### Step 1: Sign Up a New User

**Endpoint**: `POST http://localhost:7777/auth/signup`

**Body** (JSON):

```json
{
  "username": "banker1",
  "email": "banker1@bank.com",
  "password": "password123",
  "roles": ["banker"]
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "65a7b8c9d1e2f3g4h5i6j7k8",
    "username": "banker1",
    "email": "banker1@bank.com",
    "roles": ["banker"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token** in a Postman environment variable:

- Right-click **Environment** → **Edit**
- Add variable: `JWT_TOKEN` = (paste the token from response)

---

### Step 2: Login with Existing User

**Endpoint**: `POST http://localhost:7777/auth/login`

**Body** (JSON):

```json
{
  "username": "banker1",
  "password": "password123"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "65a7b8c9d1e2f3g4h5i6j7k8",
    "username": "banker1",
    "email": "banker1@bank.com",
    "roles": ["banker"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📝 Protected Endpoint Tests

Once authenticated, use the JWT token in all API requests.

### Test 1: Access Banking Dashboard

**Endpoint**: `GET http://localhost:7777/api/banking/dashboard`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
```

**Expected Response** (200 OK):

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
  "timestamp": "2025-11-26T10:30:45.123Z"
}
```

---

### Test 2: Access Banking Transactions

**Endpoint**: `GET http://localhost:7777/api/banking/transactions`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
```

**Expected Response** (200 OK):

```json
{
  "app": "Banking Transactions",
  "user": "banker1",
  "transactions": [...]
}
```

---

### Test 3: Transfer Money (POST)

**Endpoint**: `POST http://localhost:7777/api/banking/transfer`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
Content-Type: application/json
```

**Body**:

```json
{
  "from": "ACC-001",
  "to": "ACC-002",
  "amount": 50000
}
```

**Expected Response** (200 OK):

```json
{
  "success": true,
  "message": "Transfer initiated",
  "transferId": "TXN-1701001445123",
  "from": "ACC-001",
  "to": "ACC-002",
  "amount": 50000,
  "riskScore": 0.15
}
```

---

### Test 4: Access HR Endpoints

**Endpoint**: `GET http://localhost:7777/api/hr/employees`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
```

**Note**: HR endpoints require `hr`, `sales`, or `admin` roles. The banker token won't have access unless you add those roles.

---

### Test 5: Get Your Profile

**Endpoint**: `GET http://localhost:7777/auth/me`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
```

**Expected Response** (200 OK):

```json
{
  "user": {
    "userId": "65a7b8c9d1e2f3g4h5i6j7k8",
    "username": "banker1",
    "email": "banker1@bank.com",
    "roles": ["banker"],
    "iat": 1701001445,
    "exp": 1701087845
  },
  "message": "User profile retrieved successfully"
}
```

---

## 🚨 Error Scenarios

### Scenario 1: Missing Authorization Header

**Endpoint**: `GET http://localhost:7777/api/banking/dashboard`

**Headers**: (No Authorization header)

**Expected Response** (401 Unauthorized):

```json
{
  "success": false,
  "message": "User not authenticated",
  "error": "Authentication required"
}
```

---

### Scenario 2: Invalid Token

**Endpoint**: `GET http://localhost:7777/api/banking/dashboard`

**Headers**:

```
Authorization: Bearer invalid.token.here
```

**Expected Response** (401 Unauthorized):

```json
{
  "success": false,
  "message": "User not authenticated",
  "error": "Authentication required"
}
```

---

### Scenario 3: Insufficient Permissions (Wrong Role)

**Setup**: Create an admin user first

```json
{
  "username": "admin1",
  "email": "admin@bank.com",
  "password": "password123",
  "roles": ["admin"]
}
```

**Endpoint**: `GET http://localhost:7777/api/banking/dashboard`

**Using**: banker token (who doesn't have admin role)

**If accessing admin resources, expected response** (403 Forbidden):

```json
{
  "success": false,
  "message": "User does not have required roles for this resource",
  "error": "Insufficient permissions"
}
```

---

### Scenario 4: Login with Wrong Password

**Endpoint**: `POST http://localhost:7777/auth/login`

**Body**:

```json
{
  "username": "banker1",
  "password": "wrongpassword"
}
```

**Expected Response** (401 Unauthorized):

```json
{
  "success": false,
  "message": "Invalid username or password",
  "error": "INVALID_CREDENTIALS"
}
```

---

### Scenario 5: Signup with Duplicate Username

**Endpoint**: `POST http://localhost:7777/auth/signup`

**Body**:

```json
{
  "username": "banker1",
  "email": "another@email.com",
  "password": "password123",
  "roles": ["banker"]
}
```

**Expected Response** (400 Bad Request):

```json
{
  "success": false,
  "message": "User with this username already exists",
  "error": "USER_EXISTS"
}
```

---

## 🎯 High-Risk Access Testing

### Test with Risk Factors

**Endpoint**: `GET http://localhost:7777/api/banking/dashboard`

**Headers**:

```
Authorization: Bearer {{JWT_TOKEN}}
x-device-posture: {"diskEncrypted": false, "antivirus": false, "isJailbroken": true}
x-access-context: {"country": "RU", "impossibleTravel": true, "isVPN": true, "ipReputation": 20}
```

**Expected Response** (401 or 403 with MFA/Block):

```json
{
  "error": "Step-Up Authentication Required",
  "message": "Additional verification needed due to elevated risk",
  "riskScore": 0.95,
  "mfaRequired": true
}
```

---

## 📊 Creating Test Users

```bash
# Banker
POST /auth/signup
{
  "username": "banker1",
  "email": "banker1@bank.com",
  "password": "password123",
  "roles": ["banker"]
}

# HR Manager
POST /auth/signup
{
  "username": "hr_manager",
  "email": "hr@bank.com",
  "password": "password123",
  "roles": ["hr"]
}

# Admin
POST /auth/signup
{
  "username": "admin1",
  "email": "admin@bank.com",
  "password": "password123",
  "roles": ["admin"]
}

# Sales
POST /auth/signup
{
  "username": "sales1",
  "email": "sales@bank.com",
  "password": "password123",
  "roles": ["sales"]
}

# Analyst
POST /auth/signup
{
  "username": "analyst1",
  "email": "analyst@bank.com",
  "password": "password123",
  "roles": ["analyst"]
}
```

---

## 🔧 Postman Environment Variables

Create a **Postman Environment** called "Access Guard Local":

| Variable        | Value                          |
| --------------- | ------------------------------ |
| `BASE_URL`      | `http://localhost:7777`        |
| `JWT_TOKEN`     | (populated after login/signup) |
| `CURRENT_USER`  | (populated after login/signup) |
| `CURRENT_ROLES` | (populated after login/signup) |

---

## 📌 Pro Tips

1. **Always save JWT token after signup/login**
2. **Test with different roles** to see access control in action
3. **Add device posture headers** to test risk engine
4. **Check server logs** to see access decisions and risk scores
5. **Use Postman Collections** to group related requests

---

## 🐛 Troubleshooting

| Issue                      | Solution                                                     |
| -------------------------- | ------------------------------------------------------------ |
| MongoDB connection failed  | Make sure MongoDB is running on `localhost:27017`            |
| "User not authenticated"   | Add `Authorization: Bearer {{JWT_TOKEN}}` header             |
| "Insufficient permissions" | Use correct role in signup (e.g., `["hr"]` for HR endpoints) |
| CORS errors                | CORS should be handled by the server                         |
| Token expired              | Generate a new token (tokens expire in 24h)                  |

---

**Happy Testing! 🚀**

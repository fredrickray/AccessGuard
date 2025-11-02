# Quick Reference - Auth Service Setup

## 🎯 What You Now Have

✅ Complete authentication system with MongoDB
✅ JWT token-based security
✅ Role-based access control
✅ Password hashing with bcryptjs
✅ All endpoints protected/accessible based on roles

---

## 📝 Postman Quick Commands

### 1️⃣ SIGNUP - Create New User

```
POST http://localhost:7777/auth/signup

{
  "username": "banker1",
  "email": "banker1@bank.com",
  "password": "password123",
  "roles": ["banker"]
}

Response: token (save this!)
```

### 2️⃣ LOGIN - Authenticate

```
POST http://localhost:7777/auth/login

{
  "username": "banker1",
  "password": "password123"
}

Response: token
```

### 3️⃣ USE TOKEN - In Headers

```
Authorization: Bearer {{JWT_TOKEN}}

Example request:
GET http://localhost:7777/api/banking/dashboard
```

---

## 👥 Create Test Users

| User   | Endpoint          | Body                                                                                    |
| ------ | ----------------- | --------------------------------------------------------------------------------------- |
| Banker | POST /auth/signup | `{"username":"banker1","email":"b@bank.com","password":"pass123","roles":["banker"]}`   |
| HR     | POST /auth/signup | `{"username":"hr1","email":"hr@bank.com","password":"pass123","roles":["hr"]}`          |
| Admin  | POST /auth/signup | `{"username":"admin1","email":"admin@bank.com","password":"pass123","roles":["admin"]}` |

---

## 🔐 How to Test in Postman

1. Open Postman
2. Create collection "Access Guard"
3. Add request: `POST /auth/signup` with banker credentials
4. Click Send → Copy token from response
5. Create environment variable: `JWT_TOKEN` = (paste token)
6. Add request: `GET /api/banking/dashboard`
7. Add header: `Authorization: Bearer {{JWT_TOKEN}}`
8. Click Send ✅

---

## ✅ Test Results

| Endpoint               | Method | Auth | Result                      |
| ---------------------- | ------ | ---- | --------------------------- |
| /auth/signup           | POST   | ❌   | Create user + get token     |
| /auth/login            | POST   | ❌   | Login + get token           |
| /api/banking/dashboard | GET    | ✅   | Access with banker role     |
| /api/hr/employees      | GET    | ✅   | Access with hr role         |
| /api/banking/dashboard | GET    | ❌   | Unauthorized (401)          |
| /api/banking/dashboard | GET    | ⚠️   | Wrong role: Forbidden (403) |

---

## 📂 Files Created/Updated

```
✅ src/config/db.ts                 - MongoDB connection
✅ src/models/User.ts               - User schema + hashing
✅ src/services/auth.service.ts     - Auth logic (signup/login)
✅ src/routes/auth.route.ts         - Auth endpoints
✅ src/server.ts                    - DB + routes setup
✅ .env                             - MONGODB_URI
✅ tsconfig.json                    - @models path alias
✅ POSTMAN_TESTING_GUIDE.md         - Full guide
✅ IMPLEMENTATION_SUMMARY.md        - Complete summary
```

---

## 🚀 Start Server

```bash
npm run dev
```

Watch for:

```
✅ MongoDB connected successfully
🔐 Zero-Trust Access Guard: ACTIVE
Server is running on port 7777
```

---

## 🎁 Bonus Features

- Password hashing (bcryptjs)
- JWT expiry (24 hours)
- Role-based access control
- Risk engine integration
- Device posture checking
- Comprehensive logging
- Error handling
- MongoDB persistence

**Ready to test! 🎉**

# One-Time Setup API - Create First Admin

## 🎯 Purpose
This API allows creating the first admin account using Postman. It can **ONLY** be used when no admin accounts exist in the database.

---

## 📋 Prerequisites

1. Admin backend is running
2. Database is set up and migrated
3. NO admin accounts exist yet
4. You have the SETUP_KEY from `.env` file

---

## 🔧 Setup Steps

### Step 1: Check Setup Status

**GET** `http://localhost:5002/api/setup/status`

**Response if setup needed:**
```json
{
  "success": true,
  "data": {
    "setupRequired": true,
    "adminCount": 0,
    "message": "Setup required. No admin accounts exist."
  }
}
```

**Response if already setup:**
```json
{
  "success": true,
  "data": {
    "setupRequired": false,
    "adminCount": 1,
    "message": "Setup completed. Admin accounts exist."
  }
}
```

---

### Step 2: Create First Admin (One-Time Only)

**POST** `http://localhost:5002/api/setup/create-first-admin`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!",
  "name": "Super Admin",
  "setupKey": "CHANGE_THIS_IN_PRODUCTION_TO_SECURE_RANDOM_KEY"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@company.com",
    "name": "Super Admin",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "createdAt": "2024-11-24T10:30:00.000Z",
    "updatedAt": "2024-11-24T10:30:00.000Z"
  },
  "message": "First admin created successfully. This setup endpoint is now disabled."
}
```

**Error Response (if admin already exists):**
```json
{
  "success": false,
  "error": "Setup already completed. Admin accounts exist. Use the admin creation API or CLI script instead."
}
```

**Error Response (invalid setup key):**
```json
{
  "success": false,
  "error": "Invalid setup key"
}
```

---

## 🔐 Security Features

1. **One-Time Use:** Works ONLY when zero admins exist
2. **Setup Key Required:** Must provide valid SETUP_KEY from environment
3. **Auto-Disable:** Automatically disabled after first admin is created
4. **SUPER_ADMIN Role:** First admin is always created with SUPER_ADMIN privileges

---

## 📝 Production Deployment Instructions

### For the Client:

1. **Get the Setup Key:**
   - Find the SETUP_KEY in the `.env` file on the server
   - It should be changed to a random secure key before deployment
   - Generate a secure key: `openssl rand -hex 32`

2. **Open Postman:**
   - Create a new POST request
   - URL: `https://admin-api.yourplatform.com/api/setup/create-first-admin`
   - Headers: `Content-Type: application/json`

3. **Request Body:**
```json
{
  "email": "your-email@company.com",
  "password": "YourSecurePassword123!",
  "name": "Your Full Name",
  "setupKey": "your-setup-key-from-env-file"
}
```

4. **Click Send**

5. **Save the Response:**
   - Save the admin ID
   - Save the credentials securely
   - This endpoint is now permanently disabled

6. **Login to Admin Panel:**
   - Go to: `https://admin.yourplatform.com`
   - Use the email and password you just created

---

## 🚨 Important Notes

- **This API is ONLY for the first admin creation**
- After first admin is created, this endpoint returns error 403
- To create additional admins, use:
  - Admin panel UI (if implemented)
  - `/api/admins` endpoint (requires SUPER_ADMIN token)
  - CLI script: `npm run create-admin`

---

## 🔄 Alternative Methods

### Method 1: CLI Script (Recommended)
```bash
cd admin/backend
npm run create-admin
```

### Method 2: With Environment Variables
```bash
ADMIN_EMAIL="admin@company.com" \
ADMIN_PASSWORD="SecurePass123!" \
ADMIN_NAME="Admin Name" \
npm run create-admin
```

### Method 3: One-Time API (This Document)
Use Postman as described above.

---

## 🛠️ Troubleshooting

**Error: "Invalid setup key"**
- Solution: Check SETUP_KEY in `.env` file matches your request

**Error: "Setup already completed"**
- Solution: An admin already exists. Use `/api/admins` endpoint instead

**Error: "Connection refused"**
- Solution: Ensure admin backend is running on port 5002

**Error: "Database connection failed"**
- Solution: Check DATABASE_URL in `.env` file

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `cd admin/backend && npm run dev`
2. Verify database connection
3. Confirm SETUP_KEY matches
4. Check if any admin already exists in database

# Production Admin Management Guide

## For Production Deployment

### Initial Setup (First Admin Creation)

When deploying to production, create the first SUPER_ADMIN using the CLI:

```bash
# SSH into production server
ssh user@production-server.com

# Navigate to admin backend
cd /path/to/admin/backend

# Create first SUPER_ADMIN
ADMIN_EMAIL="ceo@company.com" \
ADMIN_PASSWORD="VerySecurePassword123!" \
ADMIN_NAME="Company CEO" \
npm run create-admin
```

**Important:** This creates a SUPER_ADMIN who can then create additional admins via the web interface.

---

## Creating Additional Admins (Post-Production)

Once you have a SUPER_ADMIN account, you can create additional admins through the API or Admin Panel.

### Method 1: Via Admin Panel UI (Easiest for Clients)

1. Log in to admin panel as SUPER_ADMIN
2. Navigate to "Admins" section (you'll need to add this page)
3. Click "Create New Admin"
4. Fill in details and submit

### Method 2: Via API (Using Postman or cURL)

**Endpoint:** `POST http://your-domain.com/api/admins`

**Headers:**
```
Authorization: Bearer {SUPER_ADMIN_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newadmin@company.com",
  "password": "SecurePassword123!",
  "name": "Admin Name",
  "role": "MODERATOR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newadmin@company.com",
    "name": "Admin Name",
    "role": "MODERATOR",
    "isActive": true
  },
  "message": "Admin created successfully"
}
```

---

## Admin Management APIs

### 1. Create New Admin (SUPER_ADMIN only)
```
POST /api/admins
Authorization: Bearer {SUPER_ADMIN_TOKEN}

Body:
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "name": "Admin Name",
  "role": "MODERATOR"
}
```

### 2. Get All Admins (SUPER_ADMIN only)
```
GET /api/admins
Authorization: Bearer {SUPER_ADMIN_TOKEN}
```

### 3. Deactivate Admin (SUPER_ADMIN only)
```
PUT /api/admins/:adminId/deactivate
Authorization: Bearer {SUPER_ADMIN_TOKEN}
```

### 4. Activate Admin (SUPER_ADMIN only)
```
PUT /api/admins/:adminId/activate
Authorization: Bearer {SUPER_ADMIN_TOKEN}
```

---

## Security Features

1. **No Public Registration:** Admins can only be created by existing SUPER_ADMINs or via CLI
2. **Role-Based Access:**
   - `SUPER_ADMIN`: Can create/manage other admins, full access
   - `MODERATOR`: Can moderate content and users, cannot manage admins
3. **Self-Protection:** Admins cannot deactivate their own accounts
4. **Password Hashing:** All passwords are bcrypt hashed

---

## Client Handover Instructions

### For Non-Technical Clients:

**"How to Create a New Admin Account"**

1. Log in to the admin panel at: `https://admin.yourplatform.com`
2. Use your SUPER_ADMIN credentials
3. Navigate to "Admin Management" in the sidebar
4. Click "Create New Admin" button
5. Fill in:
   - Email address
   - Temporary password (they should change it after first login)
   - Full name
   - Role (Moderator or Super Admin)
6. Click "Create Admin"
7. Share the login credentials securely with the new admin

### For Technical Clients:

Provide them with:
1. SSH access to the server
2. This documentation
3. Access to the admin creation script
4. API documentation for admin management

---

## Emergency Access

If all admin accounts are locked out:

1. SSH into the server
2. Run the CLI script to create a new SUPER_ADMIN:
```bash
cd /path/to/admin/backend
ADMIN_EMAIL="emergency@company.com" \
ADMIN_PASSWORD="EmergencyPass123!" \
ADMIN_NAME="Emergency Admin" \
npm run create-admin
```

---

## Best Practices

1. **Always create at least 2 SUPER_ADMINs** to prevent lockout
2. **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
3. **Change default credentials immediately** after first login
4. **Create MODERATOR accounts** for day-to-day operations
5. **Keep SUPER_ADMIN access limited** to key personnel only
6. **Regularly audit admin accounts** and deactivate unused ones
7. **Document all admin credentials** in a secure password manager

---

## Password Requirements

Recommended password policy:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

---

## Support Contact

For technical issues with admin account creation, contact your development team with:
- Server access logs
- Error messages
- Current admin count
- Last successful admin creation date

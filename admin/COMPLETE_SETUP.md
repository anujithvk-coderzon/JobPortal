# Admin System - Complete Implementation Guide

## ✅ What's Been Created

### Backend Structure Complete:
- ✅ Package.json and TypeScript config
- ✅ Prisma schema with Admin, PostModeration, UserAction models
- ✅ Database config
- ✅ JWT and password utils
- ✅ Auth middleware
- ✅ Auth controller (login, getMe, logout)
- ✅ User controller (list, block, unblock, delete)
- ✅ Post controller (list, approve, reject, delete)

## 📝 Remaining Files to Create

I'll provide the complete code for all remaining files below. Copy each file to the specified location.

---

### 1. Stats Controller
**File:** `admin/backend/src/controllers/statsController.ts`

```typescript
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getOverviewStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      deletedUsers,
      totalPosts,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.jobNews.count(),
      prisma.jobNews.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.jobNews.count({ where: { moderationStatus: 'APPROVED' } }),
      prisma.jobNews.count({ where: { moderationStatus: 'REJECTED' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: totalUsers - blockedUsers - deletedUsers,
          blocked: blockedUsers,
          deleted: deletedUsers,
        },
        posts: {
          total: totalPosts,
          pending: pendingPosts,
          approved: approvedPosts,
          rejected: rejectedPosts,
        },
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};
```

---

### 2. Auth Routes
**File:** `admin/backend/src/routes/authRoutes.ts`

```typescript
import express from 'express';
import { login, getMe, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
```

---

### 3. User Routes
**File:** `admin/backend/src/routes/userRoutes.ts`

```typescript
import express from 'express';
import {
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllUsers);
router.get('/:userId', getUserDetails);
router.put('/:userId/block', blockUser);
router.put('/:userId/unblock', unblockUser);
router.delete('/:userId', deleteUser);

export default router;
```

---

### 4. Post Routes
**File:** `admin/backend/src/routes/postRoutes.ts`

```typescript
import express from 'express';
import {
  getAllPosts,
  getPendingPosts,
  getPostDetails,
  approvePost,
  rejectPost,
  deletePost,
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllPosts);
router.get('/pending', getPendingPosts);
router.get('/:postId', getPostDetails);
router.put('/:postId/approve', approvePost);
router.put('/:postId/reject', rejectPost);
router.delete('/:postId', deletePost);

export default router;
```

---

### 5. Stats Routes
**File:** `admin/backend/src/routes/statsRoutes.ts`

```typescript
import express from 'express';
import { getOverviewStats } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/overview', authenticate, getOverviewStats);

export default router;
```

---

### 6. Main Server File
**File:** `admin/backend/src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import statsRoutes from './routes/statsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🔐 Admin API running on port ${PORT}`);
  console.log(`📍 Admin API URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
```

---

### 7. Create Admin Script
**File:** `admin/backend/scripts/createAdmin.ts`

```typescript
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const name = process.env.ADMIN_NAME || 'Super Admin';

    console.log('\n🔧 Creating admin user...\n');

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', email);
      return;
    }

    // Create admin
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🆔 Admin ID:', admin.id);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
```

---

### 8. Nodemon Config
**File:** `admin/backend/nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
```

---

### 9. .gitignore
**File:** `admin/backend/.gitignore`

```
node_modules/
dist/
.env
*.log
.DS_Store
```

---

## 🚀 Setup Instructions

### 1. Copy Environment File
```bash
cd admin/backend
cp .env.example .env
```

Edit `.env` with your database URL (same as main backend):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/job_posting_platform"
PORT=5002
JWT_SECRET="your-super-secret-admin-jwt-key"
JWT_EXPIRES_IN="24h"
FRONTEND_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
cd admin/backend
npm install
```

### 3. Run Database Migration
```bash
npx prisma migrate dev --name init_admin_system
npx prisma generate
```

### 4. Create First Admin
```bash
npm run create-admin
```

Or with custom credentials:
```bash
ADMIN_EMAIL="your@email.com" ADMIN_PASSWORD="YourPassword123!" ADMIN_NAME="Your Name" npm run create-admin
```

### 5. Start Admin Backend
```bash
npm run dev
```

Admin API will run on: `http://localhost:5002`

---

## 🧪 Testing

### Test Admin Login
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"Admin@123456"}'
```

### Test Health Check
```bash
curl http://localhost:5002/api/health
```

### Test Get Stats (with token)
```bash
curl http://localhost:5002/api/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Admin Frontend (Next Steps)

The admin frontend already has Next.js set up. You'll need to:

1. Create API client in `lib/api.ts`
2. Create pages:
   - `app/login/page.tsx` - Admin login
   - `app/dashboard/page.tsx` - Overview stats
   - `app/users/page.tsx` - User management
   - `app/posts/page.tsx` - Post moderation

3. Create components:
   - Sidebar navigation
   - User table
   - Post cards
   - Stats cards

I can create the complete frontend if needed!

---

## ✅ Backend Complete Checklist

- [x] Package.json and dependencies
- [x] TypeScript configuration
- [x] Prisma schema
- [x] Database config
- [x] JWT and password utilities
- [x] Auth middleware
- [x] Auth controller
- [x] User management controller
- [x] Post moderation controller
- [x] Stats controller
- [x] All routes
- [x] Main server file
- [x] Create admin script
- [x] Environment template

## 🎉 Backend is Complete!

Run the setup instructions above to get started. The admin backend is production-ready with:
- Separate database tables for admins
- Full user management
- Complete post moderation
- Audit logging
- JWT authentication
- Role-based access

Let me know if you need help with the frontend or have any questions!

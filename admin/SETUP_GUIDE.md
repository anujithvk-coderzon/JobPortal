# Admin System Setup Guide

## Overview
This is a completely separate admin system with its own backend and frontend, independent from the main platform.

## Architecture

```
admin/
├── backend/          # Separate Node.js/Express backend for admin
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── models/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/         # Separate Next.js/React frontend for admin
│   ├── app/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── posts/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── package.json
│
└── SETUP_GUIDE.md
```

## Backend Setup

### 1. Initialize Admin Backend

```bash
cd admin/backend
npm init -y
npm install express typescript ts-node nodemon
npm install @types/express @types/node --save-dev
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken cors dotenv
npm install @types/bcryptjs @types/jsonwebtoken @types/cors --save-dev
```

### 2. Prisma Setup for Admin Database

The admin system will connect to the SAME database but use it independently with its own schema additions.

```bash
cd admin/backend
npx prisma init
```

### 3. Admin Database Schema

Create `admin/backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AdminRole {
  SUPER_ADMIN
  MODERATOR
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
}

// Admin users table (separate from main users)
model Admin {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String
  name          String
  role          AdminRole   @default(MODERATOR)
  isActive      Boolean     @default(true)
  lastLogin     DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Moderation history
  moderations   PostModeration[]
  userActions   UserAction[]

  @@map("admins")
}

// Track post moderation history
model PostModeration {
  id              String            @id @default(uuid())
  postId          String            // Reference to JobNews in main DB
  adminId         String
  admin           Admin             @relation(fields: [adminId], references: [id])
  action          String            // APPROVE, REJECT, DELETE
  reason          String?
  createdAt       DateTime          @default(now())

  @@map("post_moderations")
}

// Track user management actions
model UserAction {
  id              String      @id @default(uuid())
  userId          String      // Reference to User in main DB
  adminId         String
  admin           Admin       @relation(fields: [adminId], references: [id])
  action          String      // BLOCK, UNBLOCK, DELETE
  reason          String?
  createdAt       DateTime    @default(now())

  @@map("user_actions")
}

// Main platform User model (readonly access for admin)
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  password      String
  name          String
  phone         String?
  location      String?
  profilePhoto  String?
  isBlocked     Boolean       @default(false)
  isDeleted     Boolean       @default(false)
  deletedAt     DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  jobNews       JobNews[]

  @@map("users")
}

// Main platform JobNews model (readonly + moderate access for admin)
model JobNews {
  id                String             @id @default(uuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  title             String
  description       String
  companyName       String?
  location          String?
  source            String?
  externalLink      String?
  poster            String?
  video             String?
  videoId           String?

  moderationStatus  ModerationStatus   @default(PENDING)
  moderatedBy       String?
  moderatedAt       DateTime?
  rejectionReason   String?

  isActive          Boolean            @default(false) // Inactive until approved
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  @@map("job_news")
}
```

### 4. Admin Backend Structure

Create the following files:

**`admin/backend/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/job_posting_platform"
PORT=5002
JWT_SECRET="admin-jwt-secret-key-change-this"
JWT_EXPIRES_IN="24h"
NODE_ENV="development"
```

**`admin/backend/src/server.ts`**
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
  origin: 'http://localhost:3001', // Admin frontend URL
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
  res.json({ success: true, message: 'Admin API running' });
});

app.listen(PORT, () => {
  console.log(`\n🔐 Admin API running on port ${PORT}`);
  console.log(`📍 Admin API URL: http://localhost:${PORT}/api\n`);
});

export default app;
```

## Frontend Setup

Since you already have a Next.js project in `admin/`, we'll use that.

### 1. Update Admin Frontend Dependencies

```bash
cd /mnt/d/CoderZone/Job\ posting/admin
npm install axios @tanstack/react-query
npm install lucide-react date-fns
npm install @tanstack/react-table
npm install recharts
```

### 2. Admin Frontend Structure

```
admin/
├── app/
│   ├── login/page.tsx          # Admin login
│   ├── dashboard/page.tsx      # Overview stats
│   ├── users/page.tsx          # User management
│   ├── posts/page.tsx          # Post moderation
│   ├── layout.tsx              # Main layout with sidebar
│   └── page.tsx                # Redirect to dashboard
├── components/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── UserTable.tsx
│   ├── PostCard.tsx
│   └── StatsCard.tsx
└── lib/
    ├── api.ts                  # API client
    └── utils.ts
```

## Key Features

### Admin Features:
1. **Authentication**
   - Separate admin login (no registration)
   - JWT-based auth
   - Admin-only access

2. **User Management**
   - View all platform users
   - Search and filter users
   - Block/unblock users
   - Delete users (soft delete)
   - View user activity

3. **Content Moderation**
   - Review pending posts
   - Approve/reject posts
   - Delete inappropriate posts
   - Add rejection reasons
   - View moderation history

4. **Dashboard**
   - User statistics
   - Post statistics
   - Moderation queue count
   - Activity graphs

5. **Audit Trail**
   - Track all admin actions
   - Moderation history
   - User action logs

## Setup Steps

### 1. Setup Admin Database

```bash
cd admin/backend
npx prisma migrate dev --name init_admin_system
npx prisma generate
```

### 2. Create First Admin User

```bash
npx ts-node scripts/createAdmin.ts
```

Or manually:
```sql
INSERT INTO admins (id, email, password, name, role)
VALUES (
  gen_random_uuid(),
  'admin@company.com',
  -- Use bcrypt hash of your password
  '$2a$10$...',
  'Super Admin',
  'SUPER_ADMIN'
);
```

### 3. Start Admin Backend

```bash
cd admin/backend
npm run dev
```

### 4. Start Admin Frontend

```bash
cd admin
npm run dev
```

Admin dashboard will be at: `http://localhost:3000`
Admin API will be at: `http://localhost:5002`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current admin

### User Management
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id/block` - Block user
- `PUT /api/users/:id/unblock` - Unblock user
- `DELETE /api/users/:id` - Delete user

### Post Moderation
- `GET /api/posts` - List all posts
- `GET /api/posts/pending` - Get pending posts
- `PUT /api/posts/:id/approve` - Approve post
- `PUT /api/posts/:id/reject` - Reject post
- `DELETE /api/posts/:id` - Delete post

### Statistics
- `GET /api/stats/overview` - Dashboard stats
- `GET /api/stats/moderation` - Moderation stats

## Security

1. **No Admin Registration** - Admins created only via scripts or super admin
2. **Separate Database Table** - Admin users separate from platform users
3. **Audit Logging** - All actions logged
4. **Role-Based Access** - SUPER_ADMIN vs MODERATOR roles
5. **JWT Authentication** - Separate tokens from main platform

## Next Steps

1. Review this guide
2. Decide on the exact implementation
3. I'll create all the files with complete code
4. Test and deploy

Would you like me to proceed with creating all the files with complete working code?

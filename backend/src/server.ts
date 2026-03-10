import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { generalLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import jobNewsRoutes from './routes/jobNewsRoutes';
import companyRoutes from './routes/companyRoutes';
import testRoutes from './routes/testRoutes';
// Setup routes removed - first admin auto-registers as SUPER_ADMIN
import adminAuthRoutes from './routes/adminAuthRoutes';
import adminStatsRoutes from './routes/adminStatsRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import adminPostRoutes from './routes/adminPostRoutes';
import adminManagementRoutes from './routes/adminManagementRoutes';
import notificationRoutes from './routes/notificationRoutes';
import followRoutes from './routes/followRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://job-portal-inky-zeta.vercel.app',
        'https://job-portal-admin-ivory.vercel.app',
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Global rate limit: 100 requests per minute per IP
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/job-news', jobNewsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/posts', adminPostRoutes);
app.use('/api/admin/admins', adminManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/reports', reportRoutes);

// Test routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
  console.log('🧪 Test routes enabled at /api/test');
}

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Job Posting Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;

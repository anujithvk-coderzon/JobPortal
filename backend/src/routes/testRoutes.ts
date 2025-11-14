import express, { Request, Response } from 'express';
import { sendVerificationCode } from '../services/emailService';

const router = express.Router();

/**
 * Test email sending - Development only
 * This endpoint helps diagnose email configuration issues
 */
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required',
      });
    }

    console.log('\n🧪 Testing email configuration...');
    console.log('Attempting to send to:', email);

    // Generate test code
    const testCode = '1234';

    // Try to send verification email
    const result = await sendVerificationCode({
      email,
      name,
      code: testCode,
    });

    if (result) {
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
        testCode: testCode,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to send test email. Check backend console for detailed error.',
      });
    }
  } catch (error: any) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
    });
  }
});

/**
 * Check email configuration
 */
router.get('/email-config', (req: Request, res: Response) => {
  const config = {
    hasApiKey: !!process.env.BREVO_API,
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'NOT SET',
    senderName: process.env.BREVO_SENDER_NAME || 'NOT SET',
  };

  const issues = [];

  if (!config.hasApiKey) {
    issues.push('❌ BREVO_API is not set in .env file');
  }

  if (config.senderEmail === 'NOT SET' || config.senderEmail.includes('jobposting.com')) {
    issues.push('❌ BREVO_SENDER_EMAIL is not set or using unverified domain');
  }

  return res.status(200).json({
    success: true,
    config,
    issues,
    instructions: issues.length > 0 ? {
      step1: 'Go to https://app.brevo.com/settings/senders',
      step2: 'Add and verify your sender email',
      step3: 'Update backend/.env with BREVO_SENDER_EMAIL and BREVO_SENDER_NAME',
      step4: 'Restart the backend server',
    } : 'Configuration looks good! ✅',
  });
});

export default router;

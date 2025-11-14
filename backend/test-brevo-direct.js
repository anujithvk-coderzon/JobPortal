// Direct Brevo API Test
// This is a standalone test to verify your Brevo credentials work
// Run: node test-brevo-direct.js

require('dotenv').config();
const brevo = require('@getbrevo/brevo');

const BREVO_API_KEY = process.env.BREVO_API;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@jobposting.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Job Posting Platform';

// Change this to YOUR email to receive the test
const TEST_RECIPIENT_EMAIL = 'YOUR_EMAIL_HERE@example.com'; // ← CHANGE THIS!
const TEST_RECIPIENT_NAME = 'Test User';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📧 Brevo API Direct Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check configuration
console.log('Configuration Check:');
console.log('─────────────────────────────────────────────');
console.log('✓ API Key set:', !!BREVO_API_KEY);
console.log('✓ API Key length:', BREVO_API_KEY ? BREVO_API_KEY.length : 0);
console.log('✓ Sender Email:', SENDER_EMAIL);
console.log('✓ Sender Name:', SENDER_NAME);
console.log('✓ Recipient Email:', TEST_RECIPIENT_EMAIL);
console.log('─────────────────────────────────────────────\n');

// Validation
if (!BREVO_API_KEY) {
  console.error('❌ ERROR: BREVO_API is not set in .env file!');
  console.error('\n📋 To fix:');
  console.error('1. Open backend/.env file');
  console.error('2. Add: BREVO_API=your-api-key-here');
  console.error('3. Get your API key from: https://app.brevo.com/settings/keys/api\n');
  process.exit(1);
}

if (TEST_RECIPIENT_EMAIL === 'YOUR_EMAIL_HERE@example.com') {
  console.error('❌ ERROR: Please set TEST_RECIPIENT_EMAIL in this script!');
  console.error('\n📋 To fix:');
  console.error('1. Open test-brevo-direct.js');
  console.error('2. Change TEST_RECIPIENT_EMAIL to your real email address\n');
  process.exit(1);
}

if (SENDER_EMAIL.includes('jobposting.com')) {
  console.warn('⚠️  WARNING: Using default sender email!');
  console.warn('   This email is likely NOT verified in your Brevo account.');
  console.warn('\n📋 To fix:');
  console.warn('1. Go to: https://app.brevo.com/settings/senders');
  console.warn('2. Add and verify your sender email');
  console.warn('3. Update .env with:');
  console.warn('   BREVO_SENDER_EMAIL=your-verified-email@gmail.com');
  console.warn('   BREVO_SENDER_NAME="Your Name"\n');
}

async function sendTestEmail() {
  console.log('Attempting to send email...\n');

  const apiInstance = new brevo.TransactionalEmailsApi();

  // Set API key
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

  // Create email object
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = 'Test Email from Brevo SDK';
  sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
  sendSmtpEmail.to = [{ email: TEST_RECIPIENT_EMAIL, name: TEST_RECIPIENT_NAME }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 30px; border-radius: 8px; }
        h1 { color: #667eea; }
        .info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .success { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Success!</h1>
        <p class="success">Your Brevo email configuration is working correctly!</p>

        <div class="info">
          <p><strong>Sender:</strong> ${SENDER_NAME} &lt;${SENDER_EMAIL}&gt;</p>
          <p><strong>Recipient:</strong> ${TEST_RECIPIENT_NAME} &lt;${TEST_RECIPIENT_EMAIL}&gt;</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>If you received this email, your Brevo setup is complete and ready to use!</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated test email from your Job Posting Platform.
        </p>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.textContent = 'Your Brevo email configuration is working! This is a test email.';

  try {
    console.log('⏳ Sending email via Brevo API...');
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Response Details:');
    console.log('─────────────────────────────────────────────');
    console.log('Message ID:', result.body.messageId || result.messageId);
    console.log('─────────────────────────────────────────────\n');

    console.log('📬 Next Steps:');
    console.log('1. Check your inbox at:', TEST_RECIPIENT_EMAIL);
    console.log('2. Check spam folder if not in inbox');
    console.log('3. If received, your configuration is PERFECT! ✨');
    console.log('4. You can now use the registration page\n');

  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR: Failed to send email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.error('Error Details:');
    console.error('─────────────────────────────────────────────');
    console.error('Message:', error.message);

    if (error.response) {
      console.error('Status Code:', error.response.statusCode);
      console.error('Response Body:', JSON.stringify(error.response.body, null, 2));
    }
    console.error('─────────────────────────────────────────────\n');

    // Provide helpful error messages
    if (error.message?.toLowerCase().includes('unauthorized') ||
        error.response?.statusCode === 401) {
      console.error('🔑 AUTHENTICATION ERROR');
      console.error('Your API key is invalid or expired.\n');
      console.error('Fix:');
      console.error('1. Go to: https://app.brevo.com/settings/keys/api');
      console.error('2. Copy your API key (starts with xkeysib-)');
      console.error('3. Update BREVO_API in backend/.env file\n');
    }
    else if (error.message?.toLowerCase().includes('sender') ||
             error.response?.body?.message?.toLowerCase().includes('sender')) {
      console.error('📧 SENDER EMAIL ERROR');
      console.error(`The sender email "${SENDER_EMAIL}" is not verified!\n`);
      console.error('Fix:');
      console.error('1. Go to: https://app.brevo.com/settings/senders');
      console.error('2. Click "Add a sender"');
      console.error('3. Enter your email (can use Gmail for testing)');
      console.error('4. Click the verification link Brevo sends you');
      console.error('5. Update backend/.env with:');
      console.error('   BREVO_SENDER_EMAIL=your-verified-email@gmail.com');
      console.error('   BREVO_SENDER_NAME="Your Name"');
      console.error('6. Restart and run this test again\n');
    }
    else {
      console.error('💡 Troubleshooting:');
      console.error('1. Verify API key is correct in .env');
      console.error('2. Verify sender email in Brevo dashboard');
      console.error('3. Check Brevo account status (not suspended)');
      console.error('4. Try a different recipient email\n');
    }

    process.exit(1);
  }
}

// Run the test
sendTestEmail();

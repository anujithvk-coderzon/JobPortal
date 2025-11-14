// Quick Email Test
require('dotenv').config();
const axios = require('axios');

const BREVO_API_KEY = process.env.BREVO_API || process.env.API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'anujith.vk@coderzon.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Job Posting Platform';

// CHANGE THIS TO YOUR EMAIL!
const TEST_EMAIL = 'YOUR_EMAIL@gmail.com'; // ← PUT YOUR EMAIL HERE

console.log('Testing Email Configuration...\n');
console.log('API Key:', BREVO_API_KEY ? BREVO_API_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('Sender Email:', SENDER_EMAIL);
console.log('Sender Name:', SENDER_NAME);
console.log('Test Recipient:', TEST_EMAIL);
console.log('\nSending test email...\n');

async function test() {
  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL
      },
      to: [
        {
          email: TEST_EMAIL,
          name: 'Test User'
        }
      ],
      subject: 'Test Email from Job Posting Platform',
      htmlContent: `
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1 style="color: #667eea;">✅ Success!</h1>
            <p>If you received this email, your configuration is working perfectly!</p>
            <p><strong>Sender:</strong> ${SENDER_EMAIL}</p>
            <p><strong>API Key:</strong> ${BREVO_API_KEY.substring(0, 20)}...</p>
          </body>
        </html>
      `
    }, {
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Response:', response.data);
    console.log('\n🎉 Email sent! Check your inbox at:', TEST_EMAIL);

  } catch (error) {
    console.log('❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n🔑 Your API key is invalid!');
    } else if (error.response?.data?.message?.includes('sender')) {
      console.log('\n📧 Your sender email is not verified in Brevo!');
      console.log('Go to: https://app.brevo.com/settings/senders');
    }
  }
}

test();

# Email Setup Guide - Brevo Configuration

## The Problem
Emails are not being received because the **sender email address is not verified** in your Brevo account.

## Solution - Verify Your Sender Email

### Step 1: Log in to Brevo
Go to: https://app.brevo.com

### Step 2: Navigate to Senders Settings
1. Click on your profile (top right)
2. Go to **Settings** → **Senders & IP**
3. Or directly visit: https://app.brevo.com/settings/senders

### Step 3: Add a Sender
Click **"Add a sender"** and enter:
- **Email**: Your verified email address (e.g., `your-email@gmail.com`)
- **Name**: Job Posting Platform (or any name)

### Step 4: Verify the Sender
1. Brevo will send a verification email to that address
2. Click the verification link in the email
3. The sender will now show as **"Verified"** ✅

### Step 5: Update Your .env File
In your `backend/.env` file, add:

```env
BREVO_SENDER_EMAIL=your-verified-email@gmail.com
BREVO_SENDER_NAME="Job Posting Platform"
```

### Step 6: Restart Your Backend Server
Stop and restart your backend server to load the new environment variables.

## Quick Test

After setup, check your backend console logs when starting the server:

```
Email Service Configuration:
- API Key set: true
- Sender Email: your-verified-email@gmail.com
⚠️  IMPORTANT: Make sure this email is verified in your Brevo account!
```

Then try sending a verification code. You should see:

```
✅ Verification email sent successfully to: user@example.com
Message ID: <some-message-id>
```

## Common Issues

### Issue: "Sender email not verified"
**Solution**: Follow steps above to verify your sender in Brevo

### Issue: "Invalid API key"
**Solution**:
1. Go to https://app.brevo.com/settings/keys/api
2. Copy your API key
3. Update `BREVO_API` in your .env file

### Issue: Email goes to spam
**Solution**:
1. Use a real domain email (not gmail/yahoo for production)
2. Set up SPF/DKIM records (in Brevo settings)
3. Use Brevo's dedicated IP (paid feature)

## Using Gmail as Sender (Development Only)

If you want to use your Gmail address:

1. **Add Gmail to Brevo Senders**:
   - Go to https://app.brevo.com/settings/senders
   - Add your Gmail address
   - Verify it

2. **Update .env**:
   ```env
   BREVO_SENDER_EMAIL=yourgmail@gmail.com
   BREVO_SENDER_NAME="Your Name"
   ```

3. **Restart backend**

**Note**: Gmail as sender works for development but use a custom domain for production.

## Production Best Practices

For production environments:

1. **Use a custom domain** (yourcompany.com)
2. **Set up email authentication**:
   - SPF record
   - DKIM signature
   - DMARC policy
3. **Monitor email deliverability** in Brevo dashboard
4. **Use dedicated IP** (Brevo paid plan)

## Support

- Brevo Documentation: https://developers.brevo.com/docs
- Brevo Support: https://help.brevo.com/

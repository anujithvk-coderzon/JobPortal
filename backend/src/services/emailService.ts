import axios from 'axios';

// Brevo API Configuration
const BREVO_API_KEY = process.env.BREVO_API || process.env.API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Sender email must be verified in Brevo dashboard
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@jobposting.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Job Posting Platform';


const sendBrevoEmail = async (emailData: any): Promise<boolean> => {
  try {
    if (!BREVO_API_KEY) {
      console.error('❌ Cannot send email: BREVO_API key is not configured');
      return false;
    }

    const response = await axios.post(BREVO_API_URL, emailData, {
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('❌ Email service error: Invalid or expired API key');
    } else if (error.response?.data?.message?.toLowerCase().includes('sender')) {
      console.error('❌ Email service error: Sender email not verified');
    } else {
      console.error('❌ Email service error:', error.response?.data?.message || error.message);
    }
    return false;
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

interface SendVerificationCodeParams {
  email: string;
  name: string;
  code: string;
}

export const sendVerificationCode = async ({ email, name, code }: SendVerificationCodeParams): Promise<boolean> => {
  const emailData = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [{ email, name }],
    subject: 'Verify Your Email - JobConnect',
    htmlContent: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #2563eb; padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">JobConnect</h1>
                    <p style="color: #dbeafe; margin: 6px 0 0 0; font-size: 14px;">Email Verification</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 35px 40px 30px 40px;">
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Hello ${name},</p>
                    <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
                      Thank you for registering with JobConnect. Please use the verification code below to complete your account setup.
                    </p>

                    <!-- Verification Code -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center" style="background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 6px; padding: 24px;">
                          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Verification Code</p>
                          <p style="margin: 0; color: #1f2937; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 16px; margin: 0 0 20px 0;">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 20px;">
                            <strong>Security:</strong> This code expires in 10 minutes. Never share it with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0;">
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      &copy; ${new Date().getFullYear()} JobConnect. All rights reserved.<br>
                      <a href="mailto:support@jobconnect.com" style="color: #2563eb; text-decoration: none;">support@jobconnect.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  return sendBrevoEmail(emailData);
};

interface SendWelcomeEmailParams {
  email: string;
  name: string;
}

export const sendWelcomeEmail = async ({ email, name }: SendWelcomeEmailParams): Promise<boolean> => {
  const emailData = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL
    },
    to: [{ email, name }],
    subject: 'Welcome to JobConnect',
    htmlContent: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Welcome to JobConnect</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background-color: #2563eb; padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Welcome to JobConnect</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 35px 40px 30px 40px;">
                    <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Hello ${name},</p>
                    <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
                      Your account has been successfully created. Get started by exploring what JobConnect has to offer.
                    </p>

                    <!-- Getting Started Steps -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px 24px; margin: 0 0 20px 0;">
                      <tr>
                        <td>
                          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Getting Started:</p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 6px 0; color: #4b5563; font-size: 13px; line-height: 20px;">
                                <strong style="color: #111827;">1.</strong> Complete your profile with your information
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #4b5563; font-size: 13px; line-height: 20px;">
                                <strong style="color: #111827;">2.</strong> Browse job postings and community posts
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #4b5563; font-size: 13px; line-height: 20px;">
                                <strong style="color: #111827;">3.</strong> Apply to jobs or create company profiles to post jobs
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; color: #4b5563; font-size: 13px; line-height: 20px;">
                                <strong style="color: #111827;">4.</strong> Engage with the community and share opportunities
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      Need assistance? Contact us at <a href="mailto:support@jobconnect.com" style="color: #2563eb; text-decoration: none;">support@jobconnect.com</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      &copy; ${new Date().getFullYear()} JobConnect. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  return sendBrevoEmail(emailData);
};

// Rest of the email functions using the same pattern...
// (I'll add the interview, rejection, and hired email functions)

interface SendInterviewScheduledParams {
  email: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: Date;
  interviewTime: string;
  interviewLocation?: string;
  interviewLink?: string;
  interviewType: string;
  additionalNotes?: string;
  contactPerson?: string;
  contactEmail?: string;
  customEmailContent?: string;
}

export const sendInterviewScheduledEmail = async (params: SendInterviewScheduledParams): Promise<boolean> => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time24: string) => {
    // Parse time in HH:MM format
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convert custom email content - preserve all line breaks
  const emailMessage = params.customEmailContent
    ? `<div style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">${
        params.customEmailContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      }</div>`
    : `<p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
         You have been invited to interview for the <strong>${params.jobTitle}</strong> position at <strong>${params.companyName}</strong>.
       </p>`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Scheduled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 6px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color: #059669; padding: 24px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Interview Scheduled</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 30px;">
                  <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Hello ${params.candidateName},</p>
                  ${emailMessage}

                  <p style="margin: 16px 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Interview Details:</p>
                  <p style="margin: 0 0 6px 0; color: #374151; font-size: 13px; line-height: 20px;">
                    <strong>Date:</strong> ${formatDate(params.interviewDate)}<br>
                    <strong>Time:</strong> ${formatTime(params.interviewTime)}<br>
                    <strong>Type:</strong> ${params.interviewType === 'video' ? 'Video Interview' : params.interviewType === 'in-person' ? 'In-Person' : 'Phone Call'}
                    ${params.interviewLocation ? `<br><strong>Location:</strong> ${params.interviewLocation}` : ''}
                    ${params.interviewLink ? `<br><strong>Link:</strong> <a href="${params.interviewLink}" style="color: #2563eb; text-decoration: none;">${params.interviewLink}</a>` : ''}
                  </p>

                  ${params.additionalNotes ? `
                  <p style="margin: 16px 0 6px 0; color: #111827; font-size: 14px; font-weight: 600;">Additional Notes:</p>
                  <p style="margin: 0; color: #374151; font-size: 13px; line-height: 20px;">${params.additionalNotes}</p>
                  ` : ''}

                  ${params.contactPerson || params.contactEmail ? `
                  <p style="margin: 16px 0 6px 0; color: #111827; font-size: 14px; font-weight: 600;">Contact:</p>
                  <p style="margin: 0; color: #374151; font-size: 13px; line-height: 20px;">
                    ${params.contactPerson ? params.contactPerson : ''}${params.contactPerson && params.contactEmail ? '<br>' : ''}
                    ${params.contactEmail ? `<a href="mailto:${params.contactEmail}" style="color: #2563eb; text-decoration: none;">${params.contactEmail}</a>` : ''}
                  </p>
                  ` : ''}

                  <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 16px 0 0 0;">
                    Please contact us if you need to reschedule or have any questions.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 16px 30px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 11px; line-height: 16px; margin: 0; text-align: center;">
                    ${params.companyName} | &copy; ${new Date().getFullYear()} JobConnect
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailData: any = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: params.email, name: params.candidateName }],
    subject: `${params.companyName}: Interview Scheduled - ${params.jobTitle}`,
    htmlContent: htmlTemplate
  };

  // Add Reply-To if company contact email is provided
  if (params.contactEmail) {
    emailData.replyTo = { email: params.contactEmail, name: params.companyName };
  }

  return sendBrevoEmail(emailData);
};

interface SendRejectionEmailParams {
  email: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  feedback?: string;
  encouragement?: boolean;
  customEmailContent?: string;
  contactEmail?: string;
}

export const sendRejectionEmail = async (params: SendRejectionEmailParams): Promise<boolean> => {
  // Convert custom email content - preserve all line breaks
  const emailMessage = params.customEmailContent
    ? `<div style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">${
        params.customEmailContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      }</div>`
    : `<p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 12px 0;">
         Thank you for your interest in the <strong>${params.jobTitle}</strong> position at <strong>${params.companyName}</strong> and for taking the time to complete your application.
       </p>
       <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 16px 0;">
         After careful consideration, we have decided to proceed with other candidates whose qualifications more closely match our requirements. We appreciate the effort you invested in this opportunity.
       </p>`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 6px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color: #64748b; padding: 24px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Application Update</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 30px;">
                  <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Dear ${params.candidateName},</p>
                  ${emailMessage}

                  <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 12px 0 0 0;">
                    We encourage you to apply for future opportunities with us. We wish you success in your career search and thank you for your interest in ${params.companyName}.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 16px 30px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 11px; line-height: 16px; margin: 0; text-align: center;">
                    ${params.companyName} | &copy; ${new Date().getFullYear()} JobConnect
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailData: any = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: params.email, name: params.candidateName }],
    subject: `${params.companyName}: Application Update - ${params.jobTitle}`,
    htmlContent: htmlTemplate
  };

  // Add Reply-To if company contact email is provided
  if (params.contactEmail) {
    emailData.replyTo = { email: params.contactEmail, name: params.companyName };
  }

  return sendBrevoEmail(emailData);
};

interface SendHiredEmailParams {
  email: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  customEmailContent?: string;
  contactEmail?: string;
}

export const sendHiredEmail = async (params: SendHiredEmailParams): Promise<boolean> => {
  // Convert custom email content - preserve all line breaks
  const emailMessage = params.customEmailContent
    ? `<div style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0;">${
        params.customEmailContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      }</div>`
    : `<p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0 0 12px 0;">
         We are pleased to offer you the position of <strong>${params.jobTitle}</strong> at <strong>${params.companyName}</strong>.
       </p>
       <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0;">
         Your qualifications and experience make you an excellent fit for our team, and we look forward to having you join us. You will receive a formal offer letter with all details within the next 1-2 weeks.
       </p>`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Offer</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 6px; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color: #7c3aed; padding: 24px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Congratulations!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 30px;">
                  <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Dear ${params.candidateName},</p>
                  ${emailMessage}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 16px 30px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 11px; line-height: 16px; margin: 0; text-align: center;">
                    ${params.companyName} | &copy; ${new Date().getFullYear()} JobConnect
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const emailData: any = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: params.email, name: params.candidateName }],
    subject: `${params.companyName}: Job Offer - ${params.jobTitle}`,
    htmlContent: htmlTemplate
  };

  // Add Reply-To if company contact email is provided
  if (params.contactEmail) {
    emailData.replyTo = { email: params.contactEmail, name: params.companyName };
  }

  return sendBrevoEmail(emailData);
};

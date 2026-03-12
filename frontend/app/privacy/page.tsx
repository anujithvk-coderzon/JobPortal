'use client';


import { Shield, Lock, Eye, Database, Users, Mail, FileText, Globe, Cookie } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Last updated: March 10, 2026
          </p>
        </div>

        <div className="space-y-4">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Introduction</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Welcome to Job Portal, operated by Job Portal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting
                your personal information and your right to privacy. This Privacy Policy explains how we collect,
                use, store, share, and safeguard your information when you use our Platform.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                By registering for an account and using our Platform, you consent to the collection and use of
                your information as described in this policy. If you do not agree with our practices,
                please do not use our Platform.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Database className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Information We Collect</h2>
            </div>
            <div className="space-y-3 pl-9">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Information You Provide</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                  We collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li><span className="font-medium text-foreground">Register for an account:</span> Name, email address, password, phone number (optional), location (optional)</li>
                  <li><span className="font-medium text-foreground">Complete your profile:</span> Headline, bio, portfolio URL, GitHub URL, LinkedIn URL, personal website</li>
                  <li><span className="font-medium text-foreground">Upload files:</span> Profile photo (image), resume (PDF/DOCX)</li>
                  <li><span className="font-medium text-foreground">Add professional details:</span> Work experience (title, company, dates, description), education (institution, degree, dates), skills and proficiency levels</li>
                  <li><span className="font-medium text-foreground">Create company profiles:</span> Company name, location, contact email, phone, logo, website, industry, description, social media links</li>
                  <li><span className="font-medium text-foreground">Post jobs:</span> Job title, description, qualifications, skills, salary information, location</li>
                  <li><span className="font-medium text-foreground">Apply for jobs:</span> Cover letter, additional information, resume</li>
                  <li><span className="font-medium text-foreground">Create community posts:</span> Title, description, images, videos, external links</li>
                  <li><span className="font-medium text-foreground">Report content:</span> Reason and description of the reported content</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[13px] font-medium mb-1">Information Collected Automatically</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                  When you access our Platform, we may automatically collect:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li>Device information (browser type, operating system)</li>
                  <li>Usage data (pages visited, features used)</li>
                  <li>Authentication tokens for maintaining your session</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[13px] font-medium mb-1">Third-Party Authentication</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  When you sign in using Google Sign-In, we receive your name, email address, and profile photo
                  from Google. We do not have access to your Google password or any other Google account data.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Eye className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">How We Use Your Information</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Account Management:</span> To create and manage your account, verify your identity, and authenticate your sessions</li>
                <li><span className="font-medium text-foreground">Platform Services:</span> To enable you to post jobs, apply for positions, create company profiles, and use community features</li>
                <li><span className="font-medium text-foreground">Job Matching:</span> To match your profile with relevant job opportunities based on your skills, experience, and preferences</li>
                <li><span className="font-medium text-foreground">Communication:</span> To send you verification codes, application status updates, interview notifications, and important Platform notices via email</li>
                <li><span className="font-medium text-foreground">Content Moderation:</span> To review and moderate community posts and job listings for compliance with our Terms of Service</li>
                <li><span className="font-medium text-foreground">Security:</span> To detect and prevent fraud, abuse, unauthorized access, and security incidents</li>
                <li><span className="font-medium text-foreground">Improvement:</span> To understand how users interact with our Platform and improve our services</li>
                <li><span className="font-medium text-foreground">Legal Compliance:</span> To comply with applicable legal obligations and enforce our Terms of Service</li>
              </ul>
            </div>
          </section>

          <div className="border-t" />

          {/* Data Storage and Transfer */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Data Storage and International Transfer</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Your data is stored and processed using cloud infrastructure. To deliver our services reliably
                and with optimal performance, we use servers and data centres that may be located outside of India,
                including but not limited to Southeast Asia and Europe.
              </p>
              <div>
                <h3 className="text-[13px] font-medium mb-1">File Storage</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Uploaded files including profile photos, resumes, company logos, and community post media (images and videos)
                  are stored using third-party content delivery networks (CDNs). These CDN servers may be located in
                  regions outside India to ensure fast and reliable delivery of your content.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Database and Caching</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Your account data, profile information, job postings, and application data are stored in our
                  database hosted on cloud infrastructure. Session and temporary data (such as verification codes
                  and authentication tokens) are stored in our caching layer.
                </p>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                By using our Platform, you consent to the transfer of your data to servers located outside India.
                We ensure that our service providers maintain appropriate security standards to protect your data.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Information Sharing */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Information Sharing and Disclosure</h2>
            </div>
            <div className="space-y-3 pl-9">
              <div>
                <h3 className="text-[13px] font-medium mb-1">With Other Users</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Your profile information is visible to other users based on your privacy settings.
                  You control what information is public through your privacy dashboard. When you apply for a job,
                  your application details and relevant profile information (including your resume if submitted)
                  are shared with the employer who posted the job.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">With Service Providers</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                  We share your information with trusted third-party service providers who assist us in operating our Platform:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li><span className="font-medium text-foreground">Email delivery:</span> Your email address is shared with our email service provider to send verification codes, notifications, and Platform communications</li>
                  <li><span className="font-medium text-foreground">Authentication:</span> When you use Google Sign-In, your authentication data is processed through Google&apos;s authentication services</li>
                  <li><span className="font-medium text-foreground">File storage:</span> Uploaded files are stored with our CDN provider</li>
                  <li><span className="font-medium text-foreground">Cloud hosting:</span> Your data is stored on our cloud hosting provider&apos;s infrastructure</li>
                </ul>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5">
                  These service providers are bound by their own privacy policies and are only permitted to use
                  your data as necessary to provide services to us.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Legal Requirements</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We may disclose your information if required by law, court order, or governmental authority,
                  or if we believe in good faith that disclosure is necessary to protect our rights, your safety,
                  the safety of others, or to investigate fraud or respond to a government request.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Business Transfers</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  In the event of a merger, acquisition, reorganization, or sale of assets, your information
                  may be transferred to the acquiring entity. We will notify you of any such change.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">We Do Not Sell Your Data</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Your Privacy Rights */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Lock className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Your Privacy Rights and Controls</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Access:</span> You can view your personal information from your profile page at any time</li>
                <li><span className="font-medium text-foreground">Correction:</span> You can update or correct your information through your profile settings</li>
                <li><span className="font-medium text-foreground">Deletion:</span> You can request deletion of your account and associated data by contacting us</li>
                <li><span className="font-medium text-foreground">Privacy Settings:</span> Control what profile information is visible to other users through your privacy dashboard</li>
                <li><span className="font-medium text-foreground">Salary Visibility:</span> As an employer, you can choose whether to display salary information on your job postings</li>
                <li><span className="font-medium text-foreground">Resume Control:</span> You can upload, replace, or delete your resume at any time</li>
                <li><span className="font-medium text-foreground">Withdraw Consent:</span> You may withdraw consent for data processing by deleting your account, though this will terminate your access to the Platform</li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5">
                To exercise any of these rights, contact us at contact@coderzon.com. We will respond to your request
                within a reasonable time frame, and in any case within 30 days.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Data Security</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li>All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
                <li>Passwords are hashed using industry-standard algorithms and are never stored in plain text</li>
                <li>Authentication uses short-lived access tokens with secure refresh mechanisms</li>
                <li>Refresh tokens are stored in HTTP-only cookies that are not accessible to client-side scripts</li>
                <li>Rate limiting is applied to prevent brute-force attacks on authentication endpoints</li>
                <li>Email verification is required during registration to confirm account ownership</li>
                <li>Admin actions are logged for audit and accountability purposes</li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                While we implement these safeguards, no method of electronic transmission or storage is 100% secure.
                We cannot guarantee absolute security of your data but are committed to using commercially
                reasonable measures to protect it.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Cookie className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Cookies and Local Storage</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We use the following browser storage mechanisms:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li>
                  <span className="font-medium text-foreground">HTTP-Only Cookies:</span> We use secure, HTTP-only cookies to store refresh tokens
                  for session management. These cookies are not accessible to JavaScript and are used solely
                  for maintaining your authenticated session.
                </li>
                <li>
                  <span className="font-medium text-foreground">Local Storage:</span> We store only your authentication access token in browser
                  local storage to enable API communication. No personal information (name, email, phone, etc.)
                  is stored in local storage.
                </li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We do not use third-party advertising or tracking cookies. You can clear cookies through your
                browser settings, but doing so will require you to log in again.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Database className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Data Retention</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active and as necessary
                to provide our services. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Active accounts:</span> Data is retained for the duration of your account</li>
                <li><span className="font-medium text-foreground">Deleted accounts:</span> Account data may initially be soft-deleted (marked as deleted but retained temporarily) before permanent deletion within 30 days</li>
                <li><span className="font-medium text-foreground">Uploaded files:</span> Profile photos, resumes, and other uploaded files are deleted from our storage when you remove them or when your account is permanently deleted</li>
                <li><span className="font-medium text-foreground">Application records:</span> Job applications and related communications may be retained for up to 2 years for record-keeping and dispute resolution purposes</li>
                <li><span className="font-medium text-foreground">Moderation logs:</span> Records of content moderation actions may be retained for compliance purposes</li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We may retain certain information longer if required by law or to resolve disputes.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Children's Privacy */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Children&apos;s Privacy</h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Our Platform is not intended for users under 16 years of age. We do not knowingly collect
              personal information from children under 16. If you are a parent or guardian and believe
              your child has provided us with personal information, please contact us at contact@coderzon.com
              so we can take appropriate action to delete such information.
            </p>
          </section>

          <div className="border-t" />

          {/* Changes to Policy */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Changes to This Privacy Policy</h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, or legal requirements. We will notify you of any material changes by posting
              the updated policy on this page with a new &quot;Last updated&quot; date. For significant changes,
              we may also send a notification via email. Your continued use of the Platform after changes
              become effective constitutes acceptance of the revised policy.
            </p>
          </section>

          <div className="border-t" />

          {/* Grievance Officer */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Grievance Officer</h2>
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                In accordance with the Information Technology Act, 2000 and the Information Technology
                (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the details of the
                Grievance Officer are:
              </p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Any grievances or complaints regarding the processing of your personal data or privacy concerns
                will be acknowledged within 24 hours and resolved within 15 days from the date of receipt.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Contact Information */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Contact Us</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1.5">
                If you have questions or concerns about this Privacy Policy, your data, or our privacy practices,
                please contact us:
              </p>
              <div className="text-[13px] text-muted-foreground space-y-0.5">
                <p><span className="font-medium text-foreground">Email:</span> contact@coderzon.com</p>
                <p><span className="font-medium text-foreground">Privacy Dashboard:</span> Manage your privacy settings from your profile page</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 p-3 rounded-lg border bg-muted/50">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By using our Platform, you acknowledge that you have read and understood this Privacy Policy
            and consent to the collection, use, and processing of your information as described herein.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, Users, Mail, FileText, Globe, Cookie } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Last updated: March 10, 2026
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Welcome to Job Portal, operated by Job Portal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting
                your personal information and your right to privacy. This Privacy Policy explains how we collect,
                use, store, share, and safeguard your information when you use our Platform.
              </p>
              <p className="text-muted-foreground">
                By registering for an account and using our Platform, you consent to the collection and use of
                your information as described in this policy. If you do not agree with our practices,
                please do not use our Platform.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Information You Provide</h3>
                <p className="text-muted-foreground mb-2">
                  We collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Register for an account:</strong> Name, email address, password, phone number (optional), location (optional)</li>
                  <li><strong>Complete your profile:</strong> Headline, bio, portfolio URL, GitHub URL, LinkedIn URL, personal website</li>
                  <li><strong>Upload files:</strong> Profile photo (image), resume (PDF/DOCX)</li>
                  <li><strong>Add professional details:</strong> Work experience (title, company, dates, description), education (institution, degree, dates), skills and proficiency levels</li>
                  <li><strong>Create company profiles:</strong> Company name, location, contact email, phone, logo, website, industry, description, social media links</li>
                  <li><strong>Post jobs:</strong> Job title, description, qualifications, skills, salary information, location</li>
                  <li><strong>Apply for jobs:</strong> Cover letter, additional information, resume</li>
                  <li><strong>Create community posts:</strong> Title, description, images, videos, external links</li>
                  <li><strong>Report content:</strong> Reason and description of the reported content</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Information Collected Automatically</h3>
                <p className="text-muted-foreground mb-2">
                  When you access our Platform, we may automatically collect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>Usage data (pages visited, features used)</li>
                  <li>Authentication tokens for maintaining your session</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Third-Party Authentication</h3>
                <p className="text-muted-foreground">
                  When you sign in using Google Sign-In, we receive your name, email address, and profile photo
                  from Google. We do not have access to your Google password or any other Google account data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Account Management:</strong> To create and manage your account, verify your identity, and authenticate your sessions</li>
                <li><strong>Platform Services:</strong> To enable you to post jobs, apply for positions, create company profiles, and use community features</li>
                <li><strong>Job Matching:</strong> To match your profile with relevant job opportunities based on your skills, experience, and preferences</li>
                <li><strong>Communication:</strong> To send you verification codes, application status updates, interview notifications, and important Platform notices via email</li>
                <li><strong>Content Moderation:</strong> To review and moderate community posts and job listings for compliance with our Terms of Service</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, unauthorized access, and security incidents</li>
                <li><strong>Improvement:</strong> To understand how users interact with our Platform and improve our services</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable legal obligations and enforce our Terms of Service</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Storage and Transfer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Data Storage and International Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your data is stored and processed using cloud infrastructure. To deliver our services reliably
                and with optimal performance, we use servers and data centres that may be located outside of India,
                including but not limited to Southeast Asia and Europe.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-2">File Storage</h3>
                <p className="text-muted-foreground">
                  Uploaded files including profile photos, resumes, company logos, and community post media (images and videos)
                  are stored using third-party content delivery networks (CDNs). These CDN servers may be located in
                  regions outside India to ensure fast and reliable delivery of your content.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Database and Caching</h3>
                <p className="text-muted-foreground">
                  Your account data, profile information, job postings, and application data are stored in our
                  database hosted on cloud infrastructure. Session and temporary data (such as verification codes
                  and authentication tokens) are stored in our caching layer.
                </p>
              </div>

              <p className="text-muted-foreground">
                By using our Platform, you consent to the transfer of your data to servers located outside India.
                We ensure that our service providers maintain appropriate security standards to protect your data.
              </p>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">With Other Users</h3>
                <p className="text-muted-foreground">
                  Your profile information is visible to other users based on your privacy settings.
                  You control what information is public through your privacy dashboard. When you apply for a job,
                  your application details and relevant profile information (including your resume if submitted)
                  are shared with the employer who posted the job.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">With Service Providers</h3>
                <p className="text-muted-foreground mb-2">
                  We share your information with trusted third-party service providers who assist us in operating our Platform:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Email delivery:</strong> Your email address is shared with our email service provider to send verification codes, notifications, and Platform communications</li>
                  <li><strong>Authentication:</strong> When you use Google Sign-In, your authentication data is processed through Google&apos;s authentication services</li>
                  <li><strong>File storage:</strong> Uploaded files are stored with our CDN provider</li>
                  <li><strong>Cloud hosting:</strong> Your data is stored on our cloud hosting provider&apos;s infrastructure</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  These service providers are bound by their own privacy policies and are only permitted to use
                  your data as necessary to provide services to us.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Legal Requirements</h3>
                <p className="text-muted-foreground">
                  We may disclose your information if required by law, court order, or governmental authority,
                  or if we believe in good faith that disclosure is necessary to protect our rights, your safety,
                  the safety of others, or to investigate fraud or respond to a government request.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Business Transfers</h3>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, reorganization, or sale of assets, your information
                  may be transferred to the acquiring entity. We will notify you of any such change.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">We Do Not Sell Your Data</h3>
                <p className="text-muted-foreground">
                  We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Privacy Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Your Privacy Rights and Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Access:</strong> You can view your personal information from your profile page at any time</li>
                <li><strong>Correction:</strong> You can update or correct your information through your profile settings</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us</li>
                <li><strong>Privacy Settings:</strong> Control what profile information is visible to other users through your privacy dashboard</li>
                <li><strong>Salary Visibility:</strong> As an employer, you can choose whether to display salary information on your job postings</li>
                <li><strong>Resume Control:</strong> You can upload, replace, or delete your resume at any time</li>
                <li><strong>Withdraw Consent:</strong> You may withdraw consent for data processing by deleting your account, though this will terminate your access to the Platform</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise any of these rights, contact us at contact@coderzon.com. We will respond to your request
                within a reasonable time frame, and in any case within 30 days.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
                <li>Passwords are hashed using industry-standard algorithms and are never stored in plain text</li>
                <li>Authentication uses short-lived access tokens with secure refresh mechanisms</li>
                <li>Refresh tokens are stored in HTTP-only cookies that are not accessible to client-side scripts</li>
                <li>Rate limiting is applied to prevent brute-force attacks on authentication endpoints</li>
                <li>Email verification is required during registration to confirm account ownership</li>
                <li>Admin actions are logged for audit and accountability purposes</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                While we implement these safeguards, no method of electronic transmission or storage is 100% secure.
                We cannot guarantee absolute security of your data but are committed to using commercially
                reasonable measures to protect it.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookies and Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use the following browser storage mechanisms:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>HTTP-Only Cookies:</strong> We use secure, HTTP-only cookies to store refresh tokens
                  for session management. These cookies are not accessible to JavaScript and are used solely
                  for maintaining your authenticated session.
                </li>
                <li>
                  <strong>Local Storage:</strong> We store only your authentication access token in browser
                  local storage to enable API communication. No personal information (name, email, phone, etc.)
                  is stored in local storage.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do not use third-party advertising or tracking cookies. You can clear cookies through your
                browser settings, but doing so will require you to log in again.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active and as necessary
                to provide our services. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Active accounts:</strong> Data is retained for the duration of your account</li>
                <li><strong>Deleted accounts:</strong> Account data may initially be soft-deleted (marked as deleted but retained temporarily) before permanent deletion within 30 days</li>
                <li><strong>Uploaded files:</strong> Profile photos, resumes, and other uploaded files are deleted from our storage when you remove them or when your account is permanently deleted</li>
                <li><strong>Application records:</strong> Job applications and related communications may be retained for up to 2 years for record-keeping and dispute resolution purposes</li>
                <li><strong>Moderation logs:</strong> Records of content moderation actions may be retained for compliance purposes</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We may retain certain information longer if required by law or to resolve disputes.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children&apos;s Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our Platform is not intended for users under 16 years of age. We do not knowingly collect
                personal information from children under 16. If you are a parent or guardian and believe
                your child has provided us with personal information, please contact us at contact@coderzon.com
                so we can take appropriate action to delete such information.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, or legal requirements. We will notify you of any material changes by posting
                the updated policy on this page with a new &quot;Last updated&quot; date. For significant changes,
                we may also send a notification via email. Your continued use of the Platform after changes
                become effective constitutes acceptance of the revised policy.
              </p>
            </CardContent>
          </Card>

          {/* Grievance Officer */}
          <Card>
            <CardHeader>
              <CardTitle>Grievance Officer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                In accordance with the Information Technology Act, 2000 and the Information Technology
                (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the details of the
                Grievance Officer are:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> contact@coderzon.com</p>
              </div>
              <p className="text-muted-foreground mt-3">
                Any grievances or complaints regarding the processing of your personal data or privacy concerns
                will be acknowledged within 24 hours and resolved within 15 days from the date of receipt.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                If you have questions or concerns about this Privacy Policy, your data, or our privacy practices,
                please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> contact@coderzon.com</p>
                <p><strong>Privacy Dashboard:</strong> Manage your privacy settings from your profile page</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 md:mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            By using our Platform, you acknowledge that you have read and understood this Privacy Policy
            and consent to the collection, use, and processing of your information as described herein.
          </p>
        </div>
      </div>
    </div>
  );
}

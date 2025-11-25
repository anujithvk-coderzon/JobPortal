'use client';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, Users, Mail, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6">
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
                Welcome to our Job Posting Platform. We are committed to protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-muted-foreground">
                By using our platform, you agree to the collection and use of information in accordance with this policy.
                If you do not agree with our policies and practices, please do not use our platform.
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
                <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
                <p className="text-muted-foreground mb-2">
                  We collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Register for an account (name, email address, password)</li>
                  <li>Complete your profile (phone number, location, bio, headline)</li>
                  <li>Upload your resume or profile photo</li>
                  <li>Add work experience, education, and skills</li>
                  <li>Post job listings or community content</li>
                  <li>Apply for jobs</li>
                  <li>Communicate with us or other users</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Automatically Collected Information</h3>
                <p className="text-muted-foreground mb-2">
                  When you access our platform, we automatically collect certain information:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, features used)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Authentication tokens for maintaining your session</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Third-Party Authentication</h3>
                <p className="text-muted-foreground">
                  When you sign in using Google OAuth, we receive your name, email address, and profile photo from Google.
                  We do not have access to your Google password.
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
                <li><strong>Account Management:</strong> To create and manage your account, authenticate your identity</li>
                <li><strong>Job Matching:</strong> To match your profile with relevant job opportunities using our matching algorithm</li>
                <li><strong>Communication:</strong> To send you job alerts, application updates, and important platform notifications</li>
                <li><strong>Platform Features:</strong> To enable you to post jobs, apply for positions, and participate in community discussions</li>
                <li><strong>Analytics:</strong> To understand how users interact with our platform and improve our services</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms of service</li>
                <li><strong>Privacy Controls:</strong> To honor your privacy settings and control what information is visible to others</li>
              </ul>
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
                  your application and relevant profile information are shared with the employer.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">With Service Providers</h3>
                <p className="text-muted-foreground mb-2">
                  We share your information with trusted third-party service providers who assist us in:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Cloud hosting and data storage (Firebase)</li>
                  <li>Email delivery services (Brevo)</li>
                  <li>Authentication services (Google OAuth)</li>
                  <li>Analytics and performance monitoring</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Legal Requirements</h3>
                <p className="text-muted-foreground">
                  We may disclose your information if required by law, court order, or governmental request,
                  or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Business Transfers</h3>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.
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
                <li><strong>Access:</strong> You can view and download your personal information from your profile</li>
                <li><strong>Correction:</strong> You can update or correct your information at any time through your profile settings</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and associated data</li>
                <li><strong>Privacy Settings:</strong> Control what information is visible to others through your privacy dashboard</li>
                <li><strong>Email Preferences:</strong> Opt out of promotional emails while still receiving important account notifications</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where consent was the basis</li>
              </ul>
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
                <li>Encryption of data in transit using HTTPS/SSL</li>
                <li>Secure password hashing using bcrypt</li>
                <li>JWT-based authentication with secure token storage</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure cloud infrastructure (Firebase)</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your information,
                we cannot guarantee absolute security.
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
            <CardContent>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes
                outlined in this privacy policy. When you delete your account, we will delete or anonymize your personal information
                within 30 days, except where we are required to retain it for legal or compliance purposes.
              </p>
              <p className="text-muted-foreground mt-3">
                Job applications and related communications may be retained for up to 2 years for record-keeping purposes.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your experience, maintain your session,
                and analyze platform usage. You can control cookie preferences through your browser settings, but
                disabling cookies may limit certain platform features.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our platform is not intended for users under 16 years of age. We do not knowingly collect personal
                information from children. If you believe we have collected information from a child, please contact us
                immediately so we can delete it.
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
                We may update this privacy policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date. Your continued use of the
                platform after changes become effective constitutes acceptance of the revised policy.
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
                If you have questions or concerns about this privacy policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> privacy@jobplatform.com</p>
                <p><strong>Privacy Dashboard:</strong> Manage your privacy settings in your profile</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            By using our platform, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

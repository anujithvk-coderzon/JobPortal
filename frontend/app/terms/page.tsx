'use client';

import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, AlertTriangle, UserCheck, FileText, Shield, Ban, Mail } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Scale className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Agreement to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                These Terms of Service constitute a legally binding agreement between you and our Job Posting Platform.
                By accessing or using our platform, you agree to be bound by these terms.
              </p>
              <p className="text-muted-foreground">
                If you do not agree with any part of these terms, you must not use our platform.
                We reserve the right to update these terms at any time, and your continued use of the platform
                constitutes acceptance of any changes.
              </p>
            </CardContent>
          </Card>

          {/* User Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                User Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                To use our platform, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Be at least 16 years of age</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Not have been previously banned or suspended from the platform</li>
                <li>Comply with all applicable local, state, national, and international laws</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You are responsible for all activities that occur under your account. If you believe your account
                has been compromised, you must notify us immediately.
              </p>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Account Creation</h3>
                <p className="text-muted-foreground">
                  When you create an account, you agree to provide accurate information and keep it updated.
                  You may register using email/password or through Google OAuth authentication.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Account Security</h3>
                <p className="text-muted-foreground">
                  You are solely responsible for maintaining the confidentiality of your password and account.
                  You must notify us immediately of any unauthorized access or security breach.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Account Termination</h3>
                <p className="text-muted-foreground">
                  You may delete your account at any time through your profile settings.
                  We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Services */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Our platform provides the following services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Job Posting:</strong> Employers can post job opportunities and manage applications</li>
                <li><strong>Job Search:</strong> Job seekers can search, filter, and apply for positions</li>
                <li><strong>Profile Management:</strong> Users can create and maintain professional profiles</li>
                <li><strong>Job Matching:</strong> Our algorithm matches candidates with suitable opportunities</li>
                <li><strong>Community Features:</strong> Users can share insights and experiences through community posts</li>
                <li><strong>Application Tracking:</strong> Track the status of job applications</li>
                <li><strong>Privacy Controls:</strong> Manage visibility of personal information</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Responsibilities and Conduct
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                When using our platform, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide truthful and accurate information in your profile, job postings, and applications</li>
                <li>Not impersonate any person or entity, or falsely represent your affiliation</li>
                <li>Not post false, misleading, or fraudulent job listings</li>
                <li>Not discriminate based on race, gender, age, religion, disability, or other protected characteristics</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Not use the platform for any unlawful purpose or to violate any laws</li>
                <li>Not attempt to gain unauthorized access to our systems or other user accounts</li>
                <li>Not upload viruses, malware, or other harmful code</li>
                <li>Not scrape, harvest, or collect user data without permission</li>
                <li>Not spam, harass, or abuse other users</li>
              </ul>
            </CardContent>
          </Card>

          {/* Job Postings */}
          <Card>
            <CardHeader>
              <CardTitle>Job Postings and Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Employer Obligations</h3>
                <p className="text-muted-foreground mb-2">
                  Employers posting jobs must:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Ensure job postings are legitimate and accurate</li>
                  <li>Comply with all employment laws and regulations</li>
                  <li>Not engage in discriminatory hiring practices</li>
                  <li>Respond to applications in a timely and professional manner</li>
                  <li>Not collect excessive or unnecessary personal information</li>
                  <li>Protect applicant data in accordance with privacy laws</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Job Seeker Obligations</h3>
                <p className="text-muted-foreground mb-2">
                  Job seekers must:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Provide truthful information in applications and resumes</li>
                  <li>Only apply for positions they are genuinely interested in</li>
                  <li>Respect the hiring process and employer timelines</li>
                  <li>Not submit spam or fraudulent applications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Platform Role</h3>
                <p className="text-muted-foreground">
                  We are a platform connecting employers and job seekers. We are not responsible for the hiring decisions,
                  employment relationships, or outcomes that result from use of our platform. All employment agreements
                  are between the employer and candidate.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Ownership */}
          <Card>
            <CardHeader>
              <CardTitle>Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Your Content</h3>
                <p className="text-muted-foreground">
                  You retain ownership of all content you post on our platform (profile information, resumes, job postings,
                  community posts). By posting content, you grant us a non-exclusive, worldwide, royalty-free license to
                  use, display, and distribute your content as necessary to provide our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Our Content</h3>
                <p className="text-muted-foreground">
                  All platform features, design, code, logos, and trademarks are owned by us and protected by intellectual
                  property laws. You may not copy, modify, or distribute our content without permission.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Content Moderation</h3>
                <p className="text-muted-foreground">
                  We reserve the right to remove any content that violates these terms, is illegal, or is otherwise objectionable.
                  This includes job postings, community posts, profiles, and other user-generated content.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Posting fraudulent or scam job listings</li>
                <li>Requesting payment or personal financial information from job applicants</li>
                <li>Multi-level marketing or pyramid scheme opportunities</li>
                <li>Adult content or services</li>
                <li>Illegal goods or services</li>
                <li>Automated scraping or data harvesting</li>
                <li>Creating multiple accounts to manipulate the platform</li>
                <li>Reverse engineering or attempting to access our source code</li>
                <li>Interfering with platform security or functionality</li>
                <li>Harassment, hate speech, or threatening behavior</li>
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Disclaimers and Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Service Availability</h3>
                <p className="text-muted-foreground">
                  Our platform is provided "as is" and "as available." We do not guarantee uninterrupted access,
                  and the platform may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">No Warranty</h3>
                <p className="text-muted-foreground">
                  We make no warranties about the accuracy, reliability, or completeness of content on our platform.
                  Job postings, user profiles, and other content are provided by users and we do not verify their accuracy.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, we are not liable for any indirect, incidental, special,
                  consequential, or punitive damages arising from your use of the platform. This includes but is not
                  limited to lost profits, data loss, or employment disputes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Third-Party Links</h3>
                <p className="text-muted-foreground">
                  Our platform may contain links to third-party websites or services. We are not responsible for the
                  content, privacy practices, or actions of third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle>Indemnification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You agree to indemnify and hold us harmless from any claims, damages, losses, liabilities, and expenses
                (including legal fees) arising from your use of the platform, violation of these terms, or infringement
                of any third-party rights.
              </p>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Governing Law</h3>
                <p className="text-muted-foreground">
                  These terms are governed by the laws of your jurisdiction, without regard to conflict of law principles.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Informal Resolution</h3>
                <p className="text-muted-foreground">
                  If you have a dispute with us, you agree to first contact us and attempt to resolve the issue informally.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Arbitration</h3>
                <p className="text-muted-foreground">
                  If informal resolution fails, disputes will be resolved through binding arbitration rather than in court,
                  except where prohibited by law.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Account Termination and Suspension</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                We reserve the right to suspend or terminate your account:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>For violation of these terms</li>
                <li>For fraudulent or illegal activity</li>
                <li>For abuse of platform features or other users</li>
                <li>For prolonged inactivity</li>
                <li>At our discretion for any reason with notice</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Upon termination, your right to use the platform ceases immediately. We may delete your account data
                in accordance with our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may modify these terms at any time. Material changes will be notified through the platform or via email.
                Your continued use of the platform after changes become effective constitutes acceptance of the revised terms.
                If you do not agree with the changes, you must stop using the platform and may delete your account.
              </p>
            </CardContent>
          </Card>

          {/* Miscellaneous */}
          <Card>
            <CardHeader>
              <CardTitle>Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold mb-1">Severability</h3>
                <p className="text-muted-foreground text-sm">
                  If any provision of these terms is found to be unenforceable, the remaining provisions will remain in effect.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Entire Agreement</h3>
                <p className="text-muted-foreground text-sm">
                  These terms constitute the entire agreement between you and us regarding use of the platform.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">No Waiver</h3>
                <p className="text-muted-foreground text-sm">
                  Our failure to enforce any provision does not constitute a waiver of that provision.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Assignment</h3>
                <p className="text-muted-foreground text-sm">
                  You may not transfer your rights under these terms. We may assign our rights to any successor or affiliate.
                </p>
              </div>
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
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> contact@coderzon.com</p>
                <p><strong>Support:</strong> Contact us through the platform help center</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 md:mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

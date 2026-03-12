'use client';


import { Scale, AlertTriangle, UserCheck, FileText, Shield, Ban, Mail, Globe } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Terms of Service</h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Last updated: March 10, 2026
          </p>
        </div>

        <div className="space-y-4">
          {/* Agreement to Terms */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Agreement to Terms</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Job Portal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), the operator of the Job Portal platform (&quot;Platform&quot;).
                By accessing or using our Platform, you agree to be bound by these Terms.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                If you do not agree with any part of these Terms, you must not use our Platform.
                We reserve the right to update these Terms at any time. Material changes will be communicated
                via the Platform or email. Your continued use of the Platform after changes become effective
                constitutes acceptance of the revised Terms.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* User Eligibility */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">User Eligibility</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground mb-1.5">
                To use our Platform, you must:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                <li>Be at least 16 years of age</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Not have been previously banned or suspended from the Platform</li>
                <li>Comply with all applicable laws and regulations, including but not limited to the Information Technology Act, 2000 (India) and its amendments</li>
              </ul>
              <p className="text-[13px] text-muted-foreground mt-2">
                You are responsible for all activities that occur under your account. If you believe your account
                has been compromised, you must notify us immediately at contact@coderzon.com.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* User Accounts */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">User Accounts and Registration</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Account Creation</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  When you create an account, you agree to provide accurate information and keep it updated.
                  You may register using your email address and password, or through Google Sign-In. When using Google Sign-In,
                  we receive your name, email address, and profile photo from Google to create your account.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Account Security</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You are solely responsible for maintaining the confidentiality of your password and account.
                  Passwords are stored using industry-standard hashing and are never stored in plain text.
                  You must notify us immediately of any unauthorized access or security breach.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Account Termination</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You may request deletion of your account at any time. Upon deletion, your personal data
                  will be removed in accordance with our Privacy Policy. We reserve the right to suspend or
                  terminate accounts that violate these Terms, with or without notice depending on the severity of the violation.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Platform Services */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Platform Services</h2>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground mb-1.5">
                Our Platform provides the following services:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                <li><span className="font-medium text-foreground">Job Posting:</span> Employers can post job opportunities, manage applications, and communicate with applicants</li>
                <li><span className="font-medium text-foreground">Job Search and Application:</span> Job seekers can search, filter, save, and apply for positions</li>
                <li><span className="font-medium text-foreground">Profile Management:</span> Users can create professional profiles with work experience, education, skills, and uploaded resumes</li>
                <li><span className="font-medium text-foreground">Company Profiles:</span> Employers can create and manage company profiles with relevant business information</li>
                <li><span className="font-medium text-foreground">Community Features:</span> Users can share job-related news, insights, and experiences through community posts</li>
                <li><span className="font-medium text-foreground">Application Tracking:</span> Track the status of job applications including interview scheduling</li>
                <li><span className="font-medium text-foreground">Follow and Network:</span> Users can follow other professionals on the Platform</li>
                <li><span className="font-medium text-foreground">Privacy Controls:</span> Manage visibility of personal information through privacy settings</li>
              </ul>
            </div>
          </section>

          <div className="border-t" />

          {/* Data Storage and International Transfer */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Data Storage and International Transfer</h2>
            </div>
            <div className="space-y-2 pl-9">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                To provide our services reliably and efficiently, your data may be processed and stored on servers
                located outside of India, including but not limited to servers in Southeast Asia and Europe.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Uploaded files such as resumes, profile photos, company logos, and community post media are stored
                using third-party content delivery networks (CDNs) with servers that may be located outside India.
                This enables faster and more reliable file delivery.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                By using our Platform and uploading any content, you expressly consent to the transfer, processing,
                and storage of your data on servers located outside of India. We ensure that appropriate safeguards
                are in place to protect your data regardless of where it is processed.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* User Responsibilities */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">User Responsibilities and Conduct</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground mb-1.5">
                When using our Platform, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                <li>Provide truthful and accurate information in your profile, job postings, and applications</li>
                <li>Not impersonate any person or entity, or falsely represent your affiliation</li>
                <li>Not post false, misleading, or fraudulent job listings</li>
                <li>Not discriminate based on race, gender, age, religion, disability, caste, or other protected characteristics</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Not use the Platform for any unlawful purpose</li>
                <li>Not attempt to gain unauthorized access to our systems or other user accounts</li>
                <li>Not upload viruses, malware, or other harmful code</li>
                <li>Not scrape, harvest, or collect user data without permission</li>
                <li>Not spam, harass, or abuse other users</li>
                <li>Not upload obscene, defamatory, or objectionable content</li>
              </ul>
            </div>
          </section>

          <div className="border-t" />

          {/* Job Postings */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Job Postings and Applications</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Employer Obligations</h3>
                <p className="text-[13px] text-muted-foreground mb-1">
                  Employers posting jobs must:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                  <li>Ensure job postings are legitimate, accurate, and for genuine vacancies</li>
                  <li>Comply with all applicable employment laws and regulations</li>
                  <li>Not engage in discriminatory hiring practices</li>
                  <li>Respond to applications in a timely and professional manner</li>
                  <li>Not collect excessive or unnecessary personal information from applicants</li>
                  <li>Protect applicant data in accordance with applicable data protection laws</li>
                  <li>Not charge applicants any fees for job applications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Job Seeker Obligations</h3>
                <p className="text-[13px] text-muted-foreground mb-1">
                  Job seekers must:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                  <li>Provide truthful information in applications and resumes</li>
                  <li>Only apply for positions they are genuinely interested in</li>
                  <li>Respect the hiring process and employer timelines</li>
                  <li>Not submit spam or fraudulent applications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Platform Role</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We are an intermediary platform connecting employers and job seekers. We do not guarantee employment outcomes.
                  We are not responsible for the hiring decisions, employment relationships, salary negotiations,
                  or outcomes that result from use of our Platform. All employment agreements
                  are solely between the employer and the candidate. We do not verify the identity, credentials,
                  or legitimacy of employers or job seekers unless explicitly stated.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Content Ownership */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Content and Intellectual Property</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Your Content</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You retain ownership of all content you post on our Platform, including profile information, resumes, job postings,
                  and community posts. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to
                  use, display, store, and distribute your content solely as necessary to provide and improve our services.
                  This license terminates when you delete your content or account, except where copies are retained
                  as part of our routine backups or as required by law.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Our Content</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  All Platform features, design, user interface, code, logos, and trademarks are owned by Job Portal
                  and protected by applicable intellectual property laws. You may not copy, modify, distribute,
                  or create derivative works of our content without prior written permission.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Content Moderation</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We reserve the right to review, moderate, and remove any content that violates these Terms, is illegal,
                  is reported by other users, or is otherwise objectionable, at our sole discretion.
                  Community posts are subject to moderation before being published.
                  Users may report content they believe violates these Terms.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Prohibited Activities */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <Ban className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Prohibited Activities</h2>
            </div>
            <div className="pl-9">
              <p className="text-[13px] text-muted-foreground mb-1.5">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                <li>Posting fraudulent, scam, or misleading job listings</li>
                <li>Requesting payment, personal financial information, or sensitive documents (such as Aadhaar, PAN) from job applicants through the Platform</li>
                <li>Multi-level marketing or pyramid scheme opportunities disguised as job postings</li>
                <li>Adult, obscene, or illegal content or services</li>
                <li>Automated scraping, bots, or data harvesting</li>
                <li>Creating multiple accounts to manipulate the Platform</li>
                <li>Reverse engineering or attempting to access our source code or infrastructure</li>
                <li>Interfering with Platform security, availability, or functionality</li>
                <li>Harassment, hate speech, threats, or discriminatory behavior</li>
                <li>Using the Platform to send unsolicited commercial communications (spam)</li>
                <li>Any activity that violates the Information Technology Act, 2000 or any other applicable law</li>
              </ul>
            </div>
          </section>

          <div className="border-t" />

          {/* Disclaimers */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/8">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Disclaimers and Limitations</h2>
            </div>
            <div className="space-y-3 pl-9">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Service Availability</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Our Platform is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted, error-free,
                  or secure access. The Platform may be temporarily unavailable due to maintenance, updates,
                  server issues, or circumstances beyond our control.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">No Warranty</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We make no warranties, express or implied, about the accuracy, reliability, completeness,
                  or suitability of content on our Platform. Job postings, user profiles, company information,
                  and other content are provided by users and we do not independently verify their accuracy.
                  We do not guarantee that using the Platform will result in employment or hiring.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Limitation of Liability</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages arising from your use of the Platform. This includes but is not
                  limited to lost profits, data loss, employment disputes, or any damages resulting from unauthorized
                  access to or alteration of your data. Our total liability for any claim arising from these Terms
                  shall not exceed the amount you paid to us (if any) in the 12 months preceding the claim.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Third-Party Links</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Our Platform may contain links to third-party websites or services (including links shared in community posts
                  and job listings). We are not responsible for the content, privacy practices, or actions of third parties.
                  Accessing third-party links is at your own risk.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Indemnification */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Indemnification</h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless Job Portal, its officers, directors, employees, and agents from
              any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising from
              your use of the Platform, your violation of these Terms, your violation of any applicable law,
              or your infringement of any third-party rights.
            </p>
          </section>

          <div className="border-t" />

          {/* Dispute Resolution */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Dispute Resolution and Governing Law</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium mb-1">Governing Law</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of India,
                  without regard to conflict of law principles.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Jurisdiction</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Any disputes arising from these Terms or your use of the Platform shall be subject to the
                  exclusive jurisdiction of the courts in Ernakulam (Kochi), Kerala, India.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-1">Informal Resolution</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Before initiating any formal proceedings, you agree to first contact us at contact@coderzon.com
                  and attempt to resolve the dispute informally within 30 days.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Termination */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Account Termination and Suspension</h2>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground mb-1.5">
                We reserve the right to suspend or terminate your account:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[13px] text-muted-foreground ml-1">
                <li>For violation of these Terms</li>
                <li>For fraudulent, illegal, or suspicious activity</li>
                <li>For abuse of Platform features or harassment of other users</li>
                <li>Upon receiving valid legal requests or court orders</li>
                <li>At our discretion, with reasonable notice, for any reason</li>
              </ul>
              <p className="text-[13px] text-muted-foreground mt-2">
                Upon termination, your right to use the Platform ceases immediately. We may delete or retain your
                account data in accordance with our Privacy Policy and applicable legal requirements.
                You may also request account deletion at any time.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Grievance Officer */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Grievance Officer</h2>
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-muted-foreground">
                In accordance with the Information Technology Act, 2000 and the rules made thereunder,
                the name and contact details of the Grievance Officer are provided below:
              </p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
              <p className="text-[13px] text-muted-foreground">
                The Grievance Officer shall address any complaints or concerns within 15 days
                from the date of receipt of the complaint.
              </p>
            </div>
          </section>

          <div className="border-t" />

          {/* Miscellaneous */}
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold">Miscellaneous</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-medium mb-0.5">Severability</h3>
                <p className="text-[13px] text-muted-foreground">
                  If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction,
                  the remaining provisions shall remain in full force and effect.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-0.5">Entire Agreement</h3>
                <p className="text-[13px] text-muted-foreground">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and us
                  regarding use of the Platform and supersede all prior agreements.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-0.5">No Waiver</h3>
                <p className="text-[13px] text-muted-foreground">
                  Our failure to enforce any provision of these Terms does not constitute a waiver of that provision
                  or our right to enforce it in the future.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium mb-0.5">Assignment</h3>
                <p className="text-[13px] text-muted-foreground">
                  You may not assign or transfer your rights under these Terms without our prior written consent.
                  We may assign our rights to any successor entity or affiliate.
                </p>
              </div>
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
              <p className="text-[13px] text-muted-foreground mb-1.5">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
            </div>
          </section>
        </div>

        <div className="mt-6 p-3 rounded-lg border bg-muted/50">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

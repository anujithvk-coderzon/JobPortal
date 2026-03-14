'use client';

import Link from 'next/link';
import { Scale, AlertTriangle, UserCheck, FileText, Shield, Ban, Mail, Globe, ArrowLeft, Lock, Laptop, BookOpen, Gavel, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo, LogoSmall } from '@/components/common/Logo';
import { useAuthStore } from '@/store/authStore';

const TermsOfService = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar — only for non-authenticated users */}
      {!isAuthenticated && (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={36} />
              <span className="font-bold text-[17px] tracking-tight">job<span className="text-indigo-500">aye</span></span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex" asChild>
                <Link href="/jobs">Jobs</Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex" asChild>
                <Link href="/community">Community</Link>
              </Button>
              <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
              <Button variant="ghost" size="sm" className="text-[13px]" asChild>
                <Link href="/auth/login">Log In</Link>
              </Button>
              <Button size="sm" className="text-[13px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Header */}
      <section className={`relative overflow-hidden ${!isAuthenticated ? 'border-b border-border/40' : ''}`}>
        {!isAuthenticated && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-slate-200/30 dark:from-slate-800/20 to-transparent rounded-full blur-3xl -translate-y-1/2" />
          </>
        )}
        <div className={`relative ${isAuthenticated ? 'max-w-[1400px]' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8 ${!isAuthenticated ? 'py-16 sm:py-20 text-center' : 'py-6 sm:py-8'}`}>
          {!isAuthenticated && (
            <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          )}
          <h1 className={`font-bold tracking-tight mb-2 ${!isAuthenticated ? 'text-3xl sm:text-4xl' : 'text-lg'}`}>Terms of Service</h1>
          <p className={`text-muted-foreground ${!isAuthenticated ? 'text-[14px]' : 'text-[12px]'}`}>
            Last updated: March 10, 2026{!isAuthenticated && ' — Please read these terms carefully before using jobaye.'}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className={`${isAuthenticated ? 'max-w-[1400px]' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8 ${isAuthenticated ? 'py-4 sm:py-6 lg:py-8' : 'py-12 sm:py-16'}`}>
        <div className="space-y-8">
          {/* Agreement to Terms */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Agreement to Terms</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and jobaye (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
                By accessing or using our Platform, you agree to be bound by these Terms.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                If you do not agree with any part of these Terms, you must not use our Platform.
                We reserve the right to update these Terms at any time. Your continued use constitutes acceptance of the revised Terms.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* User Eligibility */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">User Eligibility</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground mb-2">To use our Platform, you must:</p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                <li>Be at least 16 years of age</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Not have been previously banned or suspended from the Platform</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
              <p className="text-[13px] text-muted-foreground mt-2">
                You are responsible for all activities under your account. If you believe your account
                has been compromised, notify us immediately at contact@coderzon.com.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* User Accounts */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">User Accounts and Registration</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Account Creation</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  When you create an account, you agree to provide accurate information and keep it updated.
                  You may register using your email address and password, or through Google Sign-In.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Account Security</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You are solely responsible for maintaining the confidentiality of your password and account.
                  Passwords are stored using industry-standard hashing and are never stored in plain text.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Account Termination</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You may request deletion of your account at any time. We reserve the right to suspend or
                  terminate accounts that violate these Terms.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Platform Services */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Laptop className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Platform Services</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground mb-2">Our Platform provides the following services:</p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                <li><span className="font-medium text-foreground">Job Posting:</span> Employers can post jobs, manage applications, and communicate with applicants</li>
                <li><span className="font-medium text-foreground">Job Search and Application:</span> Job seekers can search, filter, save, and apply for positions</li>
                <li><span className="font-medium text-foreground">Profile Management:</span> Create professional profiles with work experience, education, and skills</li>
                <li><span className="font-medium text-foreground">Company Profiles:</span> Create and manage company profiles</li>
                <li><span className="font-medium text-foreground">Community Features:</span> Share job-related news, insights, and experiences</li>
                <li><span className="font-medium text-foreground">Application Tracking:</span> Track status including interview scheduling</li>
                <li><span className="font-medium text-foreground">Follow and Network:</span> Follow other professionals on the Platform</li>
                <li><span className="font-medium text-foreground">Privacy Controls:</span> Manage visibility of personal information</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Data Storage */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Globe className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Data Storage and International Transfer</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Your data may be processed and stored on servers located outside of India, including Southeast Asia and Europe.
                Uploaded files are stored using third-party CDNs with servers outside India for faster delivery.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                By using our Platform, you expressly consent to the transfer, processing, and storage of your data
                on servers located outside of India.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* User Responsibilities */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">User Responsibilities and Conduct</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground mb-2">When using our Platform, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                <li>Provide truthful and accurate information</li>
                <li>Not impersonate any person or entity</li>
                <li>Not post false, misleading, or fraudulent job listings</li>
                <li>Not discriminate based on protected characteristics</li>
                <li>Respect intellectual property rights</li>
                <li>Not use the Platform for unlawful purposes</li>
                <li>Not attempt unauthorized access to systems</li>
                <li>Not upload viruses or harmful code</li>
                <li>Not scrape or harvest user data</li>
                <li>Not spam, harass, or abuse other users</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Job Postings */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Job Postings and Applications</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Employer Obligations</h3>
                <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                  <li>Ensure job postings are legitimate and for genuine vacancies</li>
                  <li>Comply with all applicable employment laws</li>
                  <li>Not charge applicants any fees for applications</li>
                  <li>Protect applicant data in accordance with data protection laws</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Job Seeker Obligations</h3>
                <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                  <li>Provide truthful information in applications and resumes</li>
                  <li>Only apply for positions you&apos;re genuinely interested in</li>
                  <li>Not submit spam or fraudulent applications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Platform Role</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We are an intermediary platform. We do not guarantee employment outcomes and are not responsible
                  for hiring decisions or employment relationships between employers and candidates.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Content Ownership */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Content and Intellectual Property</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Your Content</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You retain ownership of all content you post. By posting, you grant us a non-exclusive, worldwide,
                  royalty-free license to use, display, store, and distribute your content as necessary to provide our services.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Our Content</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  All Platform features, design, UI, code, logos, and trademarks are owned by jobaye and protected by applicable IP laws.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Content Moderation</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We reserve the right to review, moderate, and remove any content that violates these Terms.
                  Community posts are subject to moderation. Users may report content they believe violates these Terms.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Prohibited Activities */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Ban className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Prohibited Activities</h2>
            </div>
            <div className="pl-[42px]">
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                <li>Posting fraudulent, scam, or misleading job listings</li>
                <li>Requesting payment or sensitive documents from applicants</li>
                <li>MLM or pyramid scheme postings</li>
                <li>Adult, obscene, or illegal content</li>
                <li>Automated scraping, bots, or data harvesting</li>
                <li>Creating multiple accounts to manipulate the Platform</li>
                <li>Reverse engineering or accessing source code</li>
                <li>Harassment, hate speech, or discriminatory behavior</li>
                <li>Any activity that violates the IT Act, 2000 or applicable law</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Disclaimers */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Disclaimers and Limitations</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Service Availability</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Our Platform is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted, error-free, or secure access.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Limitation of Liability</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages. Our total liability shall not exceed the amount you paid to us (if any)
                  in the 12 months preceding the claim.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Dispute Resolution */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Scale className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Dispute Resolution and Governing Law</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                These Terms shall be governed by the laws of India. Any disputes shall be subject to the
                exclusive jurisdiction of the courts in Ernakulam (Kochi), Kerala, India.
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Before initiating formal proceedings, you agree to contact us at contact@coderzon.com
                and attempt informal resolution within 30 days.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Termination */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Ban className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Account Termination and Suspension</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground mb-2">We reserve the right to suspend or terminate your account:</p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1">
                <li>For violation of these Terms</li>
                <li>For fraudulent, illegal, or suspicious activity</li>
                <li>For abuse of Platform features or harassment</li>
                <li>Upon receiving valid legal requests</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Grievance Officer */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Gavel className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Grievance Officer</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                The Grievance Officer shall address complaints within 15 days from the date of receipt.
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Contact */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Mail className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Contact Us</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground mb-1">Questions about these Terms? Contact us:</p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 p-4 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/20">
          <p className="text-[12px] text-muted-foreground text-center leading-relaxed">
            By using our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>

      {/* Footer — only for non-authenticated users */}
      {!isAuthenticated && (
        <footer className="border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <LogoSmall size={24} />
                <span className="text-[14px] font-bold tracking-tight">job<span className="text-indigo-500">aye</span></span>
              </div>
              <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors font-medium">Terms</Link>
                <span>&copy; {new Date().getFullYear()} jobaye</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default TermsOfService;

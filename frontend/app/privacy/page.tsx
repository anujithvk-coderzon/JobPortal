'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Database, Users, Mail, FileText, Globe, Cookie, ArrowLeft, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo, LogoSmall } from '@/components/common/Logo';
import { useAuthStore } from '@/store/authStore';

const PrivacyPolicy = () => {
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
          <h1 className={`font-bold tracking-tight mb-2 ${!isAuthenticated ? 'text-3xl sm:text-4xl' : 'text-lg'}`}>Privacy Policy</h1>
          <p className={`text-muted-foreground ${!isAuthenticated ? 'text-[14px]' : 'text-[12px]'}`}>
            Last updated: March 10, 2026{!isAuthenticated && ' — How we collect, use, and protect your information.'}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className={`${isAuthenticated ? 'max-w-[1400px]' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8 ${isAuthenticated ? 'py-4 sm:py-6 lg:py-8' : 'py-12 sm:py-16'}`}>
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Introduction</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Welcome to jobaye, operated by jobaye (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting
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

          <div className="border-t border-border/60" />

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Information We Collect</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Information You Provide</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                  We collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li><span className="font-medium text-foreground">Register for an account:</span> Name, email address, password, phone number (optional), location (optional)</li>
                  <li><span className="font-medium text-foreground">Complete your profile:</span> Headline, bio, portfolio URL, GitHub URL, LinkedIn URL, personal website</li>
                  <li><span className="font-medium text-foreground">Upload files:</span> Profile photo (image), resume (PDF/DOCX)</li>
                  <li><span className="font-medium text-foreground">Add professional details:</span> Work experience, education, skills and proficiency levels</li>
                  <li><span className="font-medium text-foreground">Create company profiles:</span> Company name, location, contact email, phone, logo, website, industry, description, social media links</li>
                  <li><span className="font-medium text-foreground">Post jobs:</span> Job title, description, qualifications, skills, salary information, location</li>
                  <li><span className="font-medium text-foreground">Apply for jobs:</span> Cover letter, additional information, resume</li>
                  <li><span className="font-medium text-foreground">Create community posts:</span> Title, description, images, videos, external links</li>
                  <li><span className="font-medium text-foreground">Report content:</span> Reason and description of the reported content</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Information Collected Automatically</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                  When you access our Platform, we may automatically collect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li>Device information (browser type, operating system)</li>
                  <li>Usage data (pages visited, features used)</li>
                  <li>Authentication tokens for maintaining your session</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Third-Party Authentication</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  When you sign in using Google Sign-In, we receive your name, email address, and profile photo
                  from Google. We do not have access to your Google password or any other Google account data.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* How We Use */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">How We Use Your Information</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Account Management:</span> To create and manage your account, verify your identity, and authenticate your sessions</li>
                <li><span className="font-medium text-foreground">Platform Services:</span> To enable you to post jobs, apply for positions, create company profiles, and use community features</li>
                <li><span className="font-medium text-foreground">Job Matching:</span> To match your profile with relevant job opportunities based on your skills, experience, and preferences</li>
                <li><span className="font-medium text-foreground">Communication:</span> To send you verification codes, application status updates, interview notifications, and important Platform notices</li>
                <li><span className="font-medium text-foreground">Content Moderation:</span> To review and moderate community posts and job listings for compliance</li>
                <li><span className="font-medium text-foreground">Security:</span> To detect and prevent fraud, abuse, unauthorized access, and security incidents</li>
                <li><span className="font-medium text-foreground">Improvement:</span> To understand how users interact with our Platform and improve our services</li>
                <li><span className="font-medium text-foreground">Legal Compliance:</span> To comply with applicable legal obligations and enforce our Terms of Service</li>
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
                Your data is stored and processed using cloud infrastructure. To deliver our services reliably
                and with optimal performance, we use servers and data centres that may be located outside of India,
                including but not limited to Southeast Asia and Europe.
              </p>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">File Storage</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Uploaded files including profile photos, resumes, company logos, and community post media
                  are stored using third-party content delivery networks (CDNs). These CDN servers may be located in
                  regions outside India to ensure fast and reliable delivery of your content.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">Database and Caching</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Your account data, profile information, job postings, and application data are stored in our
                  database hosted on cloud infrastructure. Session and temporary data are stored in our caching layer.
                </p>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                By using our Platform, you consent to the transfer of your data to servers located outside India.
                We ensure that our service providers maintain appropriate security standards to protect your data.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Information Sharing */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Information Sharing and Disclosure</h2>
            </div>
            <div className="space-y-4 pl-[42px]">
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">With Other Users</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Your profile information is visible to other users based on your privacy settings.
                  When you apply for a job, your application details and relevant profile information are shared with the employer.
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">With Service Providers</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                  We share your information with trusted third-party service providers:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                  <li><span className="font-medium text-foreground">Email delivery:</span> Your email address is shared with our email service provider</li>
                  <li><span className="font-medium text-foreground">Authentication:</span> Google Sign-In data is processed through Google&apos;s services</li>
                  <li><span className="font-medium text-foreground">File storage:</span> Uploaded files are stored with our CDN provider</li>
                  <li><span className="font-medium text-foreground">Cloud hosting:</span> Your data is stored on our cloud hosting provider&apos;s infrastructure</li>
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold mb-1.5">We Do Not Sell Your Data</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Privacy Rights */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Your Privacy Rights and Controls</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Access:</span> View your personal information from your profile page</li>
                <li><span className="font-medium text-foreground">Correction:</span> Update or correct your information through profile settings</li>
                <li><span className="font-medium text-foreground">Deletion:</span> Request deletion of your account and associated data</li>
                <li><span className="font-medium text-foreground">Privacy Settings:</span> Control what profile information is visible to others</li>
                <li><span className="font-medium text-foreground">Resume Control:</span> Upload, replace, or delete your resume at any time</li>
                <li><span className="font-medium text-foreground">Withdraw Consent:</span> Withdraw consent by deleting your account</li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                To exercise any of these rights, contact us at contact@coderzon.com. We will respond within 30 days.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Data Security</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li>All data encrypted using HTTPS/TLS</li>
                <li>Passwords hashed using industry-standard algorithms</li>
                <li>Short-lived access tokens with secure refresh mechanisms</li>
                <li>HTTP-only cookies for refresh tokens</li>
                <li>Rate limiting on authentication endpoints</li>
                <li>Email verification required during registration</li>
                <li>Admin actions logged for audit purposes</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Cookie className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Cookies and Local Storage</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <ul className="list-disc list-inside space-y-1.5 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">HTTP-Only Cookies:</span> Used for secure session management via refresh tokens</li>
                <li><span className="font-medium text-foreground">Local Storage:</span> Stores only your authentication access token for API communication</li>
              </ul>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We do not use third-party advertising or tracking cookies.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Data Retention</h2>
            </div>
            <div className="space-y-3 pl-[42px]">
              <ul className="list-disc list-inside space-y-1 text-[13px] text-muted-foreground ml-1 leading-relaxed">
                <li><span className="font-medium text-foreground">Active accounts:</span> Data retained for the duration of your account</li>
                <li><span className="font-medium text-foreground">Deleted accounts:</span> Permanently deleted within 30 days</li>
                <li><span className="font-medium text-foreground">Uploaded files:</span> Deleted when removed or upon account deletion</li>
                <li><span className="font-medium text-foreground">Application records:</span> Retained up to 2 years for record-keeping</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Children's Privacy */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Children&apos;s Privacy</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Our Platform is not intended for users under 16 years of age. We do not knowingly collect
                personal information from children under 16.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Changes to This Privacy Policy</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Material changes will be communicated
                via the Platform or email. Your continued use constitutes acceptance of the revised policy.
              </p>
            </div>
          </section>

          <div className="border-t border-border/60" />

          {/* Grievance Officer */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Scale className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <h2 className="text-base font-semibold">Grievance Officer</h2>
            </div>
            <div className="pl-[42px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                In accordance with the Information Technology Act, 2000, grievances will be acknowledged within
                24 hours and resolved within 15 days.
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
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-1">
                If you have questions about this Privacy Policy, contact us:
              </p>
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> contact@coderzon.com
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 p-4 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/20">
          <p className="text-[12px] text-muted-foreground text-center leading-relaxed">
            By using our Platform, you acknowledge that you have read and understood this Privacy Policy
            and consent to the collection, use, and processing of your information as described herein.
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
                <Link href="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <span>&copy; {new Date().getFullYear()} jobaye</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PrivacyPolicy;

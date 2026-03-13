import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { SWRProvider } from "@/lib/swr-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "jobaye - Professional Job Posting Platform",
  description: "Find your dream job or hire top talent. A professional platform connecting job seekers with employers.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <AuthProvider>
          <SWRProvider>
            <AppShell>
              {children}
            </AppShell>
          </SWRProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

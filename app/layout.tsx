import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrentUserRole } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hostel Food Delivery Tracking System",
  description:
    "Real-time food delivery tracking and meal management for hostel students and administrators.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: "student" | "admin" | null = null;
  try {
    role = await getCurrentUserRole();
  } catch {
    // If unauthenticated or DB unavailable during build
    role = null;
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans pb-16 md:pb-0">
          <Navbar userRole={role} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <MobileNav userRole={role} />
        </body>
      </html>
    </ClerkProvider>
  );
}

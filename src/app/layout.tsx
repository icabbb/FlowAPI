import type { Metadata } from "next";
import { Geist, Geist_Mono, Exo_2 } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "next-themes";
import { Toaster } from '@/components/ui/toaster';
import { AuthSync } from '@/components/auth/auth-sync';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowAPI",
  description: "FlowAPI is a visual data flow builder that allows you to create and execute data flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <AuthSync />      
      <html lang="en" suppressHydrationWarning className="h-full">
        <body
          className={`${exo2.className} antialiased h-full`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col h-full">
              <main className="flex-grow overflow-y-auto">
                {children}
              </main>
              <Toaster />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

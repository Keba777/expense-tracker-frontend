import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/providers/query-provider";
import { SWRegister } from "@/components/pwa/sw-register";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { OfflineSync } from "@/components/pwa/offline-sync";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { LangSync } from "@/components/lang-sync";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ExpenseTracker",
    template: "%s | ExpenseTracker",
  },
  description: "Track your income and expenses with beautiful insights",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExpenseTracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#06070a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wdth,wght@75,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineIndicator />
          <QueryProvider>
            {children}
            <OfflineSync />
          </QueryProvider>
          <LangSync />
          <SWRegister />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}

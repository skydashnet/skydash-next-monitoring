import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MikrotikProvider } from "@/components/providers/mikrotik-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skydash.NET - Dashboard",
  description: "Mikrotik Monitoring Tools",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider>
            <MikrotikProvider>
              {children}
            </MikrotikProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { NotificationProvider } from "@/context/NotificationContext";
import { CommandProvider } from "@/context/CommandContext";
import { AppShell } from "@/components/layout/AppShell";
import { DevToolsGuard } from "@/components/security/DevToolsGuard";
import { APP_CONFIG } from "@/config/app.config";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — Operating System for Elite Forex Traders`,
  description: APP_CONFIG.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`dark ${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen">
        <DevToolsGuard />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider>
            <AuthProvider>
              <NotificationProvider>
                <CommandProvider>
                  <AppShell>{children}</AppShell>
                </CommandProvider>
              </NotificationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

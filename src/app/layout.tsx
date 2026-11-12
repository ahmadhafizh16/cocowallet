import type { Metadata, Viewport } from "next";
import { themeBootstrap } from "@/features/theme/theme";
import "./globals.css";
import "@/features/wallet/wallet.css";

export const metadata: Metadata = {
  title: "CocoWallet · Your multi-currency wallet",
  description:
    "Manage currency wallets, transfers and transaction history. Local prototype; no real funds move.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to wallet content
        </a>
        {children}
      </body>
    </html>
  );
}

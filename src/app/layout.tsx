import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/common/Providers";

export const viewport: Viewport = {
  themeColor: "#18110B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "POS Terminal",
  description: "Modern Production-Ready Point of Sale System",
  applicationName: "CoffeeShop POS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POS Terminal",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="h-screen w-screen overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
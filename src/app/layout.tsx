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

export async function generateMetadata(): Promise<Metadata> {
  let title = "POS Terminal";
  let appName = "CoffeeShop POS";
  let description = "Modern Production-Ready Point of Sale System";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/business`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const business = json?.data || json?.business;
      if (business) {
        const name = business.nameEn || business.nameAr;
        if (name) {
          title = `${name} - POS Terminal`;
          appName = name;
        }
        if (business.receiptFooterEn || business.receiptFooterAr) {
          description = business.receiptFooterEn || business.receiptFooterAr;
        }
      }
    }
  } catch {
    // Fall back to defaults if backend unavailable
  }

  return {
    title,
    description,
    applicationName: appName,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: appName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/api/pwa-icon/192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.svg",
      apple: "/api/pwa-icon/apple-180.png",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
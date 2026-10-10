import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "MK Coffee Riyadh";
  let shortName = "MK Coffee";
  let description = "Specialty Coffee POS Terminal System";

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${apiUrl}/business`, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok) {
      const json = await res.json();
      const business = json?.data || json?.business;
      if (business) {
        const fullBusinessName = business.nameEn || business.nameAr;
        if (fullBusinessName) {
          name = fullBusinessName;
          shortName = business.nameEn || business.nameAr || "MK Coffee";
        }
        if (business.receiptFooterEn || business.receiptFooterAr) {
          description = business.receiptFooterEn || business.receiptFooterAr;
        }
      }
    }
  } catch (err) {
    // Non-blocking fallback to MK Coffee Riyadh
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: "/pos",
    id: "/pos",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
    orientation: "any",
    background_color: "#18110B",
    theme_color: "#18110B",
    icons: [
      {
        src: "/api/pwa-icon/192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon/512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/pwa-icon/apple-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "390x378",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["business", "finance", "productivity"],
    shortcuts: [
      {
        name: "POS Register",
        short_name: "POS",
        description: "Open Cash Register",
        url: "/pos",
        icons: [{ src: "/api/pwa-icon/192.png", sizes: "192x192" }],
      },
      {
        name: "Kitchen Display (KDS)",
        short_name: "KDS",
        description: "Open Kitchen Display",
        url: "/kds",
        icons: [{ src: "/api/pwa-icon/192.png", sizes: "192x192" }],
      },
      {
        name: "Customer Display (CFD)",
        short_name: "CFD",
        description: "Open Customer Facing Display",
        url: "/cfd",
        icons: [{ src: "/api/pwa-icon/192.png", sizes: "192x192" }],
      },
    ],
  };
}

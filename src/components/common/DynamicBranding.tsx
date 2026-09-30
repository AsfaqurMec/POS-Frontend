"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBusiness } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { getMediaUrl } from "@/lib/env";

export function DynamicBranding() {
  const { data: business } = useBusiness();
  const { lang } = useLangStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!business) return;

    // 1. Dynamic Document Title
    const businessName =
      lang === "ar"
        ? business.nameAr || business.nameEn
        : business.nameEn || business.nameAr;

    if (businessName) {
      document.title = businessName;
    }

    // 2. Dynamic Favicon & Apple Touch Icon
    const logoUrl = business.logoUrl ? getMediaUrl(business.logoUrl) : "/favicon.svg";

    // Update all matching favicon links
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon'], link[rel='shortcut icon']"
    );

    if (existingIcons.length > 0) {
      existingIcons.forEach((el) => {
        el.href = logoUrl;
        if (logoUrl.endsWith(".svg")) {
          el.type = "image/svg+xml";
        } else if (logoUrl.endsWith(".png")) {
          el.type = "image/png";
        }
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = logoUrl;
      if (logoUrl.endsWith(".svg")) {
        link.type = "image/svg+xml";
      }
      document.head.appendChild(link);
    }

    // Update or create apple-touch-icon
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    appleLink.href = logoUrl;
  }, [business, lang, pathname]);

  return null;
}

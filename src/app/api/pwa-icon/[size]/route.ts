import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { size: string } }
) {
  try {
    const rawParam = params?.size || "192.png";
    const isMaskable = rawParam.includes("maskable");
    const isApple = rawParam.includes("apple");
    
    // Extract numeric size, default to 192
    const sizeMatch = rawParam.match(/\d+/);
    const targetSize = sizeMatch ? parseInt(sizeMatch[0], 10) : (isApple ? 180 : 192);

    // Fetch current business settings
    let logoBuffer: Buffer | null = null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    try {
      const resp = await fetch(`${apiUrl}/business`, { cache: "no-store" });
      if (resp.ok) {
        const json = await resp.json();
        const business = json?.data || json?.business;
        if (business?.logoUrl) {
          const relativeLogo = business.logoUrl.replace(/^\//, "");
          // Check local disk first if backend is on same machine
          const localBackendPath = path.resolve(process.cwd(), "../backend", relativeLogo);
          if (fs.existsSync(localBackendPath)) {
            logoBuffer = fs.readFileSync(localBackendPath);
          } else {
            // Fetch via HTTP
            const fullLogoUrl = business.logoUrl.startsWith("http")
              ? business.logoUrl
              : `${backendUrl}/${relativeLogo}`;
            const imgRes = await fetch(fullLogoUrl, { cache: "no-store" });
            if (imgRes.ok) {
              const arrayBuf = await imgRes.arrayBuffer();
              logoBuffer = Buffer.from(arrayBuf);
            }
          }
        }
      }
    } catch {
      // Fall through to default icon
    }

    // If no custom logo available, read fallback icon from public folder
    if (!logoBuffer) {
      const fallbackPath = path.resolve(
        process.cwd(),
        "public/icons",
        targetSize >= 512 ? "icon-512x512.png" : "icon-192x192.png"
      );
      if (fs.existsSync(fallbackPath)) {
        logoBuffer = fs.readFileSync(fallbackPath);
      }
    }

    if (!logoBuffer) {
      return new NextResponse(null, { status: 404 });
    }

    let finalPngBuffer: Buffer;

    if (isMaskable || isApple) {
      // Maskable & Apple touch icons need a solid background with safe padding
      const paddingRatio = isApple ? 0.85 : 0.75;
      const innerSize = Math.max(16, Math.round(targetSize * paddingRatio));
      const resizedLogo = await sharp(logoBuffer)
        .resize(innerSize, innerSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      finalPngBuffer = await sharp({
        create: {
          width: targetSize,
          height: targetSize,
          channels: 4,
          background: { r: 24, g: 17, b: 11, alpha: 1 }, // #18110B POS dark brown
        },
      })
        .composite([{ input: resizedLogo, gravity: "center" }])
        .png()
        .toBuffer();
    } else {
      // Standard app icon: transparent background, preserve aspect ratio
      finalPngBuffer = await sharp(logoBuffer)
        .resize(targetSize, targetSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(finalPngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[PWA Icon Route] Error generating icon:", error);
    return new NextResponse(null, { status: 500 });
  }
}

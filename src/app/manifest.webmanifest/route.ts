import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { getMediaUrl } from '@/lib/env';
import type { Business } from '@/types';

/**
 * Generate the web manifest for the POS PWA.
 * The manifest is served at `/manifest.webmanifest` via the App Router.
 * It dynamically pulls the business name and logo from the API.
 * If the API call fails, a safe static fallback is returned.
 */
export async function GET() {
  try {
    const business = await api.get<Business>('/business');
    const name = business?.nameEn || business?.nameAr || 'POS Terminal';
    const logoUrl = business?.logoUrl ? getMediaUrl(business.logoUrl) : '/favicon.svg';

    const manifest = {
      name,
      short_name: name,
      description: business?.receiptFooterEn || 'Point of Sale Application',
      start_url: '/pos',
      id: '/pos',
      scope: '/',
      display: 'standalone',
      display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],
      orientation: 'any',
      background_color: '#18110B',
      theme_color: '#18110B',
      icons: [
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      categories: ['business', 'finance', 'productivity'],
      shortcuts: [
        { name: 'POS Register', short_name: 'POS', description: 'Open Cash Register', url: '/pos', icons: [{ src: logoUrl, sizes: '192x192' }] },
        { name: 'Kitchen Display (KDS)', short_name: 'KDS', description: 'Open Kitchen Display', url: '/kds', icons: [{ src: logoUrl, sizes: '192x192' }] },
        { name: 'Customer Display (CFD)', short_name: 'CFD', description: 'Open Customer Facing Display', url: '/cfd', icons: [{ src: logoUrl, sizes: '192x192' }] },
      ],
    };
    return NextResponse.json(manifest, { headers: { 'Content-Type': 'application/manifest+json' } });
  } catch (error) {
    const fallback = {
      name: 'POS Terminal',
      short_name: 'POS',
      description: 'Modern Production-Ready Point of Sale System',
      start_url: '/pos',
      id: '/pos',
      scope: '/',
      display: 'standalone',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    };
    return NextResponse.json(fallback, { headers: { 'Content-Type': 'application/manifest+json' } });
  }
}

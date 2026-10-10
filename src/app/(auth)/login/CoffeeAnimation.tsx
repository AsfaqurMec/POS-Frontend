"use client";

import React from "react";

export function CoffeeAnimation() {
  return (
    <div className="relative w-full max-w-[360px] h-[190px] sm:h-[220px] xl:h-[240px] mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* Ambient Warm Glow */}
      <div className="absolute w-[220px] h-[220px] rounded-full bg-amber-600/15 blur-[60px] animate-pulse" />
      <div className="absolute w-[140px] h-[140px] rounded-full bg-amber-500/20 blur-[40px] -translate-y-4" />

      {/* Floating Coffee Bean 1 - Top Left */}
      <div
        className="absolute top-2 left-6 sm:left-8 w-7 h-9 animate-float-slow"
        style={{ animationDelay: "0s" }}
      >
        <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-lg transform -rotate-45">
          <defs>
            <linearGradient id="beanGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A2810" />
              <stop offset="50%" stopColor="#2E1708" />
              <stop offset="100%" stopColor="#1B0C04" />
            </linearGradient>
            <linearGradient id="beanHighlight1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8C532B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4A2810" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="20" cy="25" rx="16" ry="22" fill="url(#beanGrad1)" />
          <path
            d="M 12 12 Q 10 25 14 38"
            stroke="url(#beanHighlight1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 5 Q 16 18 20 25 Q 24 32 20 45"
            stroke="#120602"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 5 Q 16 18 20 25 Q 24 32 20 45"
            stroke="#633919"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Floating Coffee Bean 2 - Top Right */}
      <div
        className="absolute top-4 right-8 sm:right-10 w-6 h-8 animate-float-medium"
        style={{ animationDelay: "1.5s" }}
      >
        <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-md transform rotate-35">
          <ellipse cx="20" cy="25" rx="15" ry="21" fill="url(#beanGrad1)" />
          <path
            d="M 13 13 Q 11 25 14 37"
            stroke="url(#beanHighlight1)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 6 Q 24 18 20 25 Q 16 32 20 44"
            stroke="#120602"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 6 Q 24 18 20 25 Q 16 32 20 44"
            stroke="#633919"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Floating Coffee Bean 3 - Bottom Left */}
      <div
        className="absolute bottom-6 left-4 sm:left-6 w-6 h-8 animate-float-fast opacity-80"
        style={{ animationDelay: "0.8s" }}
      >
        <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow transform rotate-12">
          <ellipse cx="20" cy="25" rx="14" ry="19" fill="url(#beanGrad1)" />
          <path
            d="M 20 7 Q 17 18 20 25 Q 23 32 20 43"
            stroke="#120602"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Floating Coffee Bean 4 - Bottom Right */}
      <div
        className="absolute bottom-4 right-6 sm:right-8 w-7 h-9 animate-float-slow"
        style={{ animationDelay: "2.2s" }}
      >
        <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-lg transform -rotate-15">
          <ellipse cx="20" cy="25" rx="15" ry="21" fill="url(#beanGrad1)" />
          <path
            d="M 13 13 Q 11 25 14 37"
            stroke="url(#beanHighlight1)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 6 Q 16 18 20 25 Q 24 32 20 44"
            stroke="#120602"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 6 Q 16 18 20 25 Q 24 32 20 44"
            stroke="#633919"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Central Animated Coffee Mug & Steam Composition */}
      <div className="relative flex flex-col items-center justify-center mt-2">
        {/* Steam Animation */}
        <div className="relative w-28 h-20 mb-[-10px] flex justify-center items-end overflow-visible">
          {/* Steam Wisp 1 */}
          <svg
            className="absolute bottom-0 w-6 h-20 animate-steam-1"
            viewBox="0 0 30 100"
            fill="none"
          >
            <path
              d="M 15 95 Q 5 70 20 45 Q 28 25 15 5"
              stroke="url(#steamGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Steam Wisp 2 (Center) */}
          <svg
            className="absolute bottom-0 w-7 h-24 animate-steam-2"
            viewBox="0 0 30 110"
            fill="none"
          >
            <path
              d="M 14 105 Q 24 80 10 50 Q 0 25 16 5"
              stroke="url(#steamGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Steam Wisp 3 */}
          <svg
            className="absolute bottom-0 w-6 h-18 animate-steam-3"
            viewBox="0 0 30 95"
            fill="none"
          >
            <path
              d="M 15 90 Q 25 65 12 40 Q 5 20 18 5"
              stroke="url(#steamGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>

          <svg className="w-0 h-0 absolute">
            <defs>
              <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0" />
                <stop offset="30%" stopColor="#FEF3C7" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Coffee Cup and Saucer SVG */}
        <div className="relative w-48 h-36 sm:w-52 sm:h-38 drop-shadow-2xl">
          <svg viewBox="0 0 260 200" className="w-full h-full" fill="none">
            <defs>
              {/* Cup Porcelain Gradient */}
              <linearGradient id="cupBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2C1A10" />
                <stop offset="40%" stopColor="#1E120A" />
                <stop offset="100%" stopColor="#120A05" />
              </linearGradient>

              {/* Gold Rim Accent */}
              <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4A373" />
                <stop offset="30%" stopColor="#F5D0A9" />
                <stop offset="70%" stopColor="#D4A373" />
                <stop offset="100%" stopColor="#9C6634" />
              </linearGradient>

              {/* Espresso Crema Gradient */}
              <radialGradient id="cremaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E2B17B" />
                <stop offset="45%" stopColor="#C48E54" />
                <stop offset="85%" stopColor="#6C411E" />
                <stop offset="100%" stopColor="#3E200C" />
              </radialGradient>

              {/* Saucer Gradient */}
              <linearGradient id="saucerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#25160E" />
                <stop offset="60%" stopColor="#170D07" />
                <stop offset="100%" stopColor="#0D0704" />
              </linearGradient>
            </defs>

            {/* Saucer Base Shadow */}
            <ellipse cx="120" cy="172" rx="90" ry="16" fill="#000000" opacity="0.45" filter="blur(8px)" />

            {/* Saucer Outer Plate */}
            <ellipse cx="120" cy="166" rx="84" ry="14" fill="url(#saucerGrad)" stroke="#4A2F1D" strokeWidth="1.5" />
            <ellipse cx="120" cy="165" rx="72" ry="10" fill="none" stroke="url(#goldRimGrad)" strokeWidth="1.2" opacity="0.65" />
            <ellipse cx="120" cy="164" rx="52" ry="7" fill="#130B06" opacity="0.8" />

            {/* Cup Handle */}
            <path
              d="M 172 82 C 215 85 210 135 168 138 C 160 138 160 128 167 127 C 195 125 198 96 172 93 Z"
              fill="url(#cupBodyGrad)"
              stroke="url(#goldRimGrad)"
              strokeWidth="1.5"
            />
            {/* Cup Handle Inner Shadow */}
            <path
              d="M 173 89 C 198 91 195 122 170 123"
              stroke="#0D0704"
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />

            {/* Cup Body Base & Contour */}
            <path
              d="M 68 82 C 70 135 88 156 120 156 C 152 156 170 135 172 82 Z"
              fill="url(#cupBodyGrad)"
              stroke="#3D2415"
              strokeWidth="1.5"
            />

            {/* Cup Body Subtle Warm Light Reflection */}
            <path
              d="M 80 86 C 82 125 94 145 106 150 C 95 145 86 122 84 86 Z"
              fill="#FFFFFF"
              opacity="0.08"
            />

            {/* Cup Interior / Espresso Surface Rim */}
            <ellipse cx="120" cy="82" rx="52" ry="18" fill="#1A0D06" stroke="url(#goldRimGrad)" strokeWidth="2.5" />

            {/* Liquid Surface */}
            <ellipse cx="120" cy="82" rx="48" ry="15" fill="url(#cremaGrad)" />

            {/* Concentric Crema Swirl / Droplet Ripple */}
            <ellipse
              cx="120"
              cy="82"
              rx="36"
              ry="11"
              fill="none"
              stroke="#F0C79A"
              strokeWidth="1.2"
              opacity="0.75"
              className="animate-crema-pulse"
            />
            <ellipse
              cx="120"
              cy="82"
              rx="22"
              ry="7"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="1.2"
              opacity="0.9"
            />

            {/* Latte Art: Elegant Heart / Rosetta motif in crema */}
            <g transform="translate(120, 82) scale(0.65)" opacity="0.95">
              <path
                d="M 0 -8 C -12 -18 -24 -2 0 16 C 24 -2 12 -18 0 -8 Z"
                fill="#FFFBEB"
                opacity="0.92"
                filter="drop-shadow(0px 1px 2px rgba(60,30,10,0.5))"
              />
              <path
                d="M 0 -5 C -8 -13 -16 0 0 12 C 16 0 8 -13 0 -5 Z"
                fill="#FEF3C7"
                opacity="0.95"
              />
              <path
                d="M 0 -10 L 0 18"
                stroke="#C48E54"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>

            {/* Subtle gloss highlight on front edge */}
            <path
              d="M 80 84 C 95 91 145 91 160 84"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>

      {/* Floating Aroma Particles */}
      <div className="absolute top-14 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-ping" style={{ animationDuration: "3s" }} />
      <div className="absolute top-20 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-200/50 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
    </div>
  );
}

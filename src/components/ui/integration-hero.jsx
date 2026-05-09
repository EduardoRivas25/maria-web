import React from "react";
import { Button } from "@/components/ui/button";

import { n8n } from "@/svgs/n8n";
import { GoogleCalendar } from "@/svgs/calendar";
import { Gmail } from "@/svgs/gmail";
import { GoogleDrive } from "@/svgs/drive";
import { GoogleSheets } from "@/svgs/shets";
import { Spotify } from "@/svgs/spotify";
import { Telegram } from "@/svgs/telegram";
import { Facebook } from "@/svgs/facebok";
import { WhatsApp } from "@/svgs/whats";
import { Instagram } from "@/svgs/insta";
import { XformerlyTwitter } from "@/svgs/x";
import { Gemini } from "@/svgs/gemini";
import { OpenAI } from "@/svgs/chatgpt";
import { ClaudeAI } from "@/svgs/cloude";
import { Grok } from "@/svgs/grok";
import { DeepSeek } from "@/svgs/deepsek";
import { Qwen } from "@/svgs/qwen";
import { GoogleAntigravity } from "@/svgs/antigravity";
import { React as ReactIcon } from "@/svgs/react";

const ICONS_ROW1 = [
  n8n, GoogleCalendar, Gmail, GoogleDrive, GoogleSheets, Gemini, OpenAI, ClaudeAI, Grok, DeepSeek
];

const ICONS_ROW2 = [
  Spotify, Telegram, Facebook, WhatsApp, Instagram, XformerlyTwitter, Qwen, GoogleAntigravity, ReactIcon
];

// Utility to repeat icons enough times
const repeatedIcons = (icons, repeat = 4) => Array.from({ length: repeat }).flatMap(() => icons);

export default function IntegrationHero() {
  return (
    <section className="relative py-16 overflow-hidden z-10 w-full">
      {/* Light grid background adapted for dark theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <span className="inline-block px-4 py-1.5 mb-6 text-sm rounded-full border border-[#f99e02]/30 bg-[#f99e02]/10 text-[#f99e02] font-semibold tracking-wide shadow-[0_0_15px_rgba(249,158,2,0.2)]">
          ⚡ Integraciones
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Conectado con tus herramientas favoritas
        </h2>
        <p className="mt-4 text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          M.A.R.I.A. interactúa nativamente con Google Workspace, Notion y más de 250 aplicaciones para ejecutar tus órdenes sin fricción.
        </p>
        
        <Button className="mt-10 px-8 py-6 rounded-xl bg-[#f99e02] text-white font-bold hover:bg-[#e08e02] transition-colors text-lg shadow-[0_0_30px_rgba(249,158,2,0.3)]">
          Ver todas las integraciones
        </Button>

        {/* Carousel */}
        <div className="mt-20 overflow-hidden relative pb-2 w-full">
          {/* Row 1 */}
          <div className="flex gap-10 whitespace-nowrap animate-scroll-left w-fit hover:[animation-play-state:paused]">
            {repeatedIcons(ICONS_ROW1, 4).map((Icon, i) => (
              <div key={i} className="h-20 w-20 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-center p-4 transition-transform hover:scale-110">
                <Icon className="h-full w-full object-contain filter drop-shadow-md" />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-10 whitespace-nowrap mt-8 animate-scroll-right w-fit hover:[animation-play-state:paused]">
            {repeatedIcons(ICONS_ROW2, 4).map((Icon, i) => (
              <div key={i} className="h-20 w-20 flex-shrink-0 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-center p-4 transition-transform hover:scale-110">
                <Icon className="h-full w-full object-contain filter drop-shadow-md" />
              </div>
            ))}
          </div>

          {/* Fade overlays */}
          <div className="absolute left-0 top-0 h-full w-40 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 40s linear infinite;
        }
      `}} />
    </section>
  );
}

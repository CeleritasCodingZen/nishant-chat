"use client";

import React from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    sound.playClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-[#07080A] text-[#F3F1EC] pt-20 pb-12 px-4 md:px-10 border-t-2 border-[#22252B] font-mono">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Registration Corner Marks */}
        <div className="flex justify-between items-center text-[10px] text-[#7E828C] mb-8 border-b border-[#22252B] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#39FF14]">┌</span>
            <span>HARDWARE CHASSIS SPEC // 2026</span>
          </div>
          <div>
            <span>COORD: 37.7749° N, 122.4194° W</span>
            <span className="text-[#39FF14] ml-2">┐</span>
          </div>
        </div>

        {/* Massive Hardware Wordmark */}
        <div className="mb-12 select-none">
          <h2 className="font-display font-extrabold text-7xl sm:text-9xl md:text-[14vw] tracking-tighter leading-none text-[#F3F1EC]/90 uppercase">
            VYBZ
          </h2>
          <div className="font-mono text-xs text-[#39FF14] tracking-widest mt-2 uppercase">
            [ AI-POWERED SOCIAL GAMING HARDWARE // TURN CHATS INTO GAMES ]
          </div>
        </div>

        {/* Hardware Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16 text-xs">
          <div>
            <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1 mb-3">
              NAVIGATION
            </div>
            <ul className="space-y-2">
              {["boot-hero", "section-input", "section-dataport", "section-cartridges", "section-gameplay"].map((id, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => scrollTo(id)}
                    className="hover:text-[#39FF14] transition-colors cursor-pointer"
                    data-cursor="LINK"
                  >
                    &gt; {id.replace("section-", "").replace("boot-", "").toUpperCase()}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1 mb-3">
              ROMS &amp; MODES
            </div>
            <ul className="space-y-2 text-[#D8D5CC]">
              <li>&gt; WHO SAID IT?</li>
              <li>&gt; MEMORY BANK</li>
              <li>&gt; FRIENDSHIP QUIZ</li>
              <li>&gt; HOT TAKE MACHINE</li>
              <li>&gt; CHAOS SPEEDRUN</li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1 mb-3">
              PRIVACY PROTOCOL
            </div>
            <p className="text-[11px] text-[#7E828C] leading-relaxed">
              CLIENT-SIDE VECTORING. RAW TEXT EXPORTS ARE PROCESSED EPHEMERALLY IN BROWSER MEMORY.
              ZERO TRAINING ON CORPORATE LLM CORPUSES.
            </p>
          </div>

          <div>
            <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1 mb-3">
              SYSTEM BARCODE
            </div>
            <Barcode value="VYBZ-HARDWARE-2026" height={28} showText={true} color="#39FF14" />
          </div>
        </div>

        {/* Simulated Thermal Receipt Copyright Strip */}
        <div className="thermal-receipt thermal-receipt-serrated-top p-4 text-[10px] text-[#0A0B0D] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold">*** HARDWARE DISPATCH RECEIPT ***</span>
            <span>SYSTEM BUILD // 2026.04</span>
          </div>
          <div className="text-center sm:text-right">
            <span>© 2026 VYBZ LABS. ALL RIGHTS RESERVED. ZERO GAUSSIAN BLUR PERMITTED.</span>
          </div>
        </div>

        {/* Bottom Registration Corner Marks */}
        <div className="flex justify-between items-center text-[10px] text-[#7E828C] mt-6 pt-3 border-t border-[#22252B]">
          <div className="flex items-center gap-2">
            <span className="text-[#39FF14]">└</span>
            <span>CHASSIS GROUNDED // 0V</span>
          </div>
          <div>
            <span>PHOSPHOR ARCADE BRUTALISM</span>
            <span className="text-[#39FF14] ml-2">┘</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

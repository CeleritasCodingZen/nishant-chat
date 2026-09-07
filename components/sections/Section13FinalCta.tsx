"use client";

import React, { useState } from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

interface Section13FinalCtaProps {
  coins: number;
  onInsertCoin: () => void;
}

export const Section13FinalCta: React.FC<Section13FinalCtaProps> = ({
  coins,
  onInsertCoin,
}) => {
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const handleCoinInsert = () => {
    sound.playCoin();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 500);
    onInsertCoin();

    // Scroll to interactive gameplay bench
    const gameEl = document.getElementById("section-gameplay");
    if (gameEl) {
      setTimeout(() => {
        gameEl.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  };

  const handleStartPlaying = () => {
    sound.playClick();
    const gameEl = document.getElementById("section-gameplay");
    if (gameEl) {
      gameEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="section-final-cta"
      className="relative min-h-[90vh] py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D] flex flex-col justify-between overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Top Telemetry */}
        <div className="font-mono text-xs text-[#7E828C] mb-8 flex items-center gap-3">
          <span className="badge-phosphor">12 // FINAL COIN-OP</span>
          <span>VYBZ // FINAL SYSTEM</span>
          <span className="text-[#39FF14]">CREDITS: [{String(coins).padStart(2, "0")}]</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Huge Editorial Declarations */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h2 className="type-titanic text-[#F3F1EC] leading-none uppercase">
              READY
              <br />
              <span className="text-[#39FF14] drop-shadow-[0_0_16px_rgba(57,255,20,0.35)]">
                PLAYER?
              </span>
            </h2>

            <div className="text-xl md:text-2xl font-display font-bold text-[#FFD000] uppercase tracking-tight mt-2">
              YOUR CHATS ARE WAITING.
            </div>

            <p className="font-mono text-xs md:text-sm text-[#D8D5CC] max-w-lg border-l-2 border-[#39FF14] pl-4 py-1 leading-relaxed">
              Drop any WhatsApp, Telegram, or Discord group chat export. Your custom
              arcade cartridges compile in seconds with zero tracking.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={handleCoinInsert}
                className="btn-phosphor px-8 py-5 text-sm font-bold tracking-widest text-[#0A0B0D] shadow-hard cursor-pointer animate-pulse-phosphor"
                data-cursor="COIN"
              >
                <span>INSERT COIN →</span>
                <span className="bg-[#0A0B0D] text-[#39FF14] px-2 py-0.5 text-xs font-mono">
                  [{String(coins).padStart(2, "0")}]
                </span>
              </button>

              <button
                onClick={handleStartPlaying}
                className="btn-terminal px-6 py-5 text-xs tracking-widest cursor-pointer"
                data-cursor="PLAY"
              >
                START PLAYING →
              </button>
            </div>
          </div>

          {/* Right: Minimal CRT Arcade Display */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              className={`w-full max-w-[360px] bg-[#111216] border border-[#22252B] p-4 shadow-hard-lg relative transition-all duration-100 ${
                isFlashing ? "brightness-150 border-[#39FF14]" : ""
              }`}
            >
              {/* Chassis Screws */}
              <div className="flex justify-between items-center text-[9px] font-mono text-[#7E828C] pb-2 mb-2 border-b border-[#22252B]">
                <span className="text-[#39FF14]">⊕ COIN_MOD // 99</span>
                <span>CHASSIS TERMINAL 01 ⊕</span>
              </div>

              {/* Screen Frame */}
              <div className="crt-monitor-frame p-6 text-center flex flex-col justify-between min-h-[260px] relative">
                <div className="flex justify-between text-[9px] font-mono text-[#7E828C] border-b border-[#39FF14]/20 pb-2">
                  <span>PLAYER 01</span>
                  <span className="text-[#39FF14]">● READY</span>
                </div>

                <div className="py-6 space-y-3 font-mono">
                  <div className="text-[10px] text-[#7E828C] tracking-widest uppercase">
                    ALL-TIME RECORD
                  </div>
                  <div className="font-display text-4xl font-extrabold text-[#FFD000] tabular-numbers">
                    999,999
                  </div>
                  <div className="text-xs text-[#39FF14] font-bold tracking-wider">
                    <ScrambleText text="GAME READY TO LAUNCH" speed={30} />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#39FF14]/20 flex justify-between items-center">
                  <Barcode value="CREDIT-READY" height={16} showText={false} color="#39FF14" />
                  <span className="font-mono text-[8px] text-[#7E828C]">INSERT 1 TOKEN</span>
                </div>
              </div>

              {/* Bottom Hardware Screws */}
              <div className="flex justify-between items-center text-[8px] font-mono text-[#7E828C] pt-2 mt-2">
                <span>⊕ GROUND</span>
                <span className="text-[#39FF14]">HIGH VOLTAGE PHOSPHOR</span>
                <span>⊕ POWER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

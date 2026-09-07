"use client";

import React, { useEffect, useState } from "react";
import { sound } from "../ui/SoundSystem";

interface HeaderNavProps {
  coins: number;
  onAddCoin: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ coins, onAddCoin }) => {
  const [timeStr, setTimeStr] = useState<string>("00:00:00 UTC");
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    setIsMuted(sound.isMuted());

    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setTimeStr(`${h}:${m}:${s} UTC`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSoundToggle = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick();
    }
  };

  const scrollTo = (id: string) => {
    sound.playClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0D]/90 backdrop-blur-[2px] border-b border-[#22252B] px-4 md:px-8 py-2.5 font-mono text-[11px]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Telemetry */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollTo("boot-hero")}
            className="flex items-center gap-2 text-[#F3F1EC] hover:text-[#39FF14] transition-colors cursor-pointer group"
            data-cursor="BOOT"
          >
            <span className="font-display font-bold text-sm tracking-tighter text-[#39FF14] group-hover:drop-shadow-[0_0_8px_#39FF14]">
              VYBZ
            </span>
            <span className="text-[#7E828C] text-[10px] hidden sm:inline">// SYSTEM 01.04</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-[#111216] border border-[#22252B] text-[#7E828C] text-[10px]">
            <span className="led-green animate-pulse" />
            <span className="text-[#39FF14]">● ONLINE</span>
          </div>

          <div className="hidden lg:block text-[#7E828C] text-[10px] tabular-numbers">
            {timeStr}
          </div>
        </div>

        {/* Center: System Navigation Jump Codes */}
        <nav className="hidden md:flex items-center gap-1 text-[11px] text-[#D8D5CC]">
          {[
            { id: "section-input", label: "01/INPUT" },
            { id: "section-dataport", label: "02/PORT" },
            { id: "section-analysis", label: "03/CORE" },
            { id: "section-cartridges", label: "04/ROMS" },
            { id: "section-gameplay", label: "05/PLAY" },
            { id: "section-memory", label: "06/MEM" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="px-2 py-1 text-[#7E828C] hover:text-[#39FF14] hover:bg-[#16181D] transition-colors cursor-pointer"
              data-cursor="GOTO"
            >
              [{item.label}]
            </button>
          ))}
        </nav>

        {/* Right: Audio Control & Coin Ledger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className={`px-2 py-1 border text-[10px] tracking-wider transition-all cursor-pointer ${
              isMuted
                ? "border-[#FF334B]/40 text-[#FF334B] bg-[#111216]"
                : "border-[#39FF14]/50 text-[#39FF14] bg-[#111216] hover:bg-[#39FF14]/10"
            }`}
            data-cursor="AUDIO"
            title="Toggle Synthesized Audio"
          >
            AUDIO: {isMuted ? "[MUTED]" : "[ON]"}
          </button>

          {/* Interactive Coin Status */}
          <button
            onClick={() => {
              sound.playCoin();
              onAddCoin();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#16181D] border border-[#FFD000] text-[#FFD000] hover:bg-[#FFD000] hover:text-[#0A0B0D] transition-all cursor-pointer shadow-hard-sm"
            data-cursor="COIN+"
            title="Click to insert coin"
          >
            <span className="text-xs">🪙</span>
            <span className="font-bold text-[10px] tracking-widest tabular-numbers">
              COINS: [{String(coins).padStart(2, "0")}]
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

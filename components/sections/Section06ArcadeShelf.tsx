"use client";

import React, { useState } from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

export interface CartridgeItem {
  id: string;
  romCode: string;
  title: string;
  subtitle: string;
  description: string;
  highScore: string;
  difficulty: "NORMAL" | "MEDIUM" | "HARD" | "EXTREME" | "BRUTAL";
  status: "READY" | "LOCKED";
  badgeColor: string;
}

export const CARTRIDGES: CartridgeItem[] = [
  {
    id: "rom-01",
    romCode: "ROM // 001",
    title: "WHO SAID IT?",
    subtitle: "IDENTIFY THE AUTHOR",
    description: "Blind quote attribution. Can you distinguish who texted the unhinged midnight voice note transcript?",
    highScore: "08,420 PTS",
    difficulty: "NORMAL",
    status: "READY",
    badgeColor: "badge-phosphor",
  },
  {
    id: "rom-02",
    romCode: "ROM // 002",
    title: "MEMORY BANK",
    subtitle: "CHRONOLOGICAL RECALL",
    description: "Reconstruct the timeline. Place four hilarious group chat arguments in the exact order they occurred.",
    highScore: "12,100 PTS",
    difficulty: "HARD",
    status: "READY",
    badgeColor: "badge-yellow",
  },
  {
    id: "rom-03",
    romCode: "ROM // 003",
    title: "FRIENDSHIP QUIZ",
    subtitle: "PREDICT GROUP BEHAVIOR",
    description: "Blind voting. If the chat is stranded at 3am in a gas station, who starts arguing with the attendant first?",
    highScore: "06,890 PTS",
    difficulty: "MEDIUM",
    status: "READY",
    badgeColor: "badge-phosphor",
  },
  {
    id: "rom-04",
    romCode: "ROM // 004",
    title: "HOT TAKE MACHINE",
    subtitle: "CONTROVERSY METRIC",
    description: "The AI isolates the most debated statement in group history. Guess which member defended it to the death.",
    highScore: "14,200 PTS",
    difficulty: "EXTREME",
    status: "READY",
    badgeColor: "badge-yellow",
  },
  {
    id: "rom-05",
    romCode: "ROM // 005",
    title: "CHAOS MODE",
    subtitle: "SPEEDRUN UNFILTERED",
    description: "Rapid-fire out-of-context screenshots and audio clips. 10 rounds in 60 seconds with negative scoring.",
    highScore: "19,550 PTS",
    difficulty: "BRUTAL",
    status: "READY",
    badgeColor: "badge-phosphor",
  },
];

interface Section06ArcadeShelfProps {
  onSelectCartridge: (cart: CartridgeItem) => void;
  activeCartId?: string;
}

export const Section06ArcadeShelf: React.FC<Section06ArcadeShelfProps> = ({
  onSelectCartridge,
  activeCartId = "rom-01",
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeCartId);

  const handleSelect = (cart: CartridgeItem) => {
    sound.playCoin();
    setSelectedId(cart.id);
    onSelectCartridge(cart);

    // Smooth scroll toward Section 07 Gameplay
    const gameplayEl = document.getElementById("section-gameplay");
    if (gameplayEl) {
      setTimeout(() => {
        gameplayEl.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  return (
    <section
      id="section-cartridges"
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">05 // ARCADE SHELF</span>
          <span>GAME CARTRIDGE SYSTEM</span>
          <span className="text-[#39FF14]">// 5 ROM MODULES READY</span>
        </div>

        {/* Section Headline */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
              SELECT
              <br />
              <span className="text-[#39FF14]">YOUR GAME.</span>
            </h2>
            <div className="mt-3 font-mono text-xs text-[#D8D5CC] border-l-2 border-[#39FF14] pl-4 max-w-lg">
              PHYSICAL ROM CARTRIDGES GENERATED AUTOMATICALLY FROM GROUP CHAT ARCHIVES.
              CLICK ANY CARTRIDGE TO LOAD DIRECTLY INTO THE PLAYABLE TEST BENCH.
            </div>
          </div>

          <div className="font-mono text-xs text-[#7E828C] flex items-center gap-2">
            <span>SLOT: 16-BIT BUS</span>
            <span className="text-[#39FF14]">● ACTIVE CARTRIDGE LOADED</span>
          </div>
        </div>

        {/* Horizontal Cartridge Grid (Brutalist Physical Cartridges) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CARTRIDGES.map((cart) => {
            const isSelected = selectedId === cart.id;

            return (
              <div
                key={cart.id}
                onClick={() => handleSelect(cart)}
                className={`group relative bg-[#16181D] border transition-all duration-200 p-5 shadow-hard flex flex-col justify-between min-h-[380px] chamfer-tr cursor-pointer select-none ${
                  isSelected
                    ? "border-[#39FF14] -translate-y-2 shadow-hard-phosphor"
                    : "border-[#22252B] hover:border-[#39FF14]/60 hover:-translate-y-1 hover:shadow-hard-cyan"
                }`}
                data-cursor="LOAD ROM"
                style={{
                  perspective: "1000px",
                }}
              >
                {/* Top Notch & Inventory Label */}
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#22252B] font-mono text-[9px]">
                    <span className="font-bold text-[#39FF14]">{cart.romCode}</span>
                    <span className="text-[#7E828C]">{cart.difficulty}</span>
                  </div>

                  {/* Cartridge Title Banner */}
                  <div className="mb-4">
                    <div className="text-[10px] font-mono text-[#FFD000] tracking-wider uppercase mb-1">
                      {cart.subtitle}
                    </div>
                    <h3 className="font-display text-2xl font-black text-[#F3F1EC] leading-tight uppercase group-hover:text-[#39FF14] transition-colors">
                      {cart.title}
                    </h3>
                  </div>

                  {/* Cartridge Description */}
                  <p className="font-mono text-[11px] text-[#D8D5CC] leading-relaxed mb-4">
                    {cart.description}
                  </p>
                </div>

                {/* Bottom Cartridge Hardware Spec & Barcode */}
                <div className="pt-3 border-t border-[#22252B] flex flex-col gap-3 font-mono">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#7E828C]">HIGH SCORE:</span>
                    <span className="text-[#FFD000] font-bold tabular-numbers">
                      {cart.highScore}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Barcode value={cart.id.toUpperCase()} height={18} showText={false} color="#7E828C" />
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 ${
                        isSelected ? "bg-[#39FF14] text-[#0A0B0D]" : "bg-[#111216] text-[#7E828C]"
                      }`}
                    >
                      {isSelected ? "LOADED" : "LOAD →"}
                    </span>
                  </div>
                </div>

                {/* Active Indicator Pin */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#39FF14] animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

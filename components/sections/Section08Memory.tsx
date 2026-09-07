"use client";

import React from "react";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

export const Section08Memory: React.FC = () => {
  return (
    <section
      id="section-memory"
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D]"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">07 // ADAPTIVE MEMORY</span>
          <span>NEURAL WEIGHT ADAPTATION</span>
          <span className="text-[#39FF14]">// CONTINUOUS LEARNING</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Headline & Narrative */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
              THE MACHINE
              <br />
              <span className="text-[#39FF14]">REMEMBERS.</span>
            </h2>

            <div className="font-mono text-xs sm:text-sm text-[#D8D5CC] border-l-2 border-[#39FF14] pl-4 py-1 leading-relaxed">
              Every answer teaches VYBZ more about the way you play. If you get a quote
              wrong, show a bias toward certain friends, or hesitate on specific inside jokes,
              future cartridges dynamically calibrate to test that weakness.
            </div>

            {/* Hardware Sequence Flowchart */}
            <div className="mt-8 p-5 bg-[#111216] border border-[#22252B] font-mono text-xs space-y-4">
              <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-2 flex justify-between">
                <span>RECURSIVE ADAPTATION PIPELINE</span>
                <span className="text-[#39FF14]">CYCLE: ZERO-LATENCY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
                {[
                  { step: "01", label: "ANSWER", desc: "PLAYER CHOOSES OPTION", active: false },
                  { step: "02", label: "LEARN", desc: "AI CALCULATES BIAS", active: false },
                  { step: "03", label: "ADAPT", desc: "REWEIGHT QUESTION MATRIX", active: false },
                  { step: "04", label: "NEXT GAME", desc: "NEW ROM SYNTHESIZED", active: true },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border flex flex-col justify-between min-h-[90px] ${
                      item.active
                        ? "bg-[#16181D] border-[#39FF14] text-[#39FF14]"
                        : "bg-[#0A0B0D] border-[#22252B] text-[#D8D5CC]"
                    }`}
                  >
                    <span className="text-[9px] text-[#7E828C] block mb-1">{item.step} //</span>
                    <span className="font-bold text-sm">{item.label}</span>
                    <span className="text-[8px] text-[#7E828C] mt-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Player 01 Adaptive Profile Telemetry Ledger */}
          <div className="lg:col-span-6 bg-[#111216] border border-[#22252B] p-6 shadow-hard-lg font-mono">
            {/* Player Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#22252B] text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#39FF14] animate-pulse" />
                <span className="font-bold text-[#F3F1EC]">PROFILE // PLAYER_01</span>
              </div>
              <span className="badge-phosphor">SYNC ACTIVE</span>
            </div>

            {/* Stat Bars */}
            <div className="space-y-5">
              {[
                { label: "CHAOS AFFINITY", pct: 82, ascii: "████████░░", color: "text-[#FF6B35]", bg: "bg-[#FF6B35]" },
                { label: "MEMORY RECALL", pct: 91, ascii: "█████████░", color: "text-[#39FF14]", bg: "bg-[#39FF14]" },
                { label: "TRIVIA ACCURACY", pct: 64, ascii: "██████░░░░", color: "text-[#FFD000]", bg: "bg-[#FFD000]" },
                { label: "INSIDE JOKE MASTERY", pct: 100, ascii: "██████████", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]" },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#F3F1EC] font-bold">{stat.label}</span>
                    <span className={`font-mono ${stat.color} font-bold`}>{stat.pct}%</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 bg-[#0A0B0D] border border-[#22252B] p-0.5 relative">
                    <div
                      className={`h-full ${stat.bg} transition-all duration-500`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>

                  <div className="text-[9px] text-[#7E828C] flex justify-between pt-0.5">
                    <span>ASCII: {stat.ascii}</span>
                    <span>INDEX: WEIGHTED // HIGH CONFIDENCE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Hardware Stamp */}
            <div className="mt-8 pt-4 border-t border-[#22252B] flex items-center justify-between text-[10px] text-[#7E828C]">
              <span>CALIBRATION: RUN #041</span>
              <Barcode value="PLAYER-01-METRIC" height={16} showText={false} color="#7E828C" />
              <span className="text-[#39FF14]">PROFILE LOCKED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

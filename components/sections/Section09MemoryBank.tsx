"use client";

import React from "react";
import { Barcode } from "../ui/Barcode";

export const Section09MemoryBank: React.FC = () => {
  const records = [
    {
      code: "PREFERENCE // 001",
      title: "LIKES CHAOTIC QUESTIONS",
      desc: "Player engages 3.2x faster with questions containing late-night quotes.",
      status: "VERIFIED",
      statusColor: "text-[#39FF14]",
      barcode: "PREF-001",
    },
    {
      code: "PREFERENCE // 002",
      title: "STRONG MEMORY FOR MUSIC",
      desc: "100% accuracy on road trip aux disputes and sound-clip trivia.",
      status: "ACTIVE",
      statusColor: "text-[#00E5FF]",
      barcode: "PREF-002",
    },
    {
      code: "PREFERENCE // 003",
      title: "INSIDE JOKE RECALL: HIGH",
      desc: "Identifies 2021 meme origins with zero hesitation.",
      status: "LOCKED",
      statusColor: "text-[#FFD000]",
      barcode: "PREF-003",
    },
    {
      code: "PATTERN // 004",
      title: "FREQUENT 2AM DEBATES",
      desc: "Heuristic engine detected 14 recurring existential debates between 1AM and 3AM.",
      status: "INDEXED",
      statusColor: "text-[#FF6B35]",
      barcode: "PAT-004",
    },
    {
      code: "RELATIONSHIP // 005",
      title: "RIVALRY INDEX: ALEX VS LIAM",
      desc: "High friction coefficient identified around dining choices and gaming tiers.",
      status: "CRITICAL",
      statusColor: "text-[#FF334B]",
      barcode: "REL-005",
    },
  ];

  return (
    <section className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0E0F12]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Telemetry */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">08 // MEMORY BANK</span>
          <span>MEMORY BANK // PLAYER 01</span>
          <span className="text-[#39FF14]">// PERMANENT DISK STORE</span>
        </div>

        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
              PERSISTENT
              <br />
              <span className="text-[#39FF14]">MEMORY BANK.</span>
            </h2>
            <div className="font-mono text-xs text-[#D8D5CC] border-l-2 border-[#39FF14] pl-4 py-1 mt-3 max-w-lg">
              INDIVIDUAL RECALL DOSSIERS EXTRACTED AND UPDATED IN REALTIME AS YOU COMPLETE
              GAMES. STORED CLIENT-SIDE WITH INVENTORY-GRADE RIGOR.
            </div>
          </div>

          <div className="font-mono text-xs text-[#7E828C]">
            <span>SECTOR: 0x48FA</span>
            <span className="text-[#39FF14] ml-2">● READ/WRITE VERIFIED</span>
          </div>
        </div>

        {/* Compact Inventory Ledger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec, idx) => (
            <div
              key={idx}
              className="bg-[#16181D] border border-[#22252B] hover:border-[#39FF14]/50 p-5 shadow-hard flex flex-col justify-between min-h-[220px] font-mono transition-colors group"
            >
              {/* Top Tag & Status */}
              <div>
                <div className="flex items-center justify-between text-[10px] pb-2 mb-3 border-b border-[#22252B]">
                  <span className="text-[#39FF14] font-bold">{rec.code}</span>
                  <span className={`${rec.statusColor} font-bold`}>● {rec.status}</span>
                </div>

                <h3 className="font-display text-lg font-bold text-[#F3F1EC] mb-2 uppercase group-hover:text-[#39FF14] transition-colors">
                  {rec.title}
                </h3>

                <p className="text-[11px] text-[#D8D5CC] leading-relaxed">
                  {rec.desc}
                </p>
              </div>

              {/* Bottom Inventory Details & Barcode */}
              <div className="pt-3 border-t border-[#22252B] flex items-center justify-between text-[9px] text-[#7E828C]">
                <Barcode value={rec.barcode} height={14} showText={false} color="#7E828C" />
                <span>REC_ID // #00{idx + 1}</span>
              </div>
            </div>
          ))}

          {/* Special Terminal Summary Module */}
          <div className="bg-[#111216] border border-[#39FF14] p-5 shadow-hard-phosphor flex flex-col justify-between min-h-[220px] font-mono text-xs">
            <div>
              <div className="flex items-center justify-between text-[10px] pb-2 mb-3 border-b border-[#39FF14]/30">
                <span className="text-[#39FF14] font-bold">TOTAL REPOSITORY</span>
                <span className="text-[#FFD000]">SYNCED</span>
              </div>
              <div className="font-display text-2xl font-black text-[#F3F1EC] uppercase leading-tight">
                47 MEMORY CLUSTERS
              </div>
              <p className="text-[11px] text-[#D8D5CC] mt-2">
                All preferences remain user-owned. You can export or purge memory weights at any time with one click.
              </p>
            </div>

            <div className="pt-3 border-t border-[#39FF14]/30 flex justify-between items-center text-[10px]">
              <span className="text-[#39FF14]">ZERO-TRACKING LOCAL</span>
              <span className="text-[#F3F1EC] font-bold">[PURGE / EXPORT]</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

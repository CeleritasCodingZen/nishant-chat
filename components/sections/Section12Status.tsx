"use client";

import React from "react";
import { Barcode } from "../ui/Barcode";

export const Section12Status: React.FC = () => {
  const ledger = [
    { name: "CHAT INGESTION ENGINE", dots: "............", status: "ONLINE", ping: "4ms", load: "12%" },
    { name: "NEURAL HEURISTIC CORE", dots: "............", status: "ONLINE", ping: "283ms/batch", load: "34%" },
    { name: "PERSISTENT MEMORY BANK", dots: "............", status: "ONLINE", ping: "0.2ms", load: "99.98% SYNC" },
    { name: "ARCADE ROM ENGINE", dots: "............", status: "ONLINE", ping: "60 FPS", load: "STABLE" },
    { name: "PLAYER 01 PROFILE", dots: "............", status: "ACTIVE", ping: "CONNECTED", load: "LOCK #8849" },
  ];

  return (
    <section className="relative py-24 px-4 md:px-10 border-b border-[#22252B] bg-[#0D0E11]">
      <div className="max-w-[1400px] mx-auto font-mono">
        {/* Header Telemetry */}
        <div className="flex items-center justify-between text-xs text-[#7E828C] mb-8 pb-4 border-b border-[#22252B]">
          <div className="flex items-center gap-3">
            <span className="badge-phosphor">11 // DIAGNOSTICS</span>
            <span className="font-bold text-[#F3F1EC]">SYSTEM STATUS LEDGER</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-2 h-2 bg-[#39FF14] animate-ping" />
            <span className="text-[#39FF14]">CHASSIS ALL SYSTEMS NOMINAL</span>
          </div>
        </div>

        {/* Machine Diagnostic Scoreboard Ledger */}
        <div className="bg-[#111216] border border-[#22252B] p-6 shadow-hard-lg">
          <div className="space-y-4">
            {ledger.map((row, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2 border-b border-dotted border-[#22252B] hover:bg-[#16181D] px-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#7E828C] text-[10px]">0{idx + 1}/</span>
                  <span className="text-[#F3F1EC] font-bold tracking-wider">{row.name}</span>
                </div>

                <div className="hidden md:block flex-1 mx-4 text-[#22252B] tracking-widest overflow-hidden text-clip">
                  ....................................................................................
                </div>

                <div className="flex items-center gap-6 text-[11px] tabular-numbers">
                  <span className="text-[#7E828C]">{row.ping}</span>
                  <span className="text-[#FFD000]">{row.load}</span>
                  <span className="text-[#39FF14] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#39FF14]" />
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#22252B] flex flex-wrap items-center justify-between gap-4 text-[10px] text-[#7E828C]">
            <span>ARCHITECTURE: 6502/Z80 EMULATED TELEMETRY</span>
            <Barcode value="SYS-DIAG-OK" height={16} showText={false} color="#7E828C" />
            <span className="text-[#39FF14]">PASS // 0 ERRORS DETECTED</span>
          </div>
        </div>
      </div>
    </section>
  );
};

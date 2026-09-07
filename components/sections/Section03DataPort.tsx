"use client";

import React, { useState } from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

export const Section03DataPort: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<number>(0);
  const [activeFileName, setActiveFileName] = useState<string>("sunday_boys_group.txt");

  const startSimulation = (name: string) => {
    sound.playClick();
    setActiveFileName(name);
    setIsProcessing(true);
    setProgressStage(1);

    setTimeout(() => {
      sound.playKeypress();
      setProgressStage(2);
    }, 700);

    setTimeout(() => {
      sound.playKeypress();
      setProgressStage(3);
    }, 1500);

    setTimeout(() => {
      sound.playSuccess();
      setProgressStage(4);
      setIsProcessing(false);
    }, 2300);
  };

  return (
    <section
      id="section-dataport"
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0D0E11]"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">02 // DATA PORT</span>
          <span>DATA PORT // PLAYER 01</span>
          <span className="text-[#39FF14]">// INGESTION TERMINAL</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Headline & Specifications */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h2 className="type-headline-xl text-[#F3F1EC]">
              INSERT
              <br />
              YOUR
              <br />
              <span className="text-[#39FF14]">DATA.</span>
            </h2>

            <div className="font-mono text-xs text-[#D8D5CC] border-l-2 border-[#39FF14] pl-4 py-1 leading-relaxed mt-4">
              NO CORPORATE CLOUD SURVEILLANCE. YOUR CHAT EXPORTS ARE PARSED CLIENT-SIDE
              TO GENERATE YOUR CUSTOM ROM CARTRIDGE. RAW DATA NEVER LEAVES YOUR CONTROL.
            </div>

            {/* Supported formats ledger */}
            <div className="mt-6 p-4 bg-[#111216] border border-[#22252B] font-mono text-xs space-y-3">
              <div className="text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1 flex justify-between">
                <span>FORMAT PROTOCOL</span>
                <span className="text-[#39FF14]">PARSER REV 2.4</span>
              </div>

              <div className="flex items-center justify-between text-[#F3F1EC]">
                <div className="flex items-center gap-2">
                  <span className="text-[#39FF14]">►</span>
                  <span>.TXT EXPORT</span>
                </div>
                <span className="text-[10px] text-[#7E828C]">WHATSAPP / TELEGRAM NATIVE</span>
              </div>

              <div className="flex items-center justify-between text-[#F3F1EC]">
                <div className="flex items-center gap-2">
                  <span className="text-[#39FF14]">►</span>
                  <span>.JSON DUMP</span>
                </div>
                <span className="text-[10px] text-[#7E828C]">DISCORD CHAT EXPORTER</span>
              </div>

              <div className="flex items-center justify-between text-[#F3F1EC]">
                <div className="flex items-center gap-2">
                  <span className="text-[#39FF14]">►</span>
                  <span>.CSV RECORD</span>
                </div>
                <span className="text-[10px] text-[#7E828C]">CUSTOM DELIMITED LOGS</span>
              </div>
            </div>

            {/* Quick-test Presets */}
            <div className="mt-4 font-mono text-xs">
              <div className="text-[10px] text-[#7E828C] mb-2 uppercase tracking-widest">
                [ OR LOAD ARCHIVED SAMPLE CHAT LOG ]
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => startSimulation("discord_late_night_gaming.json")}
                  className="px-3 py-1.5 bg-[#16181D] border border-[#22252B] hover:border-[#39FF14] text-[10px] text-[#D8D5CC] hover:text-[#39FF14] transition-colors cursor-pointer"
                  data-cursor="LOAD"
                >
                  DISCORD_GAMING.JSON (8.4K MSGS)
                </button>
                <button
                  onClick={() => startSimulation("group_vacation_rome_2024.txt")}
                  className="px-3 py-1.5 bg-[#16181D] border border-[#22252B] hover:border-[#39FF14] text-[10px] text-[#D8D5CC] hover:text-[#39FF14] transition-colors cursor-pointer"
                  data-cursor="LOAD"
                >
                  WHATSAPP_ROME_TRIP.TXT (14.2K MSGS)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Brutalist Terminal Upload Module */}
          <div className="lg:col-span-7">
            <div className="bg-[#111216] border border-[#22252B] p-6 shadow-hard-lg relative">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#22252B] font-mono text-xs">
                <div className="flex items-center gap-2 text-[#F3F1EC]">
                  <span className="w-2 h-2 bg-[#39FF14]" />
                  <span className="font-bold">TERMINAL // DATA_PORT_01</span>
                </div>
                <span className="text-[10px] text-[#7E828C]">DEVICE: /DEV/TTY_CHATS</span>
              </div>

              {/* Drop / Import Area */}
              <div
                onClick={() => startSimulation("custom_chat_export.txt")}
                className="border-2 border-dashed border-[#22252B] hover:border-[#39FF14] p-8 md:p-12 text-center flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer bg-[#0A0B0D]"
                data-cursor="DROP"
              >
                <div className="font-mono text-3xl text-[#39FF14]">
                  ⌗
                </div>

                <div className="space-y-1 font-mono">
                  <div className="text-sm font-bold text-[#F3F1EC] tracking-wider">
                    &gt; DROP CHAT DATA HERE
                  </div>
                  <div className="text-[11px] text-[#7E828C]">
                    SUPPORTED: .TXT // .JSON // .CSV (UP TO 200,000 MESSAGES)
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startSimulation("manual_upload_selected.txt");
                  }}
                  className="btn-phosphor px-6 py-2.5 text-xs tracking-wider"
                  data-cursor="SELECT"
                >
                  SELECT FILE →
                </button>

                <div className="text-[9px] font-mono text-[#7E828C] tracking-widest uppercase mt-2">
                  DATA PRIVACY // USER CONTROLLED CLIENT-SIDE PARSER
                </div>
              </div>

              {/* Simulated Progress Telemetry */}
              <div className="mt-6 p-4 bg-[#0A0B0D] border border-[#22252B] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-[10px] text-[#7E828C] border-b border-[#22252B] pb-1">
                  <span>ACTIVE STREAM: {activeFileName}</span>
                  <span className="text-[#39FF14]">
                    {progressStage === 0 && "IDLE // READY FOR INPUT"}
                    {progressStage === 1 && "INGESTING CHAT BUFFER..."}
                    {progressStage === 2 && "PARSING SENTIMENT & NICKNAMES..."}
                    {progressStage === 3 && "INDEXING MEMORY CLUSTERS..."}
                    {progressStage === 4 && "COMPLETE // 17,492 MSGS READY"}
                  </span>
                </div>

                {/* Progress ASCII Blocks */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#D8D5CC]">IMPORTING...</span>
                    <span className="text-[#39FF14] font-bold">
                      {progressStage >= 1 ? "██████████████░░░░  70%" : "░░░░░░░░░░░░░░░░░░░░   0%"}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#D8D5CC]">PARSING...</span>
                    <span className="text-[#39FF14] font-bold">
                      {progressStage >= 2 ? "████████████████░░  88%" : "░░░░░░░░░░░░░░░░░░░░   0%"}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#D8D5CC]">INDEXING...</span>
                    <span className="text-[#39FF14] font-bold">
                      {progressStage >= 3 ? "██████████████████ 100%" : "░░░░░░░░░░░░░░░░░░░░   0%"}
                    </span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="pt-2 border-t border-[#22252B] flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 ${
                        progressStage === 4
                          ? "bg-[#39FF14] animate-ping"
                          : isProcessing
                          ? "bg-[#FFD000] animate-pulse"
                          : "bg-[#7E828C]"
                      }`}
                    />
                    <span className="text-[#F3F1EC]">
                      {progressStage === 4 ? "SYSTEM READY FOR ANALYSIS" : "STANDBY"}
                    </span>
                  </div>
                  <Barcode value="STREAM-00231" height={14} showText={false} color="#7E828C" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

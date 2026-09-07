"use client";

import React, { useState } from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

export const Section05Transform: React.FC = () => {
  const [transformProgress, setTransformProgress] = useState<number>(50);
  const [isCompiled, setIsCompiled] = useState<boolean>(false);

  const handleCompile = () => {
    sound.playCoin();
    setIsCompiled(true);
    setTransformProgress(100);
  };

  const handleReset = () => {
    sound.playClick();
    setIsCompiled(false);
    setTransformProgress(0);
  };

  return (
    <section
      id="section-transform"
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0D0E11]"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">04 // TRANSFORMATION</span>
          <span>PIPELINE: RAW_DATA → ARCADE_ROM</span>
          <span className="text-[#39FF14]">// HEURISTIC SYNTHESIS</span>
        </div>

        {/* Section Headline */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
              RAW TEXT IN.
              <br />
              <span className="text-[#39FF14]">CHAOS GAME OUT.</span>
            </h2>
            <p className="font-mono text-xs text-[#D8D5CC] mt-3 max-w-lg border-l-2 border-[#39FF14] pl-4">
              Watch an unformatted, chaotic midnight message exchange undergo heuristic
              decomposition and re-emerge as a competitive trivia cartridge.
            </p>
          </div>

          {/* Interactive Scrub Controller */}
          <div className="bg-[#111216] border border-[#22252B] p-4 font-mono text-xs flex flex-col gap-2 min-w-[280px]">
            <div className="flex justify-between text-[10px] text-[#7E828C]">
              <span>COMPILATION PROGRESS</span>
              <span className="text-[#39FF14] font-bold">{transformProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={transformProgress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTransformProgress(val);
                if (val === 100) {
                  sound.playSuccess();
                  setIsCompiled(true);
                } else if (val === 0) {
                  setIsCompiled(false);
                } else if (val % 20 === 0) {
                  sound.playKeypress();
                }
              }}
              className="w-full accent-[#39FF14] cursor-pointer"
            />
            <div className="flex justify-between gap-2 mt-1">
              <button
                onClick={handleReset}
                className="px-2 py-1 bg-[#16181D] hover:bg-[#22252B] text-[9px] text-[#7E828C] cursor-pointer"
              >
                [0% RAW]
              </button>
              <button
                onClick={handleCompile}
                className="px-2 py-1 bg-[#39FF14] text-[#0A0B0D] font-bold text-[9px] cursor-pointer"
              >
                [100% COMPILED]
              </button>
            </div>
          </div>
        </div>

        {/* Dual Module Transformation Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Module: RAW CHAT */}
          <div
            className={`lg:col-span-5 bg-[#111216] border transition-all duration-300 p-6 shadow-hard flex flex-col justify-between min-h-[440px] relative ${
              transformProgress > 70 ? "opacity-40 border-[#22252B]" : "opacity-100 border-[#FF6B35]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#22252B] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="badge-yellow">RAW CHAT</span>
                  <span className="text-[10px] text-[#7E828C]">UNFORMATTED LOGS</span>
                </div>
                <span className="text-[10px] text-[#FF6B35]">ENTROPY: HIGH</span>
              </div>

              {/* Messy Chat Message Excerpts */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#0A0B0D] border-l-2 border-[#FF6B35]">
                  <div className="text-[9px] text-[#7E828C] flex justify-between">
                    <span>11:42 PM // ALEX</span>
                    <span>TAG: AUX_CONTROL</span>
                  </div>
                  <p className="text-[#F3F1EC] mt-1">
                    &quot;I literally told you guys not to touch the aux cord 5 minutes ago&quot;
                  </p>
                </div>

                <div className="p-3 bg-[#0A0B0D] border-l-2 border-[#7E828C]">
                  <div className="text-[9px] text-[#7E828C] flex justify-between">
                    <span>11:43 PM // LIAM</span>
                    <span>TAG: REBUTTAL</span>
                  </div>
                  <p className="text-[#D8D5CC] mt-1">
                    &quot;Nobody wants to listen to 14-minute experimental synth tracks bro&quot;
                  </p>
                </div>

                <div className="p-3 bg-[#0A0B0D] border-l-2 border-[#00E5FF]">
                  <div className="text-[9px] text-[#7E828C] flex justify-between">
                    <span>11:44 PM // MAYA</span>
                    <span>TAG: MEDIATOR</span>
                  </div>
                  <p className="text-[#D8D5CC] mt-1">
                    &quot;He does this every single road trip without fail 😭&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#22252B] flex items-center justify-between font-mono text-[9px] text-[#7E828C]">
              <span>RAW ENCODING: UTF-8</span>
              <Barcode value="RAW-UNSTRUCTURED" height={14} showText={false} color="#7E828C" />
            </div>
          </div>

          {/* Center: Large Mechanical Directional Pipeline Arrow */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 py-4">
            <div className="font-mono text-[10px] text-[#39FF14] text-center tracking-widest uppercase">
              DECOMPOSE
              <br />&amp; SYNTHESIZE
            </div>

            <div className="w-12 h-12 bg-[#16181D] border border-[#39FF14] flex items-center justify-center font-display text-2xl text-[#39FF14] shadow-hard">
              →
            </div>

            <div className="font-mono text-[9px] text-[#7E828C] text-center">
              HEURISTIC MAPPING
              <br />
              {transformProgress}% MERGED
            </div>
          </div>

          {/* Right Module: GENERATED GAME UI */}
          <div
            className={`lg:col-span-5 bg-[#111216] border transition-all duration-300 p-6 shadow-hard-lg flex flex-col justify-between min-h-[440px] relative ${
              transformProgress >= 50
                ? "opacity-100 border-[#39FF14] phosphor-glow-active"
                : "opacity-40 border-[#22252B]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#22252B] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="badge-phosphor">GAME 01</span>
                  <span className="text-[#F3F1EC] font-bold">WHO SAID IT?</span>
                </div>
                <span className="text-[10px] text-[#39FF14]">STATUS: COMPILED</span>
              </div>

              {/* Game Question Card */}
              <div className="p-4 bg-[#0A0B0D] border border-[#22252B] mb-4">
                <div className="text-[9px] font-mono text-[#FFD000] mb-1">
                  QUESTION // PROMPT #042
                </div>
                <div className="font-display text-base font-bold text-[#F3F1EC] leading-tight">
                  &quot;WHO WOULD MOST LIKELY SAY THIS?&quot;
                </div>
                <div className="mt-2 font-mono text-xs text-[#39FF14] italic">
                  &quot;I literally told you guys not to touch the aux cord&quot;
                </div>
              </div>

              {/* Square Answer Modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                {[
                  { key: "01 / A", name: "ALEX (THE AUX TYRANT)", correct: true },
                  { key: "02 / B", name: "MAYA (LORE KEEPER)", correct: false },
                  { key: "03 / C", name: "SAM (LATE NIGHT POET)", correct: false },
                  { key: "04 / D", name: "LIAM (OPINIONATED)", correct: false },
                ].map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border text-[11px] transition-colors ${
                      ans.correct
                        ? "bg-[#16181D] border-[#39FF14] text-[#39FF14] font-bold"
                        : "bg-[#0A0B0D] border-[#22252B] text-[#D8D5CC]"
                    }`}
                  >
                    <span className="text-[9px] text-[#7E828C] block mb-0.5">{ans.key}</span>
                    <span>{ans.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#22252B] flex items-center justify-between font-mono text-[9px]">
              <span className="text-[#39FF14]">COMPILED BY VYBZ ENGINE</span>
              <Barcode value="GAME-ROM-01" height={14} showText={false} color="#39FF14" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

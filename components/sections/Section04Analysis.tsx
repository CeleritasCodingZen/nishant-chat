"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

gsap.registerPlugin(ScrollTrigger);

export const Section04Analysis: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messagesCount, setMessagesCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [memoryClustersCount, setMemoryClustersCount] = useState(0);
  const [potentialCount, setPotentialCount] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Counter animation triggered by ScrollTrigger
      const obj = { msgs: 0, pats: 0, clusters: 0, pot: 0 };
      gsap.to(obj, {
        msgs: 17492,
        pats: 283,
        clusters: 47,
        pot: 98,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true,
        },
        onUpdate: () => {
          setMessagesCount(Math.floor(obj.msgs));
          setPatternsCount(Math.floor(obj.pats));
          setMemoryClustersCount(Math.floor(obj.clusters));
          setPotentialCount(Math.floor(obj.pot));
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-analysis"
      ref={containerRef}
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">03 // ANALYSIS</span>
          <span>ANALYSIS CORE // 001</span>
          <span className="text-[#39FF14]">// HEURISTIC ENGINE</span>
        </div>

        {/* Huge Headline */}
        <div className="mb-14">
          <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
            VYBZ READS
            <br />
            <span className="text-[#39FF14]">BETWEEN THE LINES.</span>
          </h2>
          <div className="mt-4 font-mono text-sm text-[#D8D5CC] max-w-xl border-l-2 border-[#39FF14] pl-4 py-1">
            AN INDUSTRIAL ANALYSIS MACHINE THAT SIFTS THROUGH INSIDE JOKES,
            UNSPOKEN RIVALRIES, TIMING CADENCES, AND RECURRING PHRASES.
          </div>
        </div>

        {/* Telemetry Counter Ledger (Tabular Numbers) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            {
              label: "MESSAGES PARSED",
              val: messagesCount.toLocaleString(),
              unit: "ENTRIES",
              color: "text-[#F3F1EC]",
              borderColor: "border-[#22252B]",
            },
            {
              label: "PATTERNS FOUND",
              val: patternsCount.toLocaleString(),
              unit: "SIGNALS",
              color: "text-[#39FF14]",
              borderColor: "border-[#39FF14]/30",
            },
            {
              label: "MEMORY CLUSTERS",
              val: memoryClustersCount.toLocaleString(),
              unit: "NODES",
              color: "text-[#FFD000]",
              borderColor: "border-[#FFD000]/30",
            },
            {
              label: "GAME POTENTIAL",
              val: `${potentialCount}%`,
              unit: "EFFICIENCY",
              color: "text-[#00E5FF]",
              borderColor: "border-[#00E5FF]/30",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-[#111216] border ${item.borderColor} p-5 shadow-hard flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7E828C] mb-3">
                <span>0{idx + 1} // TELEMETRY</span>
                <span>{item.unit}</span>
              </div>
              <div
                className={`font-display text-4xl sm:text-5xl font-extrabold tabular-numbers ${item.color}`}
              >
                {item.val}
              </div>
              <div className="font-mono text-[11px] text-[#7E828C] mt-2 font-bold tracking-wider uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Industrial Analysis Machine: Node Graph + Live Diagnostic Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Circuit Schematic Node Diagram */}
          <div className="lg:col-span-7 bg-[#111216] border border-[#22252B] p-6 shadow-hard-lg flex flex-col justify-between relative min-h-[380px]">
            <div className="flex items-center justify-between font-mono text-xs text-[#7E828C] border-b border-[#22252B] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#39FF14] animate-pulse" />
                <span className="text-[#F3F1EC] font-bold">SCHEMATIC // CLUSTER_GRAPH_01</span>
              </div>
              <span className="text-[#39FF14]">TOPOLOGY: MULTI-CENTROID</span>
            </div>

            {/* SVG Circuit Schematic Canvas */}
            <div className="relative flex-1 flex items-center justify-center p-4">
              <svg className="w-full h-64" viewBox="0 0 500 240" fill="none">
                {/* Circuit Grid Coordinate Lines */}
                <path d="M 50 120 L 450 120" stroke="rgba(57, 255, 20, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 250 20 L 250 220" stroke="rgba(57, 255, 20, 0.15)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Connecting Bus Lines */}
                <line x1="100" y1="60" x2="250" y2="120" stroke="#39FF14" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="120" y1="180" x2="250" y2="120" stroke="#39FF14" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="380" y1="60" x2="250" y2="120" stroke="#39FF14" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="400" y1="180" x2="250" y2="120" stroke="#39FF14" strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1="100" y1="60" x2="120" y2="180" stroke="rgba(0, 229, 255, 0.3)" strokeWidth="1" />
                <line x1="380" y1="60" x2="400" y2="180" stroke="rgba(255, 208, 0, 0.3)" strokeWidth="1" />

                {/* Central Analysis Core Node */}
                <circle cx="250" cy="120" r="32" fill="#0A0B0D" stroke="#39FF14" strokeWidth="2" />
                <circle cx="250" cy="120" r="24" fill="#16181D" stroke="#39FF14" strokeWidth="1" strokeDasharray="2 2" />
                <text x="250" y="123" textAnchor="middle" fill="#39FF14" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  CORE_01
                </text>

                {/* Node 1: Recurring Jokes */}
                <rect x="60" y="40" width="80" height="36" fill="#16181D" stroke="#39FF14" strokeWidth="1" />
                <text x="100" y="58" textAnchor="middle" fill="#F3F1EC" fontSize="8" fontFamily="monospace">
                  INSIDE JOKES
                </text>
                <text x="100" y="69" textAnchor="middle" fill="#39FF14" fontSize="7" fontFamily="monospace">
                  94 NODES
                </text>

                {/* Node 2: Feuds & Debates */}
                <rect x="75" y="160" width="90" height="36" fill="#16181D" stroke="#FF334B" strokeWidth="1" />
                <text x="120" y="178" textAnchor="middle" fill="#F3F1EC" fontSize="8" fontFamily="monospace">
                  DEBATE CADENCE
                </text>
                <text x="120" y="189" textAnchor="middle" fill="#FF334B" fontSize="7" fontFamily="monospace">
                  HOT TAKES
                </text>

                {/* Node 3: Audio & Music Lore */}
                <rect x="340" y="40" width="80" height="36" fill="#16181D" stroke="#00E5FF" strokeWidth="1" />
                <text x="380" y="58" textAnchor="middle" fill="#F3F1EC" fontSize="8" fontFamily="monospace">
                  AUDIO LORE
                </text>
                <text x="380" y="69" textAnchor="middle" fill="#00E5FF" fontSize="7" fontFamily="monospace">
                  AUX RECORD
                </text>

                {/* Node 4: Nicknames & Identities */}
                <rect x="360" y="160" width="80" height="36" fill="#16181D" stroke="#FFD000" strokeWidth="1" />
                <text x="400" y="178" textAnchor="middle" fill="#F3F1EC" fontSize="8" fontFamily="monospace">
                  PROFILES
                </text>
                <text x="400" y="189" textAnchor="middle" fill="#FFD000" fontSize="7" fontFamily="monospace">
                  4 CHARACTERS
                </text>
              </svg>
            </div>

            <div className="flex items-center justify-between font-mono text-[9px] text-[#7E828C] border-t border-[#22252B] pt-2">
              <span>ALGORITHM: HEURISTIC VECTOR CLUSTERING</span>
              <span>SYNAPSE COUNT: 1,489</span>
            </div>
          </div>

          {/* Right: AI Analysis Diagnostic Terminal */}
          <div className="lg:col-span-5 bg-[#010304] border border-[#22252B] p-5 shadow-hard-lg font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#22252B] text-[10px] text-[#7E828C]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#39FF14]" />
                  <span>LOG BUFFER // PARSER_EXEC</span>
                </div>
                <span>STREAM: STDOUT</span>
              </div>

              {/* Scrolling Terminal Output */}
              <div className="space-y-2 text-[11px] leading-relaxed">
                <div className="text-[#7E828C]">
                  &gt; INITIALIZING ANALYSIS CORE...
                </div>
                <div className="text-[#39FF14]">
                  &gt; PARSING 17,492 MESSAGE CLUSTERS [DONE]
                </div>
                <div className="text-[#D8D5CC]">
                  &gt; DETECTING INTERPERSONAL RELATIONSHIPS:
                  <div className="pl-4 text-[10px] text-[#7E828C]">
                    - ALEX ↔ LIAM: 84% RIVALRY SCORE (AUX CORD CONFLICT)
                    <br />
                    - MAYA: 92% GROUP MEMORY RECALL (HISTORIAN)
                  </div>
                </div>
                <div className="text-[#FFD000]">
                  &gt; IDENTIFYING RECURRING CATCHPHRASES...
                </div>
                <div className="text-[#00E5FF]">
                  &gt; MAPPING PERSONALITY PROFILES [4 PLAYERS ACTIVE]
                </div>
                <div className="text-[#D8D5CC]">
                  &gt; BUILDING DYNAMIC QUESTION BANK (50 QUESTIONS)
                </div>
                <div className="text-[#39FF14] font-bold">
                  &gt; GAME ENGINE: READY TO COMPILE ROM
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#22252B] flex items-center justify-between text-[9px] text-[#7E828C] mt-4">
              <span>LATENCY: 12ms</span>
              <Barcode value="AI-CORE-OK" height={14} showText={false} color="#39FF14" />
              <span className="text-[#39FF14]">SYS_OK</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Barcode } from "../ui/Barcode";

gsap.registerPlugin(ScrollTrigger);

export const Section10GameLoop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Rotation driven by scroll
      gsap.to(ringRef.current, {
        rotation: 360,
        transformOrigin: "center center",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    { label: "INPUT", angle: 0, desc: "RAW CHATS" },
    { label: "ANALYZE", angle: 51.4, desc: "HEURISTICS" },
    { label: "GENERATE", angle: 102.8, desc: "ROM FORGING" },
    { label: "PLAY", angle: 154.2, desc: "TRIVIA BATTLE" },
    { label: "ANSWER", angle: 205.6, desc: "USER DECISION" },
    { label: "LEARN", angle: 257.0, desc: "WEIGHT UPDATE" },
    { label: "REPEAT", angle: 308.4, desc: "NEW CARTRIDGE" },
  ];

  return (
    <section
      id="section-gameloop"
      ref={containerRef}
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center">
        {/* Header Telemetry */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">09 // CORE SCHEMATIC</span>
          <span>HARDWARE FEEDBACK SYSTEM</span>
          <span className="text-[#39FF14]">// CLOSED LOOP PCB</span>
        </div>

        {/* Section Headline */}
        <h2 className="type-headline-xl text-[#F3F1EC] mb-2 uppercase">
          THE HARDWARE
          <br />
          <span className="text-[#39FF14]">PRODUCT LOOP.</span>
        </h2>

        <p className="font-mono text-xs text-[#D8D5CC] max-w-lg mb-12">
          INPUT → ANALYZE → GENERATE → PLAY → ANSWER → LEARN → REPEAT.
          EVERY COMPLETED ROUND MAKES THE NEXT CARTRIDGE MORE ACCURATE.
        </p>

        {/* Large Interactive PCB Schematic Ring */}
        <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center my-4">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 500 500"
            fill="none"
          >
            {/* Outer PCB Trace Rings */}
            <circle cx="250" cy="250" r="220" stroke="rgba(57, 255, 20, 0.15)" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="190" stroke="rgba(57, 255, 20, 0.3)" strokeWidth="1" />
            <circle cx="250" cy="250" r="140" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Rotating Ring with Nodes */}
            <g ref={ringRef} style={{ transformOrigin: "250px 250px" }}>
              {steps.map((step, idx) => {
                const rad = (step.angle * Math.PI) / 180;
                const r = 190;
                const x = 250 + r * Math.cos(rad);
                const y = 250 + r * Math.sin(rad);

                return (
                  <g key={idx}>
                    {/* Trace connector to center */}
                    <line
                      x1="250"
                      y1="250"
                      x2={x}
                      y2={y}
                      stroke="rgba(57, 255, 20, 0.15)"
                      strokeWidth="1"
                    />

                    {/* Node chassis */}
                    <rect
                      x={x - 42}
                      y={y - 18}
                      width="84"
                      height="36"
                      fill="#111216"
                      stroke="#39FF14"
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill="#39FF14"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {step.label}
                    </text>
                    <text
                      x={x}
                      y={y + 10}
                      textAnchor="middle"
                      fill="#7E828C"
                      fontSize="7"
                      fontFamily="monospace"
                    >
                      {step.desc}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Center Fixed Station: VYBZ Core */}
            <circle cx="250" cy="250" r="65" fill="#0A0B0D" stroke="#39FF14" strokeWidth="2" />
            <circle cx="250" cy="250" r="55" fill="#16181D" stroke="#22252B" strokeWidth="1" />

            <text
              x="250"
              y="245"
              textAnchor="middle"
              fill="#F3F1EC"
              fontSize="16"
              fontFamily="Space Grotesk, sans-serif"
              fontWeight="bold"
              letterSpacing="2"
            >
              VYBZ
            </text>
            <text
              x="250"
              y="262"
              textAnchor="middle"
              fill="#39FF14"
              fontSize="7"
              fontFamily="monospace"
              fontWeight="bold"
            >
              CLOSED LOOP
            </text>
          </svg>
        </div>

        {/* Below Statement */}
        <div className="mt-8 font-mono text-sm tracking-widest text-[#F3F1EC] uppercase border-t border-b border-[#22252B] py-3 px-8">
          PLAY. <span className="text-[#39FF14]">LEARN.</span> REPEAT.
        </div>
      </div>
    </section>
  );
};

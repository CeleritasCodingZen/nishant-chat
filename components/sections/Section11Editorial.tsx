"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const Section11Editorial: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLHeadingElement>(null);
  const line2Ref = useRef<HTMLHeadingElement>(null);
  const line3Ref = useRef<HTMLHeadingElement>(null);
  const line4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Independent scroll drift for brutalist typography tension
      gsap.to(line1Ref.current, {
        x: -90,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(line2Ref.current, {
        x: 50,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.4,
        },
      });

      gsap.to(line3Ref.current, {
        x: -30,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.to(line4Ref.current, {
        x: 110,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.6,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[85vh] py-32 px-4 md:px-10 border-b border-[#22252B] bg-[#0A0B0D] flex flex-col justify-center overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto w-full">
        {/* Tiny Telemetry Marker */}
        <div className="font-mono text-xs text-[#7E828C] mb-8 flex items-center gap-2">
          <span className="badge-phosphor">10 // MANIFESTO</span>
          <span>EDITORIAL BREAK // MAXIMUM SCALE</span>
        </div>

        {/* Huge Typographic Composition (Independent Multi-line Drift) */}
        <div className="space-y-1 select-none">
          <h2
            ref={line1Ref}
            className="type-titanic text-[#F3F1EC] leading-none will-change-transform"
          >
            YOUR GROUP CHAT
          </h2>

          <h2
            ref={line2Ref}
            className="type-titanic text-[#D8D5CC] pl-6 md:pl-20 leading-none will-change-transform"
          >
            WAS NEVER
          </h2>

          <h2
            ref={line3Ref}
            className="type-titanic text-[#39FF14] pl-2 md:pl-8 leading-none will-change-transform drop-shadow-[0_0_16px_rgba(57,255,20,0.3)]"
          >
            JUST A CHAT.
          </h2>
        </div>

        {/* Sub-Manifesto Line */}
        <div
          ref={line4Ref}
          className="mt-12 md:mt-16 pl-6 md:pl-24 will-change-transform"
        >
          <p className="font-display text-2xl md:text-4xl font-bold uppercase tracking-tight text-[#FFD000]">
            IT WAS A GAME WAITING TO HAPPEN.
          </p>
          <div className="font-mono text-xs text-[#7E828C] mt-2 tracking-widest uppercase">
            [ ARCHIVAL PREMISE // AUTHORED BY YOUR FRIENDS ]
          </div>
        </div>
      </div>
    </section>
  );
};

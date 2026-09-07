"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Barcode } from "../ui/Barcode";

gsap.registerPlugin(ScrollTrigger);

export const Section02Input: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frag1Ref = useRef<HTMLDivElement>(null);
  const frag2Ref = useRef<HTMLDivElement>(null);
  const frag3Ref = useRef<HTMLDivElement>(null);
  const frag4Ref = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax drift for chat fragments
      gsap.to(frag1Ref.current, {
        x: -50,
        y: -30,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      gsap.to(frag2Ref.current, {
        x: 60,
        y: 40,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(frag3Ref.current, {
        x: -40,
        y: 50,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.8,
        },
      });

      gsap.to(frag4Ref.current, {
        x: 50,
        y: -40,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.4,
        },
      });

      gsap.to(receiptRef.current, {
        y: -35,
        rotate: 1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-input"
      ref={containerRef}
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Telemetry */}
        <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-8">
          <span className="badge-phosphor">01 // INPUT</span>
          <span>INGESTION PROTOCOL: ACTIVE</span>
          <span className="text-[#39FF14]">// RAW CHAT LOGS</span>
        </div>

        {/* Huge Headline & Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Giant Display Typography */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            <h2 className="type-headline-xl text-[#F3F1EC] leading-none">
              YOU
              <br />
              ALREADY
              <br />
              MADE
              <br />
              <span className="text-[#39FF14]">THE CONTENT.</span>
            </h2>

            <div className="mt-8 font-mono text-sm text-[#D8D5CC] max-w-md border-l-2 border-[#39FF14] pl-4 py-1 leading-relaxed">
              YOUR GROUP CHAT IS FULL OF MEMORIES, CHARACTERS, OPINIONS AND CHAOS.
              VYBZ DOES NOT INVENT STORIES — IT EXTRACTS THE LORE YOU HAVE ALREADY WRITTEN.
            </div>

            {/* Hardware Specification Box */}
            <div className="mt-8 p-4 bg-[#111216] border border-[#22252B] max-w-md font-mono text-xs text-[#7E828C] space-y-2">
              <div className="flex justify-between border-b border-[#22252B] pb-1 text-[10px]">
                <span className="text-[#39FF14]">TELEMETRY REGISTRATION</span>
                <span>CHASSIS // 002</span>
              </div>
              <div className="flex justify-between">
                <span>SUPPORTED STREAMS:</span>
                <span className="text-[#F3F1EC]">WHATSAPP, DISCORD, IMESSAGE, TELEGRAM</span>
              </div>
              <div className="flex justify-between">
                <span>PARSER ARCHITECTURE:</span>
                <span className="text-[#39FF14]">OFF-LINE REGEX + EMBEDDING MAP</span>
              </div>
              <div className="flex justify-between">
                <span>ENCRYPTION:</span>
                <span className="text-[#FFD000]">AES-256 USER-CONTAINED</span>
              </div>
            </div>
          </div>

          {/* Right: Physical Chat Data Artifacts & Thermal Receipts */}
          <div className="lg:col-span-6 relative min-h-[500px] flex items-center justify-center">
            {/* Artifact 1: Thermal Receipt Strip */}
            <div
              ref={receiptRef}
              className="thermal-receipt thermal-receipt-serrated p-5 w-full max-w-[320px] z-20"
              style={{ transform: "rotate(-1.5deg)" }}
            >
              <div className="flex justify-between items-center border-b border-black/20 pb-2 mb-3 text-[9px]">
                <span className="font-bold">*** VYBZ RECEIPT ***</span>
                <span>TRANS: #99482</span>
              </div>

              <div className="space-y-1 text-[10px] leading-tight mb-4">
                <div className="flex justify-between">
                  <span>SOURCE:</span>
                  <span className="font-bold">SUNDAY BOYZZ GROUP</span>
                </div>
                <div className="flex justify-between">
                  <span>RANGE:</span>
                  <span>AUG 2024 - PRESENT</span>
                </div>
                <div className="flex justify-between">
                  <span>VOLUME:</span>
                  <span className="font-bold">17,492 MESSAGES</span>
                </div>
                <div className="flex justify-between">
                  <span>DISCOVERED NICKNAMES:</span>
                  <span>14 TAGS</span>
                </div>
                <div className="flex justify-between">
                  <span>RECURRING DEBATES:</span>
                  <span>8 THREADS</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black/30 pt-3 mb-3 text-[9px] text-center italic">
                &quot;BRO NO WAY 💀 YOU LITERALLY SAID THE OPPOSITE IN AUGUST&quot;
              </div>

              <div className="pt-2 border-t border-black/20 flex flex-col items-center gap-1">
                <Barcode value="RAW-CHAT-INGEST" height={22} color="#0A0B0D" />
                <span className="text-[8px] uppercase tracking-widest font-bold">
                  VERIFIED CHAT DISPATCH // 00231
                </span>
              </div>
            </div>

            {/* Fragment 1: Bro no way */}
            <div
              ref={frag1Ref}
              className="absolute -top-4 left-2 sm:-left-6 bg-[#16181D] border border-[#22252B] p-3 shadow-hard max-w-[220px] font-mono z-10"
            >
              <div className="flex items-center justify-between text-[8px] text-[#39FF14] mb-1">
                <span>02:14 AM // ALEX</span>
                <span>MSG #14201</span>
              </div>
              <p className="text-xs text-[#F3F1EC]">&gt; bro no way 💀</p>
            </div>

            {/* Fragment 2: Remember last summer */}
            <div
              ref={frag2Ref}
              className="absolute top-12 -right-2 sm:-right-8 bg-[#111216] border border-[#FFD000] p-3 shadow-hard max-w-[240px] font-mono z-30"
            >
              <div className="flex items-center justify-between text-[8px] text-[#FFD000] mb-1">
                <span>04:32 PM // MAYA</span>
                <span>MSG #08941</span>
              </div>
              <p className="text-xs text-[#F3F1EC]">&gt; remember last summer at the cabin?</p>
              <div className="mt-1 text-[8px] text-[#7E828C]">[RECALLED BY 6 PLAYERS]</div>
            </div>

            {/* Fragment 3: WHO INVITED HIM */}
            <div
              ref={frag3Ref}
              className="absolute bottom-6 -left-4 sm:left-4 bg-[#16181D] border border-[#FF334B] p-3 shadow-hard max-w-[210px] font-mono z-10"
            >
              <div className="flex items-center justify-between text-[8px] text-[#FF334B] mb-1">
                <span>11:59 PM // SAM</span>
                <span>FLAG: CHAOS</span>
              </div>
              <p className="text-xs text-[#F3F1EC]">&gt; WHO INVITED HIM</p>
            </div>

            {/* Fragment 4: Inventory Label Strip */}
            <div
              ref={frag4Ref}
              className="absolute -bottom-6 right-2 sm:right-10 bg-[#1F2022] border border-[#00E5FF] px-3 py-2 shadow-hard font-mono text-[10px] text-[#00E5FF] z-20"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00E5FF] animate-ping" />
                <span>CHAT LOG // 00231</span>
              </div>
              <div className="text-[8px] text-[#7E828C] mt-0.5">STATUS: IMPORTED &amp; INDEXED</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

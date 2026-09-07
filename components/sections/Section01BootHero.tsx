"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { ScrambleText } from "../ui/ScrambleText";

gsap.registerPlugin(ScrollTrigger);

interface Section01BootHeroProps {
  onInsertCoin: () => void;
  coins: number;
}

export const Section01BootHero: React.FC<Section01BootHeroProps> = ({
  onInsertCoin,
  coins,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vybzWordmarkRef = useRef<HTMLHeadingElement>(null);
  const chatsLineRef = useRef<HTMLDivElement>(null);
  const gamesLineRef = useRef<HTMLDivElement>(null);
  const crtMonitorRef = useRef<HTMLDivElement>(null);
  const bootBannerRef = useRef<HTMLDivElement>(null);

  const [bootStep, setBootStep] = useState<number>(0);
  const [crtFlicker, setCrtFlicker] = useState<boolean>(false);

  useEffect(() => {
    // Initial Boot Sequence Animation
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setBootStep(3),
      });

      // 0.0s - 0.4s: System Boot Telemetry
      tl.to(bootBannerRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        onStart: () => setBootStep(1),
      })
        // 0.6s: Giant VYBZ wordmark scales in
        .fromTo(
          vybzWordmarkRef.current,
          { scale: 0.88, opacity: 0, y: 30 },
          {
            scale: 1,
            opacity: 0.22,
            y: 0,
            duration: 0.9,
            ease: "expo.out",
            onStart: () => setBootStep(2),
          },
          "+=0.2"
        )
        // 1.0s: Hero lines enter
        .fromTo(
          chatsLineRef.current,
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.4"
        )
        .fromTo(
          gamesLineRef.current,
          { x: 100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.5"
        )
        // 1.4s: CRT Monitor powers on
        .fromTo(
          crtMonitorRef.current,
          { scaleY: 0.02, opacity: 0.5 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.5,
            ease: "elastic.out(1, 0.5)",
            onStart: () => sound.playCrtPower(),
          },
          "-=0.2"
        );

      // Kinetic Hero Scroll Parallax Scrubbing
      gsap.to(chatsLineRef.current, {
        x: -120,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(gamesLineRef.current, {
        x: 140,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(vybzWordmarkRef.current, {
        y: 80,
        opacity: 0.05,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCoinClick = () => {
    sound.playCoin();
    setCrtFlicker(true);
    setTimeout(() => setCrtFlicker(false), 600);
    onInsertCoin();

    // Scroll toward interactive play or data port
    const portEl = document.getElementById("section-dataport");
    if (portEl) {
      setTimeout(() => {
        portEl.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  const handleViewMachine = () => {
    sound.playClick();
    const inputEl = document.getElementById("section-input");
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="boot-hero"
      ref={containerRef}
      className="relative min-h-screen pt-24 pb-20 px-4 md:px-10 flex flex-col justify-between overflow-hidden border-b border-[#22252B]"
    >
      {/* Background Subtle Coordinate Canvas */}
      <div className="canvas-blueprint-grid opacity-30" />

      {/* TOP SYSTEM BOOT BANNER */}
      <div
        ref={bootBannerRef}
        className="relative z-10 w-full max-w-[1400px] mx-auto opacity-0 flex flex-wrap items-center justify-between gap-4 border-b border-[#22252B] pb-4"
      >
        <div className="flex items-center gap-3">
          <span className="badge-phosphor">SYSTEM 01</span>
          <span className="font-mono text-[11px] text-[#7E828C]">
            <ScrambleText text="INITIALIZING HARDWARE CORE..." speed={25} />
          </span>
          <span className="text-[#39FF14] text-xs font-mono">
            {bootStep >= 1 ? "● ONLINE" : "○ BOOTING"}
          </span>
        </div>

        {/* Tiny System Telemetry */}
        <div className="flex items-center gap-4 font-mono text-[10px] text-[#7E828C]">
          <span>BUILD: 01.04</span>
          <span className="hidden sm:inline">MEMORY: 64KB ROM</span>
          <span className="text-[#39FF14]">PLAYER: DETECTED</span>
          <span className="text-[#FFD000]">ENGINE: READY</span>
        </div>
      </div>

      {/* GIANT EDITORIAL BACKGROUND WORDMARK (OCCUPIES ENORMOUS VIEWPORT AREA) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <h1
          ref={vybzWordmarkRef}
          className="font-display font-extrabold text-[24vw] leading-none tracking-tighter text-[#F3F1EC]/15 uppercase"
        >
          VYBZ
        </h1>
      </div>

      {/* CENTER EDITORIAL HERO COMPOSITION (12-COLUMN ASYMMETRICAL GRID) */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-12">
        {/* Left Columns: Kinetic Titanic Headlines */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          {/* Micro Telemetry Tag */}
          <div className="flex items-center gap-3 font-mono text-xs text-[#7E828C] mb-2">
            <span className="text-[#39FF14]">┌</span>
            <span>INPUT DETECTED // 17,492 MESSAGES</span>
            <span className="text-[#39FF14]">┘</span>
            <span className="text-[#FFD000] hidden sm:inline">[ MEMORY POTENTIAL: HIGH ]</span>
          </div>

          {/* Line 1: YOUR CHATS */}
          <div ref={chatsLineRef} className="will-change-transform">
            <h2 className="type-titanic text-[#F3F1EC] drop-shadow-sm">
              YOUR CHATS.
            </h2>
          </div>

          {/* Line 2: BECOME GAMES */}
          <div
            ref={gamesLineRef}
            className="pl-4 sm:pl-12 lg:pl-24 will-change-transform flex items-baseline gap-4"
          >
            <h2 className="type-titanic text-[#39FF14] drop-shadow-[0_0_12px_rgba(57,255,20,0.35)]">
              BECOME GAMES.
            </h2>
          </div>

          {/* Supporting Brutalist Hardware Copy */}
          <div className="mt-8 max-w-xl font-mono text-xs sm:text-sm text-[#D8D5CC] border-l-2 border-[#39FF14] pl-4 py-1 leading-relaxed">
            <p>
              VYBZ takes the chaos, inside jokes, and relationships in your group chat
              and turns them into personalized arcade mini-games. The AI learns from
              every answer and adapts future cartridges.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={handleCoinClick}
              className="btn-phosphor px-8 py-4 text-xs tracking-widest text-[#0A0B0D] font-bold shadow-hard cursor-pointer"
              data-cursor="COIN"
            >
              <span>INSERT COIN →</span>
              <span className="px-1.5 py-0.5 bg-[#0A0B0D] text-[#39FF14] text-[10px]">
                {coins > 0 ? `${coins} READY` : "00"}
              </span>
            </button>

            <button
              onClick={handleViewMachine}
              className="btn-terminal px-6 py-4 text-xs tracking-widest cursor-pointer"
              data-cursor="VIEW"
            >
              VIEW THE MACHINE →
            </button>
          </div>
        </div>

        {/* Right Columns: Physical CRT Arcade Monitor Module */}
        <div className="lg:col-span-4 flex justify-center lg:justify-end">
          <div
            ref={crtMonitorRef}
            className={`w-full max-w-[340px] bg-[#111216] border border-[#22252B] p-3 shadow-hard-lg relative transition-all duration-100 ${
              crtFlicker ? "brightness-150 contrast-125" : ""
            }`}
          >
            {/* Top Chassis Hardware Screws & Label */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#22252B] font-mono text-[9px] text-[#7E828C]">
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14] font-bold">⊕</span>
                <span>CRT-MOD // 8849</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="led-green animate-pulse" />
                <span className="text-[#39FF14]">CHASSIS_01</span>
                <span className="text-[#7E828C] font-bold">⊕</span>
              </div>
            </div>

            {/* CRT Display Screen */}
            <div className="crt-monitor-frame p-5 text-center flex flex-col justify-between min-h-[260px] relative">
              {/* Scanline raster overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#39FF14]/5 to-transparent h-6 animate-[scanline_4s_linear_infinite]" />

              <div className="flex items-center justify-between text-[8px] font-mono text-[#7E828C] border-b border-[#39FF14]/20 pb-2">
                <span>FREQ: 15.75 kHz</span>
                <span className="text-[#39FF14]">● SYNC LOCK</span>
              </div>

              {/* Main CRT Content */}
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="font-mono text-xs tracking-widest text-[#FFD000] font-bold">
                  ★ READY PLAYER 01 ★
                </div>

                <div className="font-display text-2xl font-black tracking-tight text-[#F3F1EC] uppercase">
                  INSERT COIN
                </div>

                <div className="w-16 h-1 bg-[#39FF14] shadow-[0_0_8px_#39FF14] my-1" />

                <div className="font-mono text-[10px] text-[#39FF14] tracking-wider">
                  <ScrambleText text="GAME ENGINE: ONLINE" speed={40} />
                </div>
              </div>

              {/* CRT Bottom Diagnostic & Barcode */}
              <div className="pt-2 border-t border-[#39FF14]/20 flex items-center justify-between">
                <Barcode value="COIN-OP-01" height={16} showText={false} color="#39FF14" />
                <span className="font-mono text-[8px] text-[#7E828C] uppercase">
                  ROM REV 1.4
                </span>
              </div>
            </div>

            {/* Bottom Hardware Screws */}
            <div className="flex items-center justify-between pt-2 mt-2 font-mono text-[8px] text-[#7E828C]">
              <span>⊕ SCREW_L</span>
              <span className="text-[#39FF14]">STATUS: STANDBY</span>
              <span>⊕ SCREW_R</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TELEMETRY TICKER */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto border-t border-[#22252B] pt-4 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-[#7E828C]">
        <div className="flex items-center gap-3">
          <span className="text-[#39FF14]">► 01/BOOT</span>
          <span>CORE PIPELINE: ACTIVE</span>
          <span className="hidden md:inline text-[#22252B]">|</span>
          <span className="hidden md:inline">SYSTEM ARCHITECTURE: 1980s COIN-OP HARDWARE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#FFD000]">CREDITS: {coins}</span>
          <span className="text-[#F3F1EC]">SCROLL DOWN TO ENGAGE ▼</span>
        </div>
      </div>
    </section>
  );
};

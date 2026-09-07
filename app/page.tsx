"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  scrambleText,
  triggerGlitchSlice,
  crtPowerOn,
  crtQuickGlitch,
  initMagneticButton,
  animateNumericValue,
} from "../lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── SOUND ENGINE ────────────────────────────────────────────────────────────
class SndEngine {
  private ctx: AudioContext | null = null;
  muted = false;
  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const A =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (A) this.ctx = new A();
    }
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }
  tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        freq * 0.5,
        this.ctx.currentTime + dur
      );
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + dur);
    } catch {
      /**/
    }
  }
  click() {
    this.tone(1200, 0.04, "square", 0.08);
  }
  coin() {
    this.tone(987, 0.12, "square", 0.14);
    setTimeout(() => this.tone(1318, 0.35, "square", 0.18), 100);
  }
  crtPower() {
    this.tone(80, 0.5, "sawtooth", 0.07);
  }
  success() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, "triangle", 0.14), i * 75)
    );
  }
  error() {
    this.tone(140, 0.32, "sawtooth", 0.18);
  }
}
const snd = new SndEngine();

// ── BARCODE SVG ──────────────────────────────────────────────────────────────
function Barcode({
  val,
  color = "#7E828C",
  h = 18,
}: {
  val: string;
  color?: string;
  h?: number;
}) {
  const bars = val.split("").flatMap((c) => {
    const n = c.charCodeAt(0);
    return [(n % 3) + 1, ((n >> 1) % 2) + 1, ((n >> 2) % 3) + 1];
  });
  const W = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg
      width={W}
      height={h}
      viewBox={`0 0 ${W} ${h}`}
      className="block flex-shrink-0"
    >
      {bars.map((w, i) => {
        const rx = x;
        x += w;
        return i % 3 === 2 ? null : (
          <rect
            key={i}
            x={rx}
            y={0}
            width={w - 0.3}
            height={h}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

// ── LIVE CLOCK ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState("00:00:00");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setT(
        `${String(n.getUTCHours()).padStart(2, "0")}:${String(
          n.getUTCMinutes()
        ).padStart(2, "0")}:${String(n.getUTCSeconds()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="jb" style={{ fontVariantNumeric: "tabular-nums" }}>
      {t} UTC
    </span>
  );
}

// ── NUMBER COUNTER WITH GSAP INTERPOLATION ────────────────────────────────────
function AnimCounter({
  target,
  duration = 1.6,
  padZeros = 0,
}: {
  target: number;
  duration?: number;
  padZeros?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        animateNumericValue(el, target, duration, padZeros);
      },
    });
    return () => st.kill();
  }, [target, duration, padZeros]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {padZeros
        ? "0".repeat(padZeros)
        : target > 999
        ? "00,000"
        : "0"}
    </span>
  );
}

// ── STEPPED PROGRESS BAR COMPONENT ───────────────────────────────────────────
function ProgBar({
  pct,
  color = "var(--green)",
}: {
  pct: number;
  color?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!track || !fill) return;

    const st = ScrollTrigger.create({
      trigger: track,
      start: "top 92%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          fill,
          { width: "0%" },
          {
            width: `${pct}%`,
            duration: 1.1,
            ease: "steps(12)",
          }
        );
      },
    });
    return () => st.kill();
  }, [pct]);

  return (
    <div ref={trackRef} className="prog-track" style={{ flex: 1 }}>
      <div
        ref={fillRef}
        className="prog-fill"
        style={{ width: "0%", background: color }}
      />
    </div>
  );
}

// ── SECTION MARKER ───────────────────────────────────────────────────────────
function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div
      className="flex items-center gap-3 mb-5"
      style={{
        fontFamily: "var(--jb)",
        fontSize: 10,
        color: "var(--muted)",
        letterSpacing: "0.14em",
      }}
    >
      <span className="chip chip-g">{n}</span>
      <span style={{ color: "var(--muted)" }}>// {label}</span>
      <span
        style={{
          flex: 1,
          borderTop: "1px dashed var(--border)",
          display: "block",
        }}
      />
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function VybzPage() {
  const [coins, setCoins] = useState(2);
  const [muted, setMuted] = useState(false);
  const [answerState, setAnswerState] = useState<null | "correct" | "wrong">(
    null
  );
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [score, setScore] = useState(8420);
  const [activeCart, setActiveCart] = useState(0);
  const [uploadStage, setUploadStage] = useState(0);

  // Global telemetry state
  const [telemetryStatus, setTelemetryStatus] = useState("● ONLINE");
  const [activeSectionId, setActiveSectionId] = useState("hero");

  // Custom Cursor
  const cursorRef = useRef<HTMLDivElement>(null);
  const curSquareRef = useRef<HTMLDivElement>(null);
  const curLabelRef = useRef<HTMLSpanElement>(null);

  // Hero refs
  const heroRef = useRef<HTMLDivElement>(null);
  const bootOverlayRef = useRef<HTMLDivElement>(null);
  const bootTextRef = useRef<HTMLDivElement>(null);
  const bootStatusRef = useRef<HTMLSpanElement>(null);
  const chatsRef = useRef<HTMLHeadingElement>(null);
  const gamesRef = useRef<HTMLHeadingElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const heroCrtRef = useRef<HTMLDivElement>(null);

  // Input & Convergence refs
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const fragRefs = useRef<(HTMLDivElement | null)[]>([]);
  const patternFoundRef = useRef<HTMLDivElement>(null);
  const inputTermRef = useRef<HTMLDivElement>(null);

  // AI Core Pinned refs
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const aiStageBadgeRef = useRef<HTMLSpanElement>(null);
  const aiTerminalRef = useRef<HTMLDivElement>(null);
  const aiGeneratedFlashRef = useRef<HTMLDivElement>(null);

  // Transform Section Pinned refs
  const transformSectionRef = useRef<HTMLDivElement>(null);
  const rawPanelRef = useRef<HTMLDivElement>(null);
  const gamePanelRef = useRef<HTMLDivElement>(null);
  const arrowNodeRef = useRef<HTMLDivElement>(null);

  // Arcade Shelf Pinned refs
  const shelfSectionRef = useRef<HTMLDivElement>(null);
  const shelfTrackRef = useRef<HTMLDivElement>(null);
  const cartridgeDomRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Adaptive Memory refs
  const memoryFlowRef = useRef<HTMLDivElement>(null);
  const profileBarRef = useRef<HTMLDivElement>(null);

  // Editorial wipe ref
  const editorialHeadingRef = useRef<HTMLDivElement>(null);

  // Final CTA refs
  const finalSectionRef = useRef<HTMLDivElement>(null);
  const finalCrtRef = useRef<HTMLDivElement>(null);
  const finalCtaTitleRef = useRef<HTMLHeadingElement>(null);

  // Magnetic Buttons refs
  const heroCoinBtnRef = useRef<HTMLButtonElement>(null);
  const finalCoinBtnRef = useRef<HTMLButtonElement>(null);
  const navCoinBtnRef = useRef<HTMLButtonElement>(null);

  // Data
  const cartridges = [
    {
      id: 0,
      rom: "ROM // 001",
      title: "WHO SAID IT?",
      sub: "IDENTIFY THE AUTHOR",
      score: "08,420",
      diff: "NORMAL",
      accent: "var(--green)",
    },
    {
      id: 1,
      rom: "ROM // 002",
      title: "MEMORY BANK",
      sub: "CHRONOLOGICAL RECALL",
      score: "12,100",
      diff: "HARD",
      accent: "var(--yellow)",
    },
    {
      id: 2,
      rom: "ROM // 003",
      title: "FRIENDSHIP QUIZ",
      sub: "PREDICT BEHAVIOR",
      score: "06,890",
      diff: "MEDIUM",
      accent: "var(--cyan)",
    },
    {
      id: 3,
      rom: "ROM // 004",
      title: "HOT TAKE MACHINE",
      sub: "CONTROVERSY METRIC",
      score: "14,200",
      diff: "EXTREME",
      accent: "var(--orange)",
    },
    {
      id: 4,
      rom: "ROM // 005",
      title: "CHAOS MODE",
      sub: "SPEEDRUN UNFILTERED",
      score: "19,550",
      diff: "BRUTAL",
      accent: "var(--red)",
    },
  ];

  const answers = [
    { key: "A", label: "Alex", tag: "THE AUX TYRANT", correct: true },
    { key: "B", label: "Maya", tag: "LORE KEEPER", correct: false },
    { key: "C", label: "Sam", tag: "VOICE NOTE POET", correct: false },
    { key: "D", label: "Liam", tag: "SERIAL CONTRARIAN", correct: false },
  ];

  const chatFrags = [
    { msg: "bro no way 💀", user: "ALEX", time: "02:14", ox: -140, oy: -60 },
    {
      msg: "remember last summer?",
      user: "MAYA",
      time: "04:32",
      ox: 150,
      oy: 40,
    },
    { msg: "WHO INVITED HIM", user: "SAM", time: "11:59", ox: -80, oy: 90 },
    {
      msg: "you literally said the opposite",
      user: "LIAM",
      time: "01:18",
      ox: 130,
      oy: -90,
    },
    {
      msg: "nah you're actually insane",
      user: "ALEX",
      time: "03:47",
      ox: -160,
      oy: 50,
    },
    { msg: "okay hear me out", user: "MAYA", time: "00:03", ox: 100, oy: 80 },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CUSTOM SQUARE CURSOR WITH GSAP quickTo()
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !cursorRef.current) return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const xTo = gsap.quickTo(cursorRef.current, "x", {
      duration: 0.18,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(cursorRef.current, "y", {
      duration: 0.18,
      ease: "power3.out",
    });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener("mousemove", onMove);

    // Hover interactive expansions
    const squareEl = curSquareRef.current;
    const labelEl = curLabelRef.current;

    const onEnterInteractive = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const customLabel = target.getAttribute("data-cursor") || "PLAY";
      if (labelEl) labelEl.innerText = customLabel;
      squareEl?.classList.add("expanded");
    };

    const onLeaveInteractive = () => {
      squareEl?.classList.remove("expanded");
    };

    const interactives = document.querySelectorAll(
      "button, a, .cartridge, .ans-btn, [data-hover]"
    );
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MAGNETIC INSERT COIN BUTTONS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (heroCoinBtnRef.current)
      cleanups.push(initMagneticButton(heroCoinBtnRef.current, 8));
    if (finalCoinBtnRef.current)
      cleanups.push(initMagneticButton(finalCoinBtnRef.current, 8));
    if (navCoinBtnRef.current)
      cleanups.push(initMagneticButton(navCoinBtnRef.current, 6));

    return () => cleanups.forEach((c) => c());
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. COMPLETE GSAP TIMELINES & SCROLLTRIGGERS
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // ----------------------------------------------------------------------
      // SPEC 1 & 2: HERO CINEMATIC SYSTEM BOOT & GLITCH REVEAL
      // ----------------------------------------------------------------------
      const bootTl = gsap.timeline();

      // Start: veiled in darkness, only top badge visible
      if (bootTextRef.current && bootStatusRef.current && heroRef.current) {
        bootTl
          .to(bootTextRef.current, {
            text: "SYSTEM BOOT...",
            duration: 0.45,
            ease: "none",
            onStart: () => snd.crtPower(),
          })
          .call(() => {
            // Rapid scramble cycle: INITIALIZING -> INIT1ALIZING -> INIT!ALIZING -> INITIALIZING -> READY
            let step = 0;
            const seq = [
              "INITIALIZING",
              "INIT1ALIZING",
              "INIT!ALIZING",
              "INITIALIZING",
              "READY",
            ];
            const seqInt = setInterval(() => {
              if (bootStatusRef.current) {
                bootStatusRef.current.innerText = seq[step % seq.length];
              }
              step++;
              if (step >= seq.length) {
                clearInterval(seqInt);
                if (bootStatusRef.current) {
                  bootStatusRef.current.innerText = "READY";
                }
              }
            }, 65);
          })
          .to({}, { duration: 0.4 })
          // Double-flash of ● ONLINE
          .call(() => {
            setTelemetryStatus("● ONLINE");
            snd.click();
          })
          .to(".hero-online-led", {
            opacity: 0,
            duration: 0.08,
            repeat: 3,
            yoyo: true,
            ease: "steps(1)",
          })
          // Lift boot veil and reveal hero typography
          .to(
            bootOverlayRef.current,
            {
              opacity: 0,
              duration: 0.35,
              ease: "power2.out",
              onComplete: () => {
                if (bootOverlayRef.current)
                  bootOverlayRef.current.style.pointerEvents = "none";
              },
            },
            "+=0.1"
          )
          .call(() => {
            // Glitch text reveal of YOUR CHATS. and BECOME GAMES.
            if (chatsRef.current) {
              scrambleText(chatsRef.current, "YOUR CHATS.", 0.65, () => {
                triggerGlitchSlice(chatsRef.current!, 0.2);
              });
            }
            if (gamesRef.current) {
              scrambleText(gamesRef.current, "BECOME GAMES.", 0.75, () => {
                triggerGlitchSlice(gamesRef.current!, 0.25);
              });
            }
            // Power on Hero CRT module
            if (heroCrtRef.current) {
              crtPowerOn(heroCrtRef.current);
            }
          });
      }

      // ----------------------------------------------------------------------
      // SPEC 4 & 24: HERO KINETIC TYPOGRAPHY SCRUB & PARALLAX
      // ----------------------------------------------------------------------
      if (chatsRef.current && gamesRef.current && heroRef.current) {
        gsap.to(chatsRef.current, {
          x: -180,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
        gsap.to(gamesRef.current, {
          x: 220,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
      }

      // Giant VYBZ watermark slow parallax
      if (ghostRef.current && heroRef.current) {
        gsap.to(ghostRef.current, {
          y: 120,
          scale: 1.08,
          opacity: 0.24,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 2,
          },
        });
      }

      // ----------------------------------------------------------------------
      // SPEC 5: VELOCITY-BASED TYPOGRAPHY STRETCH
      // ----------------------------------------------------------------------
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = Math.abs(self.getVelocity());
          if (v > 400 && chatsRef.current && gamesRef.current) {
            const stretch = Math.min(1 + (v / 12000) * 0.04, 1.04);
            gsap.to([chatsRef.current, gamesRef.current], {
              scaleX: stretch,
              duration: 0.15,
              ease: "power1.out",
              overwrite: "auto",
            });
          } else if (chatsRef.current && gamesRef.current) {
            gsap.to([chatsRef.current, gamesRef.current], {
              scaleX: 1.0,
              duration: 0.35,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        },
      });

      // ----------------------------------------------------------------------
      // SPEC 9 & 10: CHAT FRAGMENTS CHAOS -> ORDER CONVERGENCE
      // ----------------------------------------------------------------------
      if (inputSectionRef.current) {
        const frags = fragRefs.current.filter(Boolean) as HTMLDivElement[];

        // Start scattered
        frags.forEach((f, i) => {
          const cfg = chatFrags[i] || { ox: 50, oy: -50 };
          gsap.set(f, {
            x: cfg.ox,
            y: cfg.oy,
            rotation: (i % 2 === 0 ? 1 : -1) * (3 + i * 1.5),
            opacity: 0.5,
          });
        });

        const convergeTl = gsap.timeline({
          scrollTrigger: {
            trigger: inputSectionRef.current,
            start: "top 75%",
            end: "center center",
            scrub: 1.2,
          },
        });

        // Converge smoothly to origin (0, 0, 0deg)
        convergeTl.to(frags, {
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          stagger: 0.06,
          ease: "power2.out",
        });

        // Trigger PATTERN FOUND reveal when converged
        ScrollTrigger.create({
          trigger: inputSectionRef.current,
          start: "center 65%",
          once: true,
          onEnter: () => {
            if (patternFoundRef.current) {
              patternFoundRef.current.style.opacity = "1";
              scrambleText(patternFoundRef.current, "PATTERN FOUND", 0.5, () => {
                triggerGlitchSlice(patternFoundRef.current!, 0.25);
              });
            }
          },
        });
      }

      // ----------------------------------------------------------------------
      // SPEC 11 & 12: TERMINAL TEXT TYPING & STAGGER
      // ----------------------------------------------------------------------
      if (inputTermRef.current) {
        const lines = inputTermRef.current.querySelectorAll<HTMLElement>(
          ".term-line"
        );
        gsap.fromTo(
          lines,
          { opacity: 0, x: -10 },
          {
            opacity: 1,
            x: 0,
            duration: 0.3,
            stagger: 0.12,
            ease: "power1.out",
            scrollTrigger: {
              trigger: inputTermRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // ----------------------------------------------------------------------
      // SPEC 13: SCROLL-PINNED AI CORE MACHINE (6-STAGE WORKER)
      // ----------------------------------------------------------------------
      if (aiSectionRef.current) {
        const stages = [
          "SCANNING...",
          "PARSING...",
          "IDENTIFYING...",
          "MAPPING...",
          "GENERATING...",
          "GAME READY.",
        ];

        ScrollTrigger.create({
          trigger: aiSectionRef.current,
          start: "top 10%",
          end: "+=1200",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            const idx = Math.min(
              Math.floor(self.progress * stages.length),
              stages.length - 1
            );
            if (aiStageBadgeRef.current) {
              aiStageBadgeRef.current.innerText = stages[idx];
            }
            if (idx >= 4 && aiGeneratedFlashRef.current) {
              aiGeneratedFlashRef.current.style.opacity = "1";
            }
          },
          onLeave: () => {
            if (aiGeneratedFlashRef.current) {
              triggerGlitchSlice(aiGeneratedFlashRef.current, 0.3);
            }
          },
        });
      }

      // ----------------------------------------------------------------------
      // SPEC 17: RAW CHAT -> GAME TRANSFORMATION (PINNED SHOWCASE)
      // ----------------------------------------------------------------------
      if (
        transformSectionRef.current &&
        rawPanelRef.current &&
        gamePanelRef.current
      ) {
        const transformTl = gsap.timeline({
          scrollTrigger: {
            trigger: transformSectionRef.current,
            start: "top 12%",
            end: "+=1000",
            pin: true,
            scrub: 1,
          },
        });

        // Left raw chat compresses, scales down, darkens
        transformTl.to(
          rawPanelRef.current,
          {
            scale: 0.92,
            opacity: 0.6,
            x: -20,
            ease: "power2.inOut",
          },
          0
        );

        // Center arrow activates
        if (arrowNodeRef.current) {
          transformTl.to(
            arrowNodeRef.current,
            {
              scale: 1.25,
              borderColor: "var(--yellow)",
              color: "var(--yellow)",
              duration: 0.4,
              repeat: 1,
              yoyo: true,
            },
            0.2
          );
        }

        // Right game expands, pops out, glows phosphor green
        transformTl.fromTo(
          gamePanelRef.current,
          { scale: 0.92, opacity: 0.6 },
          {
            scale: 1.04,
            opacity: 1,
            boxShadow: "0 0 24px rgba(57,255,20,0.4), 6px 6px 0 var(--green)",
            ease: "power2.out",
          },
          0.3
        );
      }

      // ----------------------------------------------------------------------
      // SPEC 18: PINNED HORIZONTAL CARTRIDGE SCROLL (ARCADE SHELF)
      // ----------------------------------------------------------------------
      if (shelfSectionRef.current && shelfTrackRef.current) {
        const isMobile = window.innerWidth < 900;
        if (!isMobile) {
          const cards = cartridgeDomRefs.current.filter(
            Boolean
          ) as HTMLDivElement[];

          // Move the shelf track horizontally
          const shelfTl = gsap.timeline({
            scrollTrigger: {
              trigger: shelfSectionRef.current,
              start: "top 10%",
              end: "+=1400",
              pin: true,
              scrub: 1,
              onUpdate: (self) => {
                const centerIdx = Math.min(
                  Math.floor(self.progress * cartridges.length),
                  cartridges.length - 1
                );
                cards.forEach((card, idx) => {
                  if (idx === centerIdx) {
                    card.classList.add("active");
                    gsap.to(card, {
                      scale: 1.03,
                      opacity: 1,
                      duration: 0.25,
                      overwrite: "auto",
                    });
                  } else {
                    card.classList.remove("active");
                    gsap.to(card, {
                      scale: 0.88,
                      opacity: 0.6,
                      duration: 0.25,
                      overwrite: "auto",
                    });
                  }
                });
              },
            },
          });

          shelfTl.to(shelfTrackRef.current, {
            x: -240,
            ease: "none",
          });
        }
      }

      // ----------------------------------------------------------------------
      // SPEC 23: TYPOGRAPHIC WIPE (MANIFESTO)
      // ----------------------------------------------------------------------
      if (editorialHeadingRef.current) {
        gsap.fromTo(
          editorialHeadingRef.current,
          { clipPath: "polygon(0 0, 20% 0, 20% 100%, 0 100%)", opacity: 0.4 },
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: editorialHeadingRef.current,
              start: "top 80%",
              end: "top 35%",
              scrub: 1,
            },
          }
        );
      }

      // ----------------------------------------------------------------------
      // SPEC 27: FINAL CTA SEQUENCE & CRT IGNITION
      // ----------------------------------------------------------------------
      if (finalSectionRef.current) {
        ScrollTrigger.create({
          trigger: finalSectionRef.current,
          start: "top 70%",
          once: true,
          onEnter: () => {
            if (finalCtaTitleRef.current) {
              scrambleText(finalCtaTitleRef.current, "READY PLAYER?", 0.7, () => {
                triggerGlitchSlice(finalCtaTitleRef.current!, 0.3);
              });
            }
            if (finalCrtRef.current) {
              crtPowerOn(finalCrtRef.current);
            }
          },
        });
      }

      // ----------------------------------------------------------------------
      // SPEC 8: SCROLL-TRIGGERED CRT GLITCHES
      // ----------------------------------------------------------------------
      gsap.utils.toArray<HTMLElement>(".crt").forEach((crt) => {
        ScrollTrigger.create({
          trigger: crt,
          start: "top 85%",
          onEnter: () => crtQuickGlitch(crt),
        });
      });

      // ----------------------------------------------------------------------
      // SPEC 14 & 28: LIVE TELEMETRY & FIXED PROGRESS INDICATOR UPDATES
      // ----------------------------------------------------------------------
      const sectionTelemetries = [
        { id: "hero", status: "● ONLINE" },
        { id: "section-input", status: "● RECEIVING" },
        { id: "section-port", status: "● INGESTING" },
        { id: "section-ai", status: "● ANALYZING" },
        { id: "section-shelf", status: "● READY" },
        { id: "section-play", status: "● PLAYING" },
        { id: "section-mem", status: "● LEARNING" },
        { id: "section-final", status: "● READY" },
      ];

      sectionTelemetries.forEach(({ id, status }) => {
        const el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          onEnter: () => {
            setTelemetryStatus(status);
            setActiveSectionId(id);
          },
          onEnterBack: () => {
            setTelemetryStatus(status);
            setActiveSectionId(id);
          },
        });
      });
    });

    return () => ctx.revert();
  }, [cartridges.length]);

  // ──────────────────────────────────────────────────────────────────────────
  // INTERACTIVE CALLBACKS
  // ──────────────────────────────────────────────────────────────────────────
  const insertCoin = useCallback(() => {
    snd.coin();
    setCoins((c) => c + 1);
    if (navCoinBtnRef.current) triggerGlitchSlice(navCoinBtnRef.current, 0.2);
  }, []);

  const pickAnswer = useCallback(
    (key: string, correct: boolean) => {
      if (answerState) return;
      setSelectedAns(key);
      if (correct) {
        snd.success();
        setAnswerState("correct");
        setScore((s) => s + 500);
      } else {
        snd.error();
        setAnswerState("wrong");
      }
    },
    [answerState]
  );

  const nextQuestion = useCallback(() => {
    snd.click();
    setAnswerState(null);
    setSelectedAns(null);
  }, []);

  const simulateUpload = useCallback(() => {
    snd.click();
    setUploadStage(1);
    setTimeout(() => {
      snd.click();
      setUploadStage(2);
    }, 700);
    setTimeout(() => {
      snd.click();
      setUploadStage(3);
    }, 1400);
    setTimeout(() => {
      snd.success();
      setUploadStage(4);
    }, 2200);
  }, []);

  const toggleMute = useCallback(() => {
    snd.muted = !snd.muted;
    setMuted(snd.muted);
    if (!snd.muted) snd.click();
  }, []);

  const scrollTo = useCallback((id: string) => {
    snd.click();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // SPEC 26: MEMORY FLOW ADAPTATION TRIGGER
  // ──────────────────────────────────────────────────────────────────────────
  const triggerMemorySequence = useCallback(() => {
    snd.error();
    if (!memoryFlowRef.current) return;
    triggerGlitchSlice(memoryFlowRef.current, 0.25);
    setTimeout(() => {
      snd.success();
      if (profileBarRef.current) {
        gsap.fromTo(
          profileBarRef.current,
          { opacity: 0.4 },
          { opacity: 1, duration: 0.4, repeat: 2, yoyo: true }
        );
      }
    }, 500);
  }, []);

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "var(--void)",
        color: "var(--txt)",
        fontFamily: "var(--sg)",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Global Vignette */}
      <div className="vignette" />

      {/* ───────────────────────────────────────────────────────────────────
          SPEC 21: CUSTOM SQUARE GSAP HUD CURSOR
      ─────────────────────────────────────────────────────────────────── */}
      <div ref={cursorRef} className="cursor" aria-hidden>
        <div ref={curSquareRef} className="cur-square">
          <span ref={curLabelRef} className="cur-label">
            PLAY
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          SPEC 28: FIXED RETRO SCROLL PROGRESS HUD
      ─────────────────────────────────────────────────────────────────── */}
      <div className="scroll-hud">
        <span className="scroll-hud-title">VYBZ</span>
        {[
          ["hero", "00"],
          ["section-input", "01"],
          ["section-port", "02"],
          ["section-ai", "03"],
          ["section-shelf", "04"],
          ["section-play", "05"],
          ["section-mem", "06"],
          ["section-final", "07"],
        ].map(([id, num]) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={`scroll-hud-btn ${
              activeSectionId === id ? "active" : ""
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER NAV
      ═══════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          background: "rgba(10,11,13,0.94)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          {/* Top micro telemetry strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--jb)",
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.1em",
            }}
          >
            <span>┌ COORD: 00.00N — CHASSIS: TERMINAL_01</span>
            <span style={{ display: "flex", gap: 20 }}>
              <span>FREQ: 60Hz</span>
              <span>BUILD: 01.04</span>
              <span style={{ color: "var(--green)" }}>
                PHOSPHOR: ACTIVE └
              </span>
            </span>
          </div>

          {/* Main nav row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              padding: "7px 0",
            }}
          >
            {/* Brand */}
            <button
              onClick={() => scrollTo("hero")}
              data-cursor="HOME"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
                marginRight: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--sg)",
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.04em",
                  color: "var(--green)",
                }}
              >
                VYBZ
              </span>
              <span
                className="jb"
                style={{
                  fontSize: 9,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                SYSTEM 01.04
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="led led-g hero-online-led pulse-g" />
                <span
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--green)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {telemetryStatus}
                </span>
              </span>
            </button>

            {/* Section jump codes */}
            <nav
              style={{
                display: "flex",
                gap: 2,
                flex: 1,
                overflow: "hidden",
              }}
            >
              {[
                ["section-input", "01/INPUT"],
                ["section-port", "02/PORT"],
                ["section-ai", "03/CORE"],
                ["section-shelf", "04/ROMS"],
                ["section-play", "05/PLAY"],
                ["section-mem", "06/MEM"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  data-cursor="JUMP"
                  className="jb"
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    color:
                      activeSectionId === id
                        ? "var(--green)"
                        : "var(--muted)",
                    borderColor:
                      activeSectionId === id
                        ? "var(--green)"
                        : "var(--border)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    padding: "4px 8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "border-color .12s,color .12s",
                  }}
                >
                  [{label}]
                </button>
              ))}
            </nav>

            {/* Right controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              <LiveClock />
              <button
                onClick={toggleMute}
                data-cursor="AUDIO"
                className="jb"
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: muted ? "var(--red)" : "var(--green)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                AUDIO:[{muted ? "OFF" : "ON"}]
              </button>
              <button
                ref={navCoinBtnRef}
                onClick={insertCoin}
                data-cursor="COIN"
                className="jb"
                style={{
                  background: "var(--yellow)",
                  color: "#000",
                  border: "1px solid var(--yellow)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                COINS:[{String(coins).padStart(2, "0")}]
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          01 // HERO — CINEMATIC SYSTEM BOOT
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        ref={heroRef}
        style={{
          minHeight: "100vh",
          paddingTop: 70,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* SPEC 1: System Boot Veil Overlay */}
        <div
          ref={bootOverlayRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--void)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <div
            className="jb"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.18em",
              marginBottom: 12,
            }}
          >
            VYBZ // SYSTEM 01.04
          </div>
          <div
            ref={bootTextRef}
            className="jb"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--green)",
              letterSpacing: "0.12em",
              minHeight: 28,
            }}
          >
            {/* Types character-by-character */}
          </div>
          <div style={{ marginTop: 12 }}>
            <span
              ref={bootStatusRef}
              className="chip chip-g"
              style={{ fontSize: 10 }}
            >
              INITIALIZING
            </span>
          </div>
        </div>

        {/* Ghost outline VYBZ watermark */}
        <div
          ref={ghostRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -52%)",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            lineHeight: 1,
            willChange: "transform, opacity",
          }}
        >
          <div className="hero-title-outline" aria-hidden>
            VYBZ
          </div>
        </div>

        <div
          style={{
            maxWidth: 1540,
            margin: "0 auto",
            padding: "0 24px",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 70px)",
            justifyContent: "space-between",
          }}
        >
          {/* TOP BOOT BANNER */}
          <div
            style={{
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="chip chip-g">SYSTEM 01</span>
              <span
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                INITIALIZING HARDWARE CORE...
              </span>
              <span
                style={{ display: "flex", gap: 4, alignItems: "center" }}
              >
                <span className="led led-g hero-online-led pulse-g" />
                <span
                  className="jb"
                  style={{
                    fontSize: 10,
                    color: "var(--green)",
                    letterSpacing: "0.1em",
                  }}
                >
                  PLAYER: DETECTED
                </span>
              </span>
            </div>
            <div
              className="jb"
              style={{
                display: "flex",
                gap: 16,
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.1em",
              }}
            >
              <span>MEMORY: 64KB ROM</span>
              <span style={{ color: "var(--yellow)" }}>ENGINE: READY</span>
              <span>INPUT DETECTED // 17,492 MESSAGES</span>
              <span style={{ color: "var(--green)" }}>
                [ MEMORY POTENTIAL: HIGH ]
              </span>
            </div>
          </div>

          {/* HERO BODY — ASYMMETRIC GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 24,
              padding: "20px 0",
              flex: 1,
              alignItems: "center",
            }}
          >
            {/* LEFT: Giant Typography */}
            <div>
              {/* Telemetry row above type */}
              <div
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: "0.12em",
                  display: "flex",
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "var(--green)" }}>
                  ┌ INPUT DETECTED // 17,492 MESSAGES
                </span>
                <span style={{ color: "var(--yellow)" }}>
                  [ MEMORY POTENTIAL: HIGH ]
                </span>
                <span>PLAYER: 01 ┘</span>
              </div>

              {/* SPEC 2 & 3: YOUR CHATS. with Glitch-Slice */}
              <h1
                ref={chatsRef}
                className="hero-title glitch-slice"
                data-text="YOUR CHATS."
                style={{
                  color: "var(--txt)",
                  willChange: "transform",
                  transformOrigin: "left center",
                }}
              >
                YOUR CHATS.
              </h1>

              {/* SPEC 2 & 3: BECOME GAMES. with Glitch-Slice */}
              <h2
                ref={gamesRef}
                className="hero-title glitch-slice"
                data-text="BECOME GAMES."
                style={{
                  color: "var(--green)",
                  paddingLeft: "8vw",
                  willChange: "transform",
                  transformOrigin: "left center",
                }}
              >
                BECOME GAMES.
              </h2>

              {/* Description & CTA Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 24,
                  marginTop: 28,
                  alignItems: "end",
                }}
              >
                <div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 11,
                      color: "var(--txt2)",
                      lineHeight: 1.7,
                      borderLeft: "2px solid var(--green)",
                      paddingLeft: 12,
                    }}
                  >
                    VYBZ TAKES THE CHAOS, INSIDE JOKES,
                    <br />
                    AND RELATIONSHIPS IN YOUR GROUP CHAT
                    <br />
                    AND TURNS THEM INTO PERSONALIZED
                    <br />
                    ARCADE MINI-GAMES.
                    <br />
                    <br />
                    THE AI LEARNS FROM EVERY ANSWER
                    <br />
                    AND ADAPTS FUTURE CARTRIDGES.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 20,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* SPEC 20: Magnetic Insert Coin Button */}
                    <button
                      ref={heroCoinBtnRef}
                      className="btn-green glitch-slice"
                      data-text="INSERT COIN →"
                      data-cursor="COIN"
                      onClick={() => {
                        insertCoin();
                        scrollTo("section-port");
                      }}
                    >
                      INSERT COIN →{" "}
                      <span
                        style={{
                          background: "#000",
                          color: "var(--green)",
                          fontSize: 9,
                          padding: "2px 6px",
                        }}
                      >
                        {coins} READY
                      </span>
                    </button>
                    <button
                      className="btn-outline"
                      data-cursor="VIEW"
                      onClick={() => scrollTo("section-input")}
                    >
                      VIEW THE MACHINE →
                    </button>
                  </div>
                </div>

                {/* Score module with AnimCounter */}
                <div
                  className="panel"
                  style={{
                    padding: "14px 18px",
                    minWidth: 180,
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: "0.14em",
                      marginBottom: 6,
                    }}
                  >
                    HIGH SCORE
                  </div>
                  <div className="score-num">
                    <AnimCounter target={8420} padZeros={5} />
                  </div>
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--border)",
                      margin: "8px 0",
                    }}
                  />
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    INSERT COIN // {coins} READY
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Barcode
                      val="VYBZ-8849"
                      h={14}
                      color="var(--muted)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: SPEC 7: CRT Module with Power-On Beam */}
            <div>
              <div
                style={{
                  background: "var(--chassis)",
                  border: "1px solid var(--border)",
                  boxShadow: "6px 6px 0 #000",
                }}
              >
                {/* Chassis header */}
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span style={{ fontFamily: "monospace" }}>⊕</span>
                    CRT-MOD // 8849
                  </span>
                  <span
                    style={{
                      color: "var(--green)",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <span className="led led-g pulse-g" />
                    CHASSIS_01
                  </span>
                  <span style={{ fontFamily: "monospace" }}>⊕</span>
                </div>

                {/* CRT Screen */}
                <div
                  ref={heroCrtRef}
                  className="crt"
                  style={{
                    margin: 8,
                    padding: "20px 14px",
                    minHeight: 240,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="crt-beam" />
                  <div className="crt-content">
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "var(--muted)",
                        borderBottom: "1px solid rgba(57,255,20,0.15)",
                        paddingBottom: 6,
                      }}
                    >
                      <span>FREQ: 15.75 kHz</span>
                      <span style={{ color: "var(--green)" }}>
                        ● SYNC LOCK
                      </span>
                    </div>

                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <div
                        className="jb"
                        style={{
                          fontSize: 10,
                          color: "var(--yellow)",
                          letterSpacing: "0.1em",
                          marginBottom: 10,
                        }}
                      >
                        ★ READY PLAYER 01 ★
                      </div>
                      <div
                        className="sg"
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          color: "var(--txt)",
                        }}
                      >
                        INSERT COIN
                      </div>
                      <div
                        style={{
                          width: 48,
                          height: 2,
                          background: "var(--green)",
                          boxShadow: "0 0 8px var(--green)",
                          margin: "10px auto",
                        }}
                      />
                      <div
                        className="jb"
                        style={{
                          fontSize: 10,
                          color: "var(--green)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        GAME ENGINE: ONLINE
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid rgba(57,255,20,0.15)",
                        paddingTop: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Barcode
                        val="COIN-OP-01"
                        h={14}
                        color="var(--green)"
                      />
                      <span
                        className="jb"
                        style={{ fontSize: 8, color: "var(--muted)" }}
                      >
                        ROM REV 1.4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chassis footer */}
                <div
                  className="jb"
                  style={{
                    fontSize: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 10px",
                    borderTop: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <span>⊕ SCREW_L</span>
                  <span style={{ color: "var(--green)" }}>
                    STATUS: STANDBY
                  </span>
                  <span>⊕ SCREW_R</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM TELEMETRY BAR */}
          <div
            className="jb"
            style={{
              padding: "10px 0",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--muted)",
              letterSpacing: "0.08em",
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--green)" }}>► 01/BOOT</span>
              <span>CORE PIPELINE: ACTIVE</span>
              <span className="hidden md:inline">
                SYSTEM: 1980s COIN-OP ARCHITECTURE
              </span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--yellow)" }}>
                CREDITS: {coins}
              </span>
              <span style={{ color: "var(--txt)" }}>
                SCROLL TO ENGAGE ▼
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          02 // INPUT — CHAOS → ORDER CHAT FRAGMENTS
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-input"
        ref={inputSectionRef}
        style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="01 // INPUT"
            label="INGESTION PROTOCOL: ACTIVE"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
            }}
          >
            {/* Left: Headlines & Raw Terminal */}
            <div>
              <h2
                className="section-title glitch-slice"
                data-text="YOUR GROUP CHAT IS WEIRD."
                style={{ color: "var(--txt)" }}
              >
                YOUR GROUP
                <br />
                CHAT IS
                <br />
                <span style={{ color: "var(--green)" }}>WEIRD.</span>
              </h2>
              <div
                className="sg"
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  color: "var(--yellow)",
                  lineHeight: 1,
                }}
              >
                GOOD.
              </div>

              <div style={{ marginTop: 24 }}>
                {/* SPEC 11: Staggered Terminal Typewriter */}
                <div
                  ref={inputTermRef}
                  style={{
                    background: "var(--chassis)",
                    border: "1px solid var(--border)",
                    padding: "14px 16px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                      marginBottom: 10,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>RAW CHAT INPUT // 00231</span>
                    <span style={{ color: "var(--green)" }}>
                      SCANNING...
                    </span>
                  </div>
                  {[
                    ["> SCANNING GROUP DATA...", "var(--muted)"],
                    ["> 17,492 MESSAGES FOUND", "var(--green)"],
                    ["> 283 RECURRING PATTERNS", "var(--txt2)"],
                    ["> 47 MEMORY CLUSTERS INDEXED", "var(--txt2)"],
                    ["> FRIENDSHIP DENSITY: HIGH", "var(--yellow)"],
                    ["> CHAOS INDEX: 92%", "var(--orange)"],
                    ["> GAME MATERIAL DETECTED ■", "var(--green)"],
                  ].map(([line, color], i) => (
                    <div
                      key={i}
                      className="jb term-line"
                      style={{
                        fontSize: 10,
                        color,
                        lineHeight: 1.8,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>

                {/* SPEC 15: Mini stat pills with animated counters */}
                <div
                  style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                >
                  {[
                    { val: 17492, label: "MESSAGES" },
                    { val: 283, label: "PATTERNS" },
                    { val: 47, label: "CLUSTERS" },
                    { val: 92, label: "CHAOS", suffix: "%" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: "var(--cart)",
                        border: "1px solid var(--border)",
                        padding: "6px 12px",
                      }}
                    >
                      <div
                        className="jb"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--green)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <AnimCounter target={item.val} />
                        {item.suffix ?? ""}
                      </div>
                      <div
                        className="jb"
                        style={{
                          fontSize: 9,
                          color: "var(--muted)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: SPEC 9 & 10: Chat Fragment Chaos → Order Convergence Grid */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {chatFrags.map((f, i) => (
                  <div
                    key={i}
                    ref={(el) => {
                      fragRefs.current[i] = el;
                    }}
                    className="panel"
                    style={{
                      padding: "8px 10px",
                      borderLeft: `2px solid ${
                        i % 3 === 0
                          ? "var(--green)"
                          : i % 3 === 1
                          ? "var(--yellow)"
                          : "var(--orange)"
                      }`,
                      willChange: "transform, opacity",
                    }}
                  >
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span>
                        {f.time} AM // {f.user}
                      </span>
                      <span>MSG #{String(i + 100).padStart(5, "0")}</span>
                    </div>
                    <div
                      className="jb"
                      style={{
                        fontSize: 11,
                        color: "var(--txt)",
                        lineHeight: 1.4,
                      }}
                    >
                      &gt; {f.msg}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pattern Found Scramble Tag */}
              <div
                ref={patternFoundRef}
                className="chip chip-g"
                style={{
                  marginTop: 12,
                  opacity: 0,
                  transition: "opacity .3s ease",
                  display: "inline-flex",
                }}
              >
                PATTERN FOUND
              </div>

              {/* Thermal receipt overlay */}
              <div
                className="receipt"
                style={{
                  padding: "12px 14px",
                  marginTop: 10,
                  boxShadow: "3px 3px 0 #000",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px dashed #ccc",
                    paddingBottom: 4,
                    marginBottom: 6,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  <span>*** VYBZ RECEIPT ***</span>
                  <span>TRANS: #99482</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2px 12px",
                    fontSize: 9,
                  }}
                >
                  {[
                    ["SOURCE:", "SUNDAY BOYZZ GROUP"],
                    ["MSGS:", "17,492"],
                    ["PATTERNS:", "283"],
                    ["STATUS:", "IMPORTED"],
                  ].map(([k, v]) => (
                    <React.Fragment key={k}>
                      <span>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div
                  style={{
                    textAlign: "center",
                    borderTop: "1px dashed #ccc",
                    marginTop: 6,
                    paddingTop: 4,
                    fontSize: 8,
                    fontStyle: "italic",
                  }}
                >
                  &quot;WHO INVITED HIM&quot; — most detected phrase
                </div>
                <Barcode val="RAW-CHAT-INGEST" h={16} color="#0A0B0D" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          03 // DATA PORT — INGESTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-port"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--chassis)",
          padding: "52px 0",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="02 // DATA PORT"
            label="INGESTION TERMINAL"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* Left: Huge title */}
            <div>
              <h2
                className="section-title glitch-slice"
                data-text="INSERT YOUR DATA."
                style={{ color: "var(--txt)" }}
              >
                INSERT
                <br />
                YOUR
                <br />
                <span style={{ color: "var(--green)" }}>DATA.</span>
              </h2>
              <div
                className="jb"
                style={{
                  fontSize: 11,
                  color: "var(--txt2)",
                  lineHeight: 1.7,
                  borderLeft: "2px solid var(--green)",
                  paddingLeft: 12,
                  marginTop: 16,
                  maxWidth: 300,
                }}
              >
                CLIENT-SIDE PROCESSING.
                <br />
                YOUR CHATS NEVER LEAVE
                <br />
                YOUR DEVICE. ZERO TRAINING
                <br />
                ON EXTERNAL SERVERS.
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {[
                  ".TXT — WHATSAPP / TELEGRAM",
                  ".JSON — DISCORD EXPORTER",
                  ".CSV — CUSTOM LOGS",
                ].map((f) => (
                  <div
                    key={f}
                    className="jb"
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--green)" }}>►</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Terminal Drop Zone */}
            <div>
              <div
                style={{
                  background: "var(--void)",
                  border: "1px solid var(--border)",
                  padding: "16px",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                    marginBottom: 12,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span className="led led-g" /> DATA PORT // PLAYER 01
                  </span>
                  <span>DEVICE: /DEV/TTY_CHATS</span>
                </div>

                {/* Drop area */}
                <div
                  onClick={simulateUpload}
                  data-cursor="DROP"
                  style={{
                    border: `2px dashed ${
                      uploadStage === 4
                        ? "var(--green)"
                        : "var(--border)"
                    }`,
                    background:
                      uploadStage === 4
                        ? "rgba(57,255,20,0.04)"
                        : "var(--cart)",
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color .2s,background .2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    className="sg"
                    style={{ fontSize: 32, color: "var(--green)" }}
                  >
                    ⌗
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--txt)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    &gt; DROP CHAT FILE HERE
                  </div>
                  <div
                    className="jb"
                    style={{ fontSize: 10, color: "var(--muted)" }}
                  >
                    SUPPORTED: .TXT // .JSON // .CSV
                  </div>
                  <button
                    className="btn-green"
                    data-cursor="SELECT"
                    style={{ marginTop: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      simulateUpload();
                    }}
                  >
                    SELECT FILE →
                  </button>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    DATA PRIVACY // USER CONTROLLED
                  </div>
                </div>

                {/* Progress Terminal */}
                <div
                  style={{
                    marginTop: 12,
                    background: "#010304",
                    border: "1px solid var(--border)",
                    padding: "12px 14px",
                  }}
                >
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                      marginBottom: 10,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      ACTIVE STREAM:{" "}
                      {uploadStage > 0 ? "group_chat.txt" : "NO_STREAM"}
                    </span>
                    <span style={{ color: "var(--green)" }}>
                      {
                        [
                          "IDLE",
                          "INGESTING...",
                          "PARSING...",
                          "INDEXING...",
                          "READY //",
                        ][uploadStage]
                      }
                    </span>
                  </div>
                  {[
                    [
                      "IMPORTING...",
                      uploadStage >= 1
                        ? "██████████████░░░░  70%"
                        : "░░░░░░░░░░░░░░░░░░░░   0%",
                    ],
                    [
                      "PARSING...  ",
                      uploadStage >= 2
                        ? "████████████████░░  88%"
                        : "░░░░░░░░░░░░░░░░░░░░   0%",
                    ],
                    [
                      "INDEXING... ",
                      uploadStage >= 3
                        ? "██████████████████ 100%"
                        : "░░░░░░░░░░░░░░░░░░░░   0%",
                    ],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="jb"
                      style={{
                        fontSize: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        color:
                          uploadStage >= 3
                            ? "var(--green)"
                            : "var(--txt2)",
                      }}
                    >
                      <span style={{ color: "var(--txt2)" }}>{l}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className={`led ${
                          uploadStage === 4
                            ? "led-g"
                            : uploadStage > 0
                            ? "led-y"
                            : "led-r"
                        }`}
                        style={{
                          animation:
                            uploadStage > 0 && uploadStage < 4
                              ? "pulse-g 1s infinite"
                              : "none",
                        }}
                      />
                      <span
                        className="jb"
                        style={{ fontSize: 9, color: "var(--txt2)" }}
                      >
                        {uploadStage === 4
                          ? "SYSTEM READY FOR ANALYSIS"
                          : "STANDBY"}
                      </span>
                    </div>
                    <Barcode
                      val="STREAM-00231"
                      h={12}
                      color="var(--muted)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          04 // SPEC 13: SCROLL-PINNED AI CORE MACHINE
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-ai"
        ref={aiSectionRef}
        style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="03 // AI CORE"
            label="HEURISTIC ENGINE ACTIVE"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
            }}
          >
            <div>
              <h2
                className="section-title glitch-slice"
                data-text="THE AI IS NOSY."
                style={{ color: "var(--txt)" }}
              >
                THE AI
                <br />
                <span style={{ color: "var(--green)" }}>IS NOSY.</span>
              </h2>
              <div
                className="sg"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--txt2)",
                  letterSpacing: "-0.02em",
                  marginTop: 4,
                }}
              >
                NOT CREEPY NOSY.
                <br />
                GAME NOSY.
              </div>

              {/* Telemetry counters */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                {[
                  { l: "MESSAGES PARSED", v: 17492, c: "var(--txt)" },
                  { l: "PATTERNS FOUND", v: 283, c: "var(--green)" },
                  { l: "MEMORY CLUSTERS", v: 47, c: "var(--yellow)" },
                  {
                    l: "GAME POTENTIAL",
                    v: 98,
                    c: "var(--cyan)",
                    suffix: "%",
                  },
                ].map((item) => (
                  <div
                    key={item.l}
                    className="panel"
                    style={{ padding: "12px 14px" }}
                  >
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        marginBottom: 4,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {item.l}
                    </div>
                    <div
                      className="sg"
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: item.c,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                      }}
                    >
                      <AnimCounter target={item.v} />
                      {item.suffix ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis Panel with Active Stages */}
            <div className="panel" style={{ padding: "16px" }}>
              <div
                className="jb"
                style={{
                  fontSize: 9,
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                  marginBottom: 14,
                  color: "var(--muted)",
                }}
              >
                <span
                  style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                  <span className="led led-g pulse-g" />
                  AI CORE // ANALYSIS 001
                </span>
                <span
                  ref={aiStageBadgeRef}
                  style={{
                    color: "var(--green)",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  SCANNING...
                </span>
              </div>

              {/* Stat bars */}
              {[
                { l: "PERSONALITY SIGNAL", p: 98, c: "var(--green)" },
                { l: "INSIDE JOKE DENSITY", p: 91, c: "var(--green)" },
                { l: "MEMORY RECALL", p: 82, c: "var(--yellow)" },
                { l: "CHAOS POTENTIAL", p: 100, c: "var(--orange)" },
              ].map((s) => (
                <div key={s.l} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      className="jb"
                      style={{
                        fontSize: 10,
                        color: "var(--txt2)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s.l}
                    </span>
                    <span
                      className="jb"
                      style={{ fontSize: 10, color: s.c, fontWeight: 700 }}
                    >
                      {s.p}%
                    </span>
                  </div>
                  <ProgBar pct={s.p} color={s.c} />
                </div>
              ))}

              <div
                style={{
                  marginTop: 16,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  ["MODEL", "VYBZ CORE v3.1"],
                  ["LATENCY", "12ms BATCH"],
                  ["ACCURACY", "97.4% VERIFIED"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      className="jb"
                      style={{
                        fontSize: 10,
                        color: "var(--txt)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              {/* Terminal log */}
              <div
                ref={aiTerminalRef}
                style={{
                  marginTop: 14,
                  background: "#010304",
                  border: "1px solid var(--border)",
                  padding: "10px 12px",
                }}
              >
                {[
                  ["> INITIALIZING ANALYSIS", "var(--muted)"],
                  ["> PARSING MESSAGE CLUSTERS", "var(--green)"],
                  ["> DETECTING RELATIONSHIPS", "var(--txt2)"],
                  ["> IDENTIFYING PHRASES", "var(--txt2)"],
                  ["> MAPPING PERSONALITIES", "var(--yellow)"],
                  ["> GAME ENGINE: READY ■", "var(--green)"],
                ].map(([l, c]) => (
                  <div
                    key={l}
                    className="jb"
                    style={{ fontSize: 9, color: c, lineHeight: 1.9 }}
                  >
                    {l}
                  </div>
                ))}
              </div>

              {/* End Flash Tag */}
              <div
                ref={aiGeneratedFlashRef}
                className="chip chip-g"
                style={{
                  marginTop: 12,
                  opacity: 0,
                  transition: "opacity .3s ease",
                }}
              >
                GAME GENERATED ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          05 // SPEC 17: PINNED RAW CHAT → GAME TRANSFORMATION
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={transformSectionRef}
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--chassis)",
          padding: "52px 0",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="04 // GENERATE"
            label="HEURISTIC SYNTHESIS PIPELINE"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 56px 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Left: Raw Chat */}
            <div
              ref={rawPanelRef}
              style={{ willChange: "transform, opacity" }}
            >
              <div
                className="sg"
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.03em",
                  color: "var(--yellow)",
                  marginBottom: 12,
                }}
              >
                RAW TEXT.
                <br />
                CHAOS
                <br />
                GOES IN.
              </div>
              <div
                style={{
                  background: "var(--void)",
                  border: "1px solid var(--border)",
                  padding: "14px",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 6,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>RAW STREAM // 00231</span>
                  <span style={{ color: "var(--orange)" }}>
                    ENTROPY: HIGH
                  </span>
                </div>
                {[
                  [
                    "ALEX",
                    "11:42",
                    "I literally told you guys not to touch the aux cord 5 minutes ago",
                    "var(--orange)",
                  ],
                  [
                    "LIAM",
                    "11:43",
                    "Nobody wants to listen to 14-minute experimental synth tracks bro",
                    "var(--muted)",
                  ],
                  [
                    "MAYA",
                    "11:44",
                    "He does this every single road trip without fail 😭",
                    "var(--cyan)",
                  ],
                  [
                    "SAM",
                    "11:52",
                    "okay but hear me out",
                    "var(--muted)",
                  ],
                ].map(([u, t, m, c]) => (
                  <div
                    key={t}
                    style={{
                      borderLeft: `2px solid ${c}`,
                      paddingLeft: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        display: "flex",
                        gap: 10,
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ color: c as string }}>{u}</span>
                      <span>{t} PM</span>
                    </div>
                    <div
                      className="jb"
                      style={{ fontSize: 10, color: "var(--txt2)" }}
                    >
                      {m}
                    </div>
                  </div>
                ))}
                <div
                  className="jb"
                  style={{ fontSize: 9, color: "var(--green)", marginTop: 8 }}
                >
                  GAME MATERIAL DETECTED ■
                </div>
              </div>
            </div>

            {/* Arrow Synth Node */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 60,
              }}
            >
              <div
                ref={arrowNodeRef}
                style={{
                  background: "var(--cart)",
                  border: "1px solid var(--green)",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "3px 3px 0 #000",
                }}
              >
                <span
                  className="sg"
                  style={{
                    fontSize: 20,
                    color: "var(--green)",
                    fontWeight: 700,
                  }}
                >
                  →
                </span>
              </div>
              <div
                className="jb"
                style={{
                  fontSize: 8,
                  color: "var(--muted)",
                  textAlign: "center",
                  marginTop: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                SYNTH
              </div>
            </div>

            {/* Right: Generated Game */}
            <div
              ref={gamePanelRef}
              style={{ willChange: "transform, opacity, box-shadow" }}
            >
              <div
                className="sg"
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.03em",
                  color: "var(--green)",
                  marginBottom: 12,
                }}
              >
                CHAOS
                <br />
                GOES OUT.
                <br />
                GAME IN.
              </div>
              <div
                style={{
                  background: "var(--void)",
                  border: "1px solid var(--green)",
                  padding: "14px",
                  boxShadow: "4px 4px 0 var(--green)",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(57,255,20,0.2)",
                    paddingBottom: 6,
                    marginBottom: 12,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span className="chip chip-g">GAME 01</span> WHO SAID IT?
                  </span>
                  <span style={{ color: "var(--green)" }}>COMPILED ✓</span>
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 10,
                    color: "var(--yellow)",
                    marginBottom: 6,
                  }}
                >
                  QUESTION // PROMPT #042
                </div>
                <div
                  className="sg"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                    color: "var(--txt)",
                    marginBottom: 8,
                  }}
                >
                  &quot;WHO WOULD MOST LIKELY SAY THIS?&quot;
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 10,
                    color: "var(--green)",
                    fontStyle: "italic",
                    marginBottom: 12,
                    borderLeft: "2px solid var(--green)",
                    paddingLeft: 8,
                  }}
                >
                  &quot;...not to touch the aux cord&quot;
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                  }}
                >
                  {answers.map((a) => (
                    <div
                      key={a.key}
                      style={{
                        background: a.correct
                          ? "rgba(57,255,20,0.1)"
                          : "var(--cart)",
                        border: `1px solid ${
                          a.correct ? "var(--green)" : "var(--border)"
                        }`,
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        className="jb"
                        style={{ fontSize: 8, color: "var(--muted)" }}
                      >
                        KEY // [{a.key}]
                      </div>
                      <div
                        className="sg"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: a.correct ? "var(--green)" : "var(--txt)",
                        }}
                      >
                        {a.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          06 // SPEC 18 & 19: ARCADE SHELF — PINNED HORIZONTAL CARTRIDGES
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-shelf"
        ref={shelfSectionRef}
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "52px 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="05 // ARCADE SHELF"
            label="5 ROM MODULES READY"
          />

          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <div>
              <h2
                className="section-title glitch-slice"
                data-text="THE ARCADE SHELF."
                style={{ color: "var(--txt)" }}
              >
                THE
                <br />
                <span style={{ color: "var(--green)" }}>ARCADE SHELF.</span>
              </h2>
              <div
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  marginTop: 6,
                }}
              >
                YOUR GROUP CHAT JUST BECAME A CARTRIDGE.
              </div>
            </div>
            <div
              className="jb"
              style={{ fontSize: 9, color: "var(--muted)", textAlign: "right" }}
            >
              <span>SLOT: 16-BIT BUS</span>
              <br />
              <span style={{ color: "var(--green)" }}>
                ● ACTIVE ROM LOADED
              </span>
            </div>
          </div>

          {/* Cartridge track */}
          <div
            ref={shelfTrackRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
              gap: 12,
              willChange: "transform",
            }}
          >
            {cartridges.map((c, i) => (
              <div
                key={c.id}
                ref={(el) => {
                  cartridgeDomRefs.current[i] = el;
                }}
                data-cursor="LOAD"
                className={`cartridge ${activeCart === c.id ? "active" : ""}`}
                style={{
                  minHeight: 320,
                  padding: "12px 12px 10px",
                  borderColor:
                    activeCart === c.id ? c.accent : "var(--border)",
                }}
                onClick={() => {
                  snd.coin();
                  setActiveCart(c.id);
                }}
              >
                {/* Top label */}
                <div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                      marginBottom: 8,
                      color: "var(--muted)",
                    }}
                  >
                    <span
                      style={{
                        color: c.accent as string,
                        fontWeight: 700,
                      }}
                    >
                      {c.rom}
                    </span>
                    <span>{c.diff}</span>
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: "0.12em",
                      marginBottom: 4,
                    }}
                  >
                    {c.sub}
                  </div>
                  <div
                    className="sg"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "-0.03em",
                      color: "var(--txt)",
                      lineHeight: 1.1,
                    }}
                  >
                    {c.title}
                  </div>
                </div>

                {/* Middle space — accent stripe */}
                <div
                  style={{
                    height: 3,
                    background: c.accent as string,
                    margin: "12px -12px",
                    boxShadow: `0 0 8px ${c.accent}`,
                  }}
                />

                {/* Bottom meta */}
                <div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span>HIGH SCORE</span>
                    <span
                      style={{
                        color: "var(--yellow)",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.score}
                    </span>
                  </div>
                  <Barcode val={c.rom} h={16} color="var(--muted)" />
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      marginTop: 6,
                      color:
                        activeCart === c.id
                          ? "var(--green)"
                          : "var(--muted)",
                      textAlign: "center",
                      border: `1px solid ${
                        activeCart === c.id
                          ? "var(--green)"
                          : "var(--border)"
                      }`,
                      padding: "3px",
                    }}
                  >
                    {activeCart === c.id ? "● LOADED" : "LOAD →"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          07 // SPEC 25: PLAY & SCORE INTERACTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-play"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--chassis)",
          padding: "52px 0",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="06 // LIVE GAME BENCH"
            label={`ACTIVE: ${cartridges[activeCart].title}`}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* Left: Score & Round Meta */}
            <div style={{ minWidth: 200 }}>
              <div
                className="sg glitch-slice"
                data-text="PLAY."
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.05em",
                  color: "var(--txt)",
                  lineHeight: 1,
                }}
              >
                PLAY.
              </div>

              <div style={{ marginTop: 20 }}>
                {[
                  ["ROUND", "04 / 10"],
                  ["SCORE", String(score.toLocaleString()).padStart(6, "0")],
                  ["TIME", "00:12"],
                  ["HIGH SCORE", "09,820"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                    }}
                  >
                    <span
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {k}
                    </span>
                    <span
                      className="jb"
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color:
                          k === "SCORE" ? "var(--yellow)" : "var(--txt)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <Barcode
                  val="CONSOLE-EXEC"
                  h={16}
                  color="var(--muted)"
                />
              </div>
            </div>

            {/* Right: Game Cabinet Panel */}
            <div
              style={{
                background: "var(--void)",
                border: "1px solid var(--border)",
                padding: "20px",
              }}
            >
              <div
                className="jb"
                style={{
                  fontSize: 9,
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                  marginBottom: 14,
                  color: "var(--muted)",
                }}
              >
                <span
                  style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                  <span className="led led-g pulse-g" />
                  CABINET CONSOLE // BENCH_04
                </span>
                <span>DIFFICULTY: NORMAL // 60FPS</span>
              </div>

              <div
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--yellow)",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                {cartridges[activeCart].rom} — ROUND 04 / 10
              </div>
              <div
                className="sg"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  color: "var(--txt)",
                  marginBottom: 14,
                }}
              >
                WHO WOULD MOST LIKELY SAY THIS?
              </div>

              <div
                style={{
                  background: "#010304",
                  border: "1px solid var(--border)",
                  borderLeft: "4px solid var(--green)",
                  padding: "14px 16px",
                  marginBottom: 16,
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 12,
                    color: "var(--txt)",
                    lineHeight: 1.5,
                  }}
                >
                  &quot;I literally told you guys not to touch the aux cord five
                  minutes ago&quot;
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {answers.map((a) => {
                  const isChosen = selectedAns === a.key;
                  const isCorrectReveal = answerState !== null && a.correct;
                  return (
                    <button
                      key={a.key}
                      data-cursor="ANSWER"
                      onClick={() => pickAnswer(a.key, a.correct)}
                      className={`ans-btn${
                        isChosen && answerState === "correct"
                          ? " correct"
                          : isChosen && answerState === "wrong"
                          ? " wrong"
                          : isCorrectReveal
                          ? " correct"
                          : ""
                      }`}
                      style={{ cursor: answerState ? "default" : "pointer" }}
                    >
                      <div
                        className="jb"
                        style={{
                          fontSize: 9,
                          color: "inherit",
                          opacity: 0.7,
                          marginBottom: 2,
                        }}
                      >
                        KEY // [{a.key}] — {a.tag}
                      </div>
                      <div
                        className="sg"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {a.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {answerState && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    border: `1px solid ${
                      answerState === "correct"
                        ? "var(--green)"
                        : "var(--red)"
                    }`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: `rgba(${
                      answerState === "correct"
                        ? "57,255,20"
                        : "255,51,75"
                    },0.05)`,
                  }}
                >
                  <div
                    className="jb"
                    style={{
                      fontSize: 11,
                      color:
                        answerState === "correct"
                          ? "var(--green)"
                          : "var(--red)",
                      fontWeight: 700,
                    }}
                  >
                    {answerState === "correct"
                      ? "✔ CORRECT // +500 PTS"
                      : "✖ INCORRECT"}
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--muted)",
                        fontWeight: 400,
                        marginTop: 2,
                      }}
                    >
                      PLAYER PROFILE UPDATED // ADAPTIVE WEIGHTS RECALIBRATED
                    </div>
                  </div>
                  <button
                    className="btn-green"
                    data-cursor="NEXT"
                    onClick={nextQuestion}
                    style={{ fontSize: 9 }}
                  >
                    NEXT →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          08 // SPEC 26: MEMORY FLOW ADAPTATION
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-mem"
        style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          <SectionMark
            n="07 // ADAPTIVE MEMORY"
            label="NEURAL WEIGHT ADAPTATION"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
            }}
          >
            <div>
              <h2
                className="section-title glitch-slice"
                data-text="IT LEARNS YOUR VIBE."
                style={{ color: "var(--txt)" }}
              >
                IT
                <br />
                LEARNS
                <br />
                YOUR
                <br />
                <span style={{ color: "var(--green)" }}>VIBE.</span>
              </h2>
              <div
                className="jb"
                style={{
                  fontSize: 11,
                  color: "var(--txt2)",
                  lineHeight: 1.7,
                  borderLeft: "2px solid var(--green)",
                  paddingLeft: 12,
                  marginTop: 16,
                }}
              >
                EVERY ANSWER TEACHES VYBZ MORE
                <br />
                ABOUT THE WAY YOU PLAY. WRONG
                <br />
                ANSWERS. BIASES. PREFERENCES.
                <br />
                ALL RECALIBRATE YOUR NEXT ROM.
              </div>

              {/* Interactive adaptive flowchart */}
              <div
                ref={memoryFlowRef}
                onClick={triggerMemorySequence}
                data-cursor="LEARN"
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  cursor: "pointer",
                }}
              >
                {[
                  {
                    state: "WRONG ANSWER",
                    color: "var(--red)",
                    icon: "✖",
                  },
                  null,
                  {
                    state: "MEMORY UPDATED",
                    color: "var(--yellow)",
                    icon: "△",
                  },
                  null,
                  {
                    state: "NEXT GAME ADAPTED",
                    color: "var(--green)",
                    icon: "✓",
                  },
                ].map((item, i) =>
                  item === null ? (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "2px 0",
                      }}
                    >
                      <div
                        style={{
                          width: 1,
                          height: 18,
                          background: "var(--border)",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      key={item.state}
                      className="panel"
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        borderLeft: `3px solid ${item.color}`,
                      }}
                    >
                      <span
                        className="jb"
                        style={{ fontSize: 14, color: item.color }}
                      >
                        {item.icon}
                      </span>
                      <span
                        className="jb"
                        style={{
                          fontSize: 11,
                          color: "var(--txt)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {item.state}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Player Profile Stats */}
            <div>
              <div
                ref={profileBarRef}
                style={{
                  background: "var(--chassis)",
                  border: "1px solid var(--border)",
                  padding: "16px",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                    marginBottom: 14,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <span className="led led-g pulse-g" />
                    PLAYER PROFILE // 01
                  </span>
                  <span className="chip chip-g">SYNC ACTIVE</span>
                </div>

                {[
                  { l: "CHAOS AFFINITY", p: 82, c: "var(--orange)" },
                  { l: "MEMORY RECALL", p: 91, c: "var(--green)" },
                  { l: "TRIVIA ACCURACY", p: 64, c: "var(--yellow)" },
                  { l: "INSIDE JOKES", p: 100, c: "var(--cyan)" },
                ].map((s) => (
                  <div key={s.l} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        className="jb"
                        style={{ fontSize: 10, color: "var(--txt2)" }}
                      >
                        {s.l}
                      </span>
                      <span
                        className="jb"
                        style={{
                          fontSize: 10,
                          color: s.c,
                          fontWeight: 700,
                        }}
                      >
                        {s.p}%
                      </span>
                    </div>
                    <ProgBar pct={s.p} color={s.c} />
                    <div
                      className="jb"
                      style={{
                        fontSize: 8,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {"█".repeat(Math.round(s.p / 10))}
                      {"░".repeat(10 - Math.round(s.p / 10))}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Barcode
                    val="PLAYER-01-METRIC"
                    h={16}
                    color="var(--muted)"
                  />
                  <span
                    className="jb"
                    style={{ fontSize: 9, color: "var(--green)" }}
                  >
                    CALIBRATION: RUN #041
                  </span>
                </div>
              </div>

              {/* Memory bank compact */}
              <div
                style={{
                  background: "var(--void)",
                  border: "1px solid var(--border)",
                  padding: "12px 14px",
                  marginTop: 10,
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 6,
                    marginBottom: 10,
                  }}
                >
                  MEMORY BANK // PLAYER 01
                </div>
                {[
                  ["PREFERENCE // 001", "LIKES CHAOTIC QUESTIONS"],
                  ["PREFERENCE // 002", "STRONG MUSIC MEMORY"],
                  ["PREFERENCE // 003", "INSIDE JOKE RECALL: HIGH"],
                  ["PATTERN // 004", "FREQUENT 2AM DEBATES"],
                  ["RELATIONSHIP // 005", "RIVALRY: ALEX VS LIAM"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "baseline",
                      borderBottom: "1px dotted var(--border)",
                      paddingBottom: 5,
                      marginBottom: 5,
                    }}
                  >
                    <span
                      className="jb"
                      style={{
                        fontSize: 9,
                        color: "var(--green)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {k}
                    </span>
                    <span
                      className="jb"
                      style={{ fontSize: 9, color: "var(--txt2)" }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          09 // SPEC 23: MANIFESTO & TYPOGRAPHIC WIPE
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          borderBottom: "1px solid var(--border)",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "52px 0",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Tiny telemetry side strips */}
        <div
          className="jb"
          style={{
            position: "absolute",
            left: 24,
            top: "50%",
            transform: "translateY(-50%) rotate(180deg)",
            fontSize: 9,
            color: "var(--muted)",
            letterSpacing: "0.14em",
            writingMode: "vertical-rl",
            textTransform: "uppercase",
          }}
        >
          MANIFESTO // EDITORIAL BREAK // SECTION 08
        </div>
        <div
          className="jb"
          style={{
            position: "absolute",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 9,
            color: "var(--muted)",
            letterSpacing: "0.14em",
            writingMode: "vertical-rl",
            textTransform: "uppercase",
          }}
        >
          AUTHORED BY YOUR FRIENDS // ARCHIVAL PREMISE
        </div>

        <div
          style={{
            maxWidth: 1540,
            margin: "0 auto",
            padding: "0 80px",
            width: "100%",
          }}
        >
          <div
            className="jb"
            style={{
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.14em",
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            ┌ 08 // MANIFESTO — MAXIMUM SCALE
          </div>

          <div
            ref={editorialHeadingRef}
            style={{ lineHeight: 0.88, userSelect: "none" }}
          >
            <div className="hero-title" style={{ color: "var(--txt)" }}>
              YOUR GROUP CHAT
            </div>
            <div
              className="hero-title"
              style={{ color: "var(--txt2)", paddingLeft: "6vw" }}
            >
              WAS NEVER
            </div>
            <div
              className="hero-title"
              style={{
                color: "var(--green)",
                paddingLeft: "2vw",
                textShadow: "0 0 40px rgba(57,255,20,0.2)",
              }}
            >
              JUST A CHAT.
            </div>
          </div>

          <div style={{ marginTop: 28, paddingLeft: "14vw" }}>
            <div
              className="sg"
              style={{
                fontSize: "clamp(24px,4vw,56px)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                color: "var(--yellow)",
              }}
            >
              IT WAS A GAME WAITING TO HAPPEN.
            </div>
            <div
              className="jb"
              style={{
                fontSize: 9,
                color: "var(--muted)",
                marginTop: 8,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              [ ARCHIVAL PREMISE // AUTHORED BY YOUR FRIENDS ] ┘
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          10 // SPEC 27: FINAL CTA — READY PLAYER?
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="section-final"
        ref={finalSectionRef}
        style={{
          borderBottom: "1px solid var(--border)",
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ghost VYBZ for final */}
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            right: "-5%",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
          }}
        >
          <div
            style={{
              fontFamily: "var(--sg)",
              fontSize: "clamp(160px,28vw,400px)",
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.06em",
              textTransform: "uppercase",
              WebkitTextStroke: "1px rgba(57,255,20,0.07)",
              color: "transparent",
            }}
            aria-hidden
          >
            VYBZ
          </div>
        </div>

        <div
          style={{
            maxWidth: 1540,
            margin: "0 auto",
            padding: "48px 24px",
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top small label */}
          <div
            className="jb"
            style={{
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            VYBZ // FINAL SYSTEM — CREDITS: [
            {String(coins).padStart(2, "0")}]
          </div>

          {/* Main content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 32,
              alignItems: "center",
            }}
          >
            <div>
              <h2
                ref={finalCtaTitleRef}
                className="hero-title glitch-slice"
                data-text="READY PLAYER?"
                style={{
                  color: "var(--green)",
                  textShadow: "0 0 32px rgba(57,255,20,0.25)",
                }}
              >
                READY
                <br />
                PLAYER?
              </h2>

              <div
                className="sg"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  color: "var(--yellow)",
                  marginTop: 8,
                }}
              >
                YOUR CHATS ARE WAITING.
              </div>

              <div
                className="jb"
                style={{
                  fontSize: 11,
                  color: "var(--txt2)",
                  lineHeight: 1.7,
                  borderLeft: "2px solid var(--green)",
                  paddingLeft: 12,
                  marginTop: 16,
                  maxWidth: 440,
                }}
              >
                DROP ANY WHATSAPP, TELEGRAM, OR DISCORD
                <br />
                GROUP CHAT EXPORT. YOUR CUSTOM ARCADE
                <br />
                CARTRIDGES COMPILE IN SECONDS.
                <br />
                ZERO TRACKING. USER-OWNED DATA.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 24,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* SPEC 20: Magnetic Insert Coin Button */}
                <button
                  ref={finalCoinBtnRef}
                  className="btn-green glitch-slice"
                  data-text="INSERT COIN →"
                  data-cursor="COIN"
                  style={{ fontSize: 13, padding: "14px 28px" }}
                  onClick={() => {
                    insertCoin();
                    scrollTo("section-port");
                  }}
                >
                  INSERT COIN →
                  <span
                    style={{
                      background: "#000",
                      color: "var(--green)",
                      fontSize: 9,
                      padding: "2px 6px",
                    }}
                  >
                    [{String(coins).padStart(2, "0")}]
                  </span>
                </button>
                <button
                  className="btn-outline"
                  data-cursor="PLAY"
                  style={{ fontSize: 11, padding: "14px 22px" }}
                  onClick={() => scrollTo("section-play")}
                >
                  START PLAYING →
                </button>
              </div>
            </div>

            {/* Final CRT Module */}
            <div>
              <div
                style={{
                  background: "var(--chassis)",
                  border: "1px solid var(--border)",
                  boxShadow: "6px 6px 0 #000",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <span>⊕ COIN_MOD // 99</span>
                  <span>CHASSIS_FINAL ⊕</span>
                </div>
                <div
                  ref={finalCrtRef}
                  className="crt"
                  style={{
                    margin: 8,
                    padding: "20px 16px",
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="crt-beam" />
                  <div className="crt-content">
                    <div
                      className="jb"
                      style={{
                        fontSize: 9,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "var(--muted)",
                        borderBottom: "1px solid rgba(57,255,20,0.15)",
                        paddingBottom: 5,
                      }}
                    >
                      <span>PLAYER 01</span>
                      <span style={{ color: "var(--green)" }}>
                        ● READY
                      </span>
                    </div>
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <div
                        className="jb"
                        style={{
                          fontSize: 9,
                          color: "var(--muted)",
                          letterSpacing: "0.12em",
                          marginBottom: 6,
                        }}
                      >
                        ALL-TIME RECORD
                      </div>
                      <div className="score-num" style={{ fontSize: 42 }}>
                        <AnimCounter target={999999} padZeros={6} />
                      </div>
                      <div
                        className="jb"
                        style={{
                          fontSize: 10,
                          color: "var(--green)",
                          letterSpacing: "0.1em",
                          marginTop: 8,
                        }}
                      >
                        GAME READY TO LAUNCH
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid rgba(57,255,20,0.15)",
                        paddingTop: 5,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Barcode
                        val="CREDIT-READY"
                        h={14}
                        color="var(--green)"
                      />
                      <span
                        className="jb"
                        style={{ fontSize: 8, color: "var(--muted)" }}
                      >
                        INSERT 1 TOKEN
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 10px",
                    borderTop: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  <span>⊕ GND</span>
                  <span style={{ color: "var(--green)" }}>
                    HIGH VOLTAGE PHOSPHOR
                  </span>
                  <span>⊕ PWR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom ticker / telemetry scroll */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div className="marquee-wrap">
              <div
                className="marquee-inner jb"
                style={{
                  fontSize: 9,
                  color: "var(--muted)",
                  letterSpacing: "0.12em",
                  gap: 32,
                  display: "flex",
                }}
              >
                {Array.from({ length: 2 }).flatMap((_, n) =>
                  [
                    "VYBZ // ARCADE SYSTEM",
                    "INSERT COIN",
                    "PLAY. LEARN. REPEAT.",
                    "ROM CARTRIDGE SYSTEM",
                    "AI HEURISTIC ENGINE",
                    "PHOSPHOR ARCADE BRUTALISM",
                    "MEMORY BANK ACTIVE",
                    "ZERO TRACKING",
                    "PLAYER 01 ONLINE",
                  ].map((t, i) => (
                    <span
                      key={`${n}-${i}-${t}`}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "var(--green)" }}>●</span>
                      {t}
                      <span style={{ color: "var(--border)" }}>|</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "#07080A",
          borderTop: "2px solid var(--border)",
          padding: "32px 0 20px",
        }}
      >
        <div
          style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}
        >
          {/* Corner marks */}
          <div
            className="jb"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "var(--muted)",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 10,
              marginBottom: 20,
            }}
          >
            <span>┌ HARDWARE CHASSIS // 2026</span>
            <span>COORD: 37.7749° N, 122.4194° W ┐</span>
          </div>

          {/* Massive wordmark */}
          <div
            className="sg"
            style={{
              fontSize: "clamp(60px,13vw,180px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              lineHeight: 0.9,
              color: "rgba(243,241,236,0.88)",
              userSelect: "none",
            }}
          >
            VYBZ
          </div>
          <div
            className="jb"
            style={{
              fontSize: 9,
              color: "var(--green)",
              letterSpacing: "0.14em",
              marginTop: 4,
              textTransform: "uppercase",
            }}
          >
            [ AI-POWERED SOCIAL GAMING HARDWARE // TURN CHATS INTO GAMES ]
          </div>

          {/* Footer nav grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
              marginTop: 28,
              marginBottom: 24,
            }}
          >
            {[
              [
                "NAVIGATION",
                [
                  "INPUT",
                  "DATA PORT",
                  "AI CORE",
                  "ROM SHELF",
                  "LIVE PLAY",
                  "MEMORY",
                ],
              ],
              [
                "GAME MODES",
                [
                  "WHO SAID IT?",
                  "MEMORY BANK",
                  "FRIENDSHIP QUIZ",
                  "HOT TAKE MACHINE",
                  "CHAOS MODE",
                ],
              ],
              [
                "PRIVACY",
                [
                  "CLIENT-SIDE PARSE",
                  "ZERO CLOUD EXPORT",
                  "USER-OWNED DATA",
                  "NO LLM TRAINING",
                  "AES-256 LOCAL",
                ],
              ],
              [
                "SYSTEM",
                [
                  "BUILD: 01.04",
                  "ENGINE: ACTIVE",
                  "ROM BUS: 16-BIT",
                  "FREQ: 60Hz",
                  "CHASSIS: OK",
                ],
              ],
            ].map(([title, items]) => (
              <div key={title as string}>
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 4,
                    marginBottom: 10,
                    letterSpacing: "0.12em",
                  }}
                >
                  {title}
                </div>
                {(items as string[]).map((item) => (
                  <div
                    key={item}
                    className="jb"
                    style={{
                      fontSize: 10,
                      color: "var(--txt2)",
                      lineHeight: 2.0,
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>&gt;</span> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Receipt copyright strip */}
          <div
            style={{
              background: "#F3F1EC",
              color: "#0A0B0D",
              fontFamily: "var(--jb)",
              fontSize: 9,
              padding: "8px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontWeight: 700 }}>
              *** HARDWARE DISPATCH RECEIPT *** // SYSTEM BUILD 2026.04
            </span>
            <span>
              © 2026 VYBZ LABS. ALL RIGHTS RESERVED. ZERO GAUSSIAN BLUR
              PERMITTED.
            </span>
          </div>

          <div
            className="jb"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "var(--muted)",
              borderTop: "1px solid var(--border)",
              paddingTop: 10,
            }}
          >
            <span>└ CHASSIS GROUNDED // 0V</span>
            <span>PHOSPHOR ARCADE BRUTALISM ┘</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── SOUND ENGINE ────────────────────────────────────────────────────────────
class SndEngine {
  private ctx: AudioContext | null = null;
  muted = false;
  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      o.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch { /**/ }
  }
  click() { this.tone(1200, 0.04, "square", 0.08); }
  coin() {
    this.tone(987, 0.12, "square", 0.14);
    setTimeout(() => this.tone(1318, 0.35, "square", 0.18), 100);
  }
  crtPower() { this.tone(80, 0.5, "sawtooth", 0.07); }
  success() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, "triangle", 0.14), i * 75)
    );
  }
  error() { this.tone(140, 0.32, "sawtooth", 0.18); }
}
const snd = new SndEngine();

// ── SCRAMBLE TEXT ────────────────────────────────────────────────────────────
function useScramble(text: string, active = true) {
  const [display, setDisplay] = useState(text);
  const chars = "0123456789ABCDEF#@!?<>[]_";
  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let it = 0;
    const id = setInterval(() => {
      setDisplay(() =>
        text.split("").map((c, i) =>
          c === " " ? " " : i < it ? text[i] : chars[Math.floor(Math.random() * chars.length)]
        ).join("")
      );
      if (it++ >= text.length) { clearInterval(id); setDisplay(text); }
    }, 38);
    return () => clearInterval(id);
  }, [text, active]);
  return display;
}

// ── BARCODE SVG ──────────────────────────────────────────────────────────────
function Barcode({ val, color = "#7E828C", h = 18 }: { val: string; color?: string; h?: number }) {
  const bars = val.split("").flatMap(c => {
    const n = c.charCodeAt(0);
    return [n % 3 + 1, (n >> 1) % 2 + 1, (n >> 2) % 3 + 1];
  });
  const W = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} className="block flex-shrink-0">
      {bars.map((w, i) => {
        const rx = x; x += w;
        return i % 3 === 2 ? null : <rect key={i} x={rx} y={0} width={w - 0.3} height={h} fill={color} />;
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
      setT(`${String(n.getUTCHours()).padStart(2,"0")}:${String(n.getUTCMinutes()).padStart(2,"0")}:${String(n.getUTCSeconds()).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="jb" style={{ fontVariantNumeric: "tabular-nums" }}>{t} UTC</span>;
}

// ── COUNTER ANIMATION ────────────────────────────────────────────────────────
function AnimCounter({ target, dur = 1.8 }: { target: number; dur?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / (dur * 1000), 1);
          setVal(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(tick);
          else setVal(target);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, dur]);
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{val.toLocaleString()}</span>;
}

// ── PROGRESS BAR ANIMATED ────────────────────────────────────────────────────
function ProgBar({ pct, color = "var(--green)" }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setW(pct), 200); obs.disconnect(); }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct]);
  return (
    <div ref={ref} className="prog-track" style={{ flex: 1 }}>
      <div className="prog-fill" style={{ width: `${w}%`, background: color, transition: `width 0.9s ease ${w === 0 ? '0s' : '0.1s'}` }} />
    </div>
  );
}

// ── SECTION MARKER ───────────────────────────────────────────────────────────
function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5" style={{ fontFamily: "var(--jb)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.14em" }}>
      <span className="chip chip-g">{n}</span>
      <span style={{ color: "var(--muted)" }}>// {label}</span>
      <span style={{ flex: 1, borderTop: "1px dashed var(--border)", display: "block" }} />
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function VybzPage() {
  const [coins, setCoins] = useState(2);
  const [muted, setMuted] = useState(false);
  const [answerState, setAnswerState] = useState<null | "correct" | "wrong">(null);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [score, setScore] = useState(8420);
  const [activeCart, setActiveCart] = useState(0);
  const [uploadStage, setUploadStage] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorBig, setCursorBig] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const chatsRef = useRef<HTMLHeadingElement>(null);
  const gamesRef = useRef<HTMLHeadingElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  // Cursor
  const targetRef = useRef({ x: -100, y: -100 });
  const curRef = useRef({ x: -100, y: -100 });
  useEffect(() => {
    const move = (e: MouseEvent) => { targetRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);
    let raf: number;
    const loop = () => {
      curRef.current.x += (targetRef.current.x - curRef.current.x) * 0.28;
      curRef.current.y += (targetRef.current.y - curRef.current.y) * 0.28;
      setCursorPos({ x: curRef.current.x, y: curRef.current.y });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const over = () => setCursorBig(true);
    const out = () => setCursorBig(false);
    document.querySelectorAll("button,a,[data-hover]").forEach(el => {
      el.addEventListener("mouseenter", over);
      el.addEventListener("mouseleave", out);
    });
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  // GSAP Scroll Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax
      if (chatsRef.current && gamesRef.current && ghostRef.current) {
        gsap.to(chatsRef.current, { x: -80, scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.2 } });
        gsap.to(gamesRef.current, { x: 100, scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.4 } });
        gsap.to(ghostRef.current, { y: 60, scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.8 } });
      }
      // Counter sections
      gsap.utils.toArray<HTMLElement>(".gsap-fade-up").forEach(el => {
        gsap.fromTo(el, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const insertCoin = useCallback(() => {
    snd.coin();
    setCoins(c => c + 1);
  }, []);

  const pickAnswer = useCallback((key: string, correct: boolean) => {
    if (answerState) return;
    setSelectedAns(key);
    if (correct) { snd.success(); setAnswerState("correct"); setScore(s => s + 500); }
    else { snd.error(); setAnswerState("wrong"); }
  }, [answerState]);

  const nextQuestion = useCallback(() => {
    snd.click();
    setAnswerState(null); setSelectedAns(null);
  }, []);

  const simulateUpload = useCallback(() => {
    snd.click();
    setUploadStage(1);
    setTimeout(() => { snd.click(); setUploadStage(2); }, 700);
    setTimeout(() => { snd.click(); setUploadStage(3); }, 1400);
    setTimeout(() => { snd.success(); setUploadStage(4); }, 2200);
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

  // ─── Data ────────────────────────────────────────────────────────────────
  const cartridges = [
    { id: 0, rom: "ROM // 001", title: "WHO SAID IT?", sub: "IDENTIFY THE AUTHOR", score: "08,420", diff: "NORMAL", accent: "var(--green)" },
    { id: 1, rom: "ROM // 002", title: "MEMORY BANK", sub: "CHRONOLOGICAL RECALL", score: "12,100", diff: "HARD", accent: "var(--yellow)" },
    { id: 2, rom: "ROM // 003", title: "FRIENDSHIP QUIZ", sub: "PREDICT BEHAVIOR", score: "06,890", diff: "MEDIUM", accent: "var(--cyan)" },
    { id: 3, rom: "ROM // 004", title: "HOT TAKE MACHINE", sub: "CONTROVERSY METRIC", score: "14,200", diff: "EXTREME", accent: "var(--orange)" },
    { id: 4, rom: "ROM // 005", title: "CHAOS MODE", sub: "SPEEDRUN UNFILTERED", score: "19,550", diff: "BRUTAL", accent: "var(--red)" },
  ];

  const answers = [
    { key: "A", label: "Alex", tag: "THE AUX TYRANT", correct: true },
    { key: "B", label: "Maya", tag: "LORE KEEPER", correct: false },
    { key: "C", label: "Sam", tag: "VOICE NOTE POET", correct: false },
    { key: "D", label: "Liam", tag: "SERIAL CONTRARIAN", correct: false },
  ];

  const chatFrags = [
    { msg: "bro no way 💀", user: "ALEX", time: "02:14" },
    { msg: "remember last summer?", user: "MAYA", time: "04:32" },
    { msg: "WHO INVITED HIM", user: "SAM", time: "11:59" },
    { msg: "you literally said the opposite", user: "LIAM", time: "01:18" },
    { msg: "nah you're actually insane", user: "ALEX", time: "03:47" },
    { msg: "okay hear me out", user: "MAYA", time: "00:03" },
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "var(--void)", color: "var(--txt)", fontFamily: "var(--sg)", minHeight: "100vh", position: "relative" }}>

      {/* Global UI layers */}
      <div className="vignette" />

      {/* Custom Cursor */}
      <div className="cursor" style={{ left: cursorPos.x, top: cursorPos.y }} aria-hidden>
        <div className="cur-dot" />
        <div className={`cur-ring ${cursorBig ? "big" : ""}`} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER NAV
      ═══════════════════════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        background: "rgba(10,11,13,0.94)", borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(2px)",
      }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          {/* Top micro telemetry strip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "4px 0", borderBottom: "1px solid var(--border)",
            fontFamily: "var(--jb)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em"
          }}>
            <span>┌ COORD: 00.00N — CHASSIS: TERMINAL_01</span>
            <span style={{ display: "flex", gap: 20 }}>
              <span>FREQ: 60Hz</span>
              <span>BUILD: 01.04</span>
              <span style={{ color: "var(--green)" }}>PHOSPHOR: ACTIVE └</span>
            </span>
          </div>

          {/* Main nav row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "7px 0" }}>
            {/* Brand */}
            <button onClick={() => scrollTo("hero")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: 20 }}>
              <span style={{ fontFamily: "var(--sg)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.04em", color: "var(--green)" }}>VYBZ</span>
              <span className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>SYSTEM 01.04</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="led led-g pulse-g" />
                <span className="jb" style={{ fontSize: 9, color: "var(--green)", letterSpacing: "0.1em" }}>ONLINE</span>
              </span>
            </button>

            {/* Section jump codes */}
            <nav style={{ display: "flex", gap: 2, flex: 1, overflow: "hidden" }}>
              {[["section-input", "01/INPUT"], ["section-port", "02/PORT"], ["section-ai", "03/CORE"], ["section-shelf", "04/ROMS"], ["section-play", "05/PLAY"], ["section-mem", "06/MEM"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className="jb"
                  style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 9, letterSpacing: "0.1em", padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap", transition: "border-color .12s,color .12s" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "var(--green)"; (e.target as HTMLElement).style.color = "var(--green)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; (e.target as HTMLElement).style.color = "var(--muted)"; }}
                >[{label}]</button>
              ))}
            </nav>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
              <LiveClock />
              <button onClick={toggleMute} className="jb" style={{ background: "none", border: "1px solid var(--border)", color: muted ? "var(--red)" : "var(--green)", fontSize: 9, letterSpacing: "0.1em", padding: "4px 8px", cursor: "pointer" }}>
                AUDIO:[{muted ? "OFF" : "ON"}]
              </button>
              <button onClick={insertCoin} className="jb"
                style={{ background: "var(--yellow)", color: "#000", border: "1px solid var(--yellow)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", cursor: "pointer" }}>
                COINS:[{String(coins).padStart(2,"0")}]
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          01 // HERO — SYSTEM BOOT
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="hero" ref={heroRef} style={{ minHeight: "100vh", paddingTop: 70, position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
        {/* Ghost outline VYBZ watermark */}
        <div ref={ghostRef} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -52%)", pointerEvents: "none", userSelect: "none", zIndex: 0, lineHeight: 1 }}>
          <div className="hero-title-outline" aria-hidden>VYBZ</div>
        </div>

        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 70px)", justifyContent: "space-between" }}>

          {/* TOP BOOT BANNER */}
          <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="chip chip-g">SYSTEM 01</span>
              <span className="jb" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
                INITIALIZING HARDWARE CORE...
              </span>
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className="led led-g" />
                <span className="jb" style={{ fontSize: 10, color: "var(--green)", letterSpacing: "0.1em" }}>PLAYER: DETECTED</span>
              </span>
            </div>
            <div className="jb" style={{ display: "flex", gap: 16, fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
              <span>MEMORY: 64KB ROM</span>
              <span style={{ color: "var(--yellow)" }}>ENGINE: READY</span>
              <span>INPUT DETECTED // 17,492 MESSAGES</span>
              <span style={{ color: "var(--green)" }}>[ MEMORY POTENTIAL: HIGH ]</span>
            </div>
          </div>

          {/* HERO BODY — ASYMMETRIC GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, padding: "20px 0", flex: 1, alignItems: "center" }}>

            {/* LEFT: Giant Typography */}
            <div>
              {/* Telemetry row above type */}
              <div className="jb" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", display: "flex", gap: 16, marginBottom: 8 }}>
                <span style={{ color: "var(--green)" }}>┌ INPUT DETECTED // 17,492 MESSAGES</span>
                <span style={{ color: "var(--yellow)" }}>[ MEMORY POTENTIAL: HIGH ]</span>
                <span>PLAYER: 01 ┘</span>
              </div>

              {/* YOUR CHATS. */}
              <h1 ref={chatsRef} className="hero-title" style={{ color: "var(--txt)", willChange: "transform" }}>
                YOUR CHATS.
              </h1>

              {/* BECOME GAMES. */}
              <h2 ref={gamesRef} className="hero-title" style={{ color: "var(--green)", paddingLeft: "8vw", willChange: "transform" }}>
                BECOME GAMES.
              </h2>

              {/* Description & CTA Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, marginTop: 28, alignItems: "end" }}>
                <div>
                  <div className="jb" style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7, borderLeft: "2px solid var(--green)", paddingLeft: 12 }}>
                    VYBZ TAKES THE CHAOS, INSIDE JOKES,<br />
                    AND RELATIONSHIPS IN YOUR GROUP CHAT<br />
                    AND TURNS THEM INTO PERSONALIZED<br />
                    ARCADE MINI-GAMES.<br />
                    <br />
                    THE AI LEARNS FROM EVERY ANSWER<br />
                    AND ADAPTS FUTURE CARTRIDGES.
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="btn-green" onClick={() => { insertCoin(); scrollTo("section-port"); }}>
                      INSERT COIN → <span style={{ background: "#000", color: "var(--green)", fontSize: 9, padding: "2px 6px" }}>{coins} READY</span>
                    </button>
                    <button className="btn-outline" onClick={() => scrollTo("section-input")}>
                      VIEW THE MACHINE →
                    </button>
                  </div>
                </div>

                {/* Score module */}
                <div className="panel" style={{ padding: "14px 18px", minWidth: 180, flexShrink: 0 }}>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 6 }}>HIGH SCORE</div>
                  <div className="score-num">08,420</div>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>INSERT COIN // {coins} READY</div>
                  <div style={{ marginTop: 8 }}>
                    <Barcode val="VYBZ-8849" h={14} color="var(--muted)" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CRT Module */}
            <div>
              <div style={{ background: "var(--chassis)", border: "1px solid var(--border)", boxShadow: "6px 6px 0 #000" }}>
                {/* Chassis header */}
                <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace" }}>⊕</span>
                    CRT-MOD // 8849
                  </span>
                  <span style={{ color: "var(--green)", display: "flex", gap: 4, alignItems: "center" }}>
                    <span className="led led-g pulse-g" />CHASSIS_01
                  </span>
                  <span style={{ fontFamily: "monospace" }}>⊕</span>
                </div>

                {/* CRT Screen */}
                <div className="crt" style={{ margin: 8, padding: "20px 14px", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", color: "var(--muted)", borderBottom: "1px solid rgba(57,255,20,0.15)", paddingBottom: 6 }}>
                    <span>FREQ: 15.75 kHz</span>
                    <span style={{ color: "var(--green)" }}>● SYNC LOCK</span>
                  </div>

                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div className="jb" style={{ fontSize: 10, color: "var(--yellow)", letterSpacing: "0.1em", marginBottom: 10 }}>★ READY PLAYER 01 ★</div>
                    <div className="sg" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--txt)" }}>INSERT COIN</div>
                    <div style={{ width: 48, height: 2, background: "var(--green)", boxShadow: "0 0 8px var(--green)", margin: "10px auto" }} />
                    <div className="jb" style={{ fontSize: 10, color: "var(--green)", letterSpacing: "0.1em" }}>
                      GAME ENGINE: ONLINE
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(57,255,20,0.15)", paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Barcode val="COIN-OP-01" h={14} color="var(--green)" />
                    <span className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>ROM REV 1.4</span>
                  </div>
                </div>

                {/* Chassis footer */}
                <div className="jb" style={{ fontSize: 8, display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
                  <span>⊕ SCREW_L</span>
                  <span style={{ color: "var(--green)" }}>STATUS: STANDBY</span>
                  <span>⊕ SCREW_R</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM TELEMETRY BAR */}
          <div className="jb" style={{ padding: "10px 0", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--green)" }}>► 01/BOOT</span>
              <span>CORE PIPELINE: ACTIVE</span>
              <span className="hidden md:inline">SYSTEM: 1980s COIN-OP ARCHITECTURE</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--yellow)" }}>CREDITS: {coins}</span>
              <span style={{ color: "var(--txt)" }}>SCROLL TO ENGAGE ▼</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          02 // INPUT — YOUR GROUP CHAT IS WEIRD
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-input" style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="01 // INPUT" label="INGESTION PROTOCOL: ACTIVE" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* Left: Headlines & Raw Terminal */}
            <div>
              <h2 className="section-title" style={{ color: "var(--txt)" }}>YOUR GROUP<br />CHAT IS<br /><span style={{ color: "var(--green)" }}>WEIRD.</span></h2>
              <div className="sg" style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", textTransform: "uppercase", color: "var(--yellow)", lineHeight: 1 }}>GOOD.</div>

              <div style={{ marginTop: 24 }}>
                <div style={{ background: "var(--chassis)", border: "1px solid var(--border)", padding: "14px 16px", marginBottom: 12 }}>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                    <span>RAW CHAT INPUT // 00231</span>
                    <span style={{ color: "var(--green)" }}>SCANNING...</span>
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
                    <div key={i} className="jb" style={{ fontSize: 10, color, lineHeight: 1.8, letterSpacing: "0.04em" }}>{line}</div>
                  ))}
                </div>

                {/* Mini stat pills */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["17,492", "MESSAGES"], ["283", "PATTERNS"], ["47", "CLUSTERS"], ["92%", "CHAOS"]].map(([n, l]) => (
                    <div key={l} style={{ background: "var(--cart)", border: "1px solid var(--border)", padding: "6px 12px" }}>
                      <div className="jb" style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>{n}</div>
                      <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Chat Fragment Grid */}
            <div style={{ position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {chatFrags.map((f, i) => (
                  <div key={i} className="panel" style={{ padding: "8px 10px", borderLeft: `2px solid ${i % 3 === 0 ? "var(--green)" : i % 3 === 1 ? "var(--yellow)" : "var(--orange)"}` }}>
                    <div className="jb" style={{ fontSize: 9, color: "var(--muted)", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{f.time} AM // {f.user}</span>
                      <span>MSG #{String(i + 100).padStart(5, "0")}</span>
                    </div>
                    <div className="jb" style={{ fontSize: 11, color: "var(--txt)", lineHeight: 1.4 }}>&gt; {f.msg}</div>
                  </div>
                ))}
              </div>

              {/* Thermal receipt overlay */}
              <div className="receipt" style={{ padding: "12px 14px", marginTop: 8, boxShadow: "3px 3px 0 #000", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #ccc", paddingBottom: 4, marginBottom: 6, fontSize: 9, fontWeight: 700 }}>
                  <span>*** VYBZ RECEIPT ***</span>
                  <span>TRANS: #99482</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: 9 }}>
                  {[["SOURCE:", "SUNDAY BOYZZ GROUP"], ["MSGS:", "17,492"], ["PATTERNS:", "283"], ["STATUS:", "IMPORTED"]].map(([k, v]) => (
                    <React.Fragment key={k}><span>{k}</span><span style={{ fontWeight: 700 }}>{v}</span></React.Fragment>
                  ))}
                </div>
                <div style={{ textAlign: "center", borderTop: "1px dashed #ccc", marginTop: 6, paddingTop: 4, fontSize: 8, fontStyle: "italic" }}>
                  &quot;WHO INVITED HIM&quot; — most detected phrase
                </div>
                <Barcode val="RAW-CHAT-INGEST" h={16} color="#0A0B0D" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          03 // DATA PORT
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-port" style={{ borderBottom: "1px solid var(--border)", background: "var(--chassis)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="02 // DATA PORT" label="INGESTION TERMINAL" />

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>
            {/* Left: Huge title */}
            <div>
              <h2 className="section-title" style={{ color: "var(--txt)" }}>INSERT<br />YOUR<br /><span style={{ color: "var(--green)" }}>DATA.</span></h2>
              <div className="jb" style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7, borderLeft: "2px solid var(--green)", paddingLeft: 12, marginTop: 16, maxWidth: 300 }}>
                CLIENT-SIDE PROCESSING.<br />
                YOUR CHATS NEVER LEAVE<br />
                YOUR DEVICE. ZERO TRAINING<br />
                ON EXTERNAL SERVERS.
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                {[".TXT — WHATSAPP / TELEGRAM", ".JSON — DISCORD EXPORTER", ".CSV — CUSTOM LOGS"].map(f => (
                  <div key={f} className="jb" style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--green)" }}>►</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Terminal Drop Zone */}
            <div>
              <div style={{ background: "var(--void)", border: "1px solid var(--border)", padding: "16px" }}>
                <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 12, color: "var(--muted)" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="led led-g" /> DATA PORT // PLAYER 01</span>
                  <span>DEVICE: /DEV/TTY_CHATS</span>
                </div>

                {/* Drop area */}
                <div
                  onClick={simulateUpload}
                  style={{
                    border: `2px dashed ${uploadStage === 4 ? "var(--green)" : "var(--border)"}`,
                    background: uploadStage === 4 ? "rgba(57,255,20,0.04)" : "var(--cart)",
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color .2s,background .2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  }}
                >
                  <div className="sg" style={{ fontSize: 32, color: "var(--green)" }}>⌗</div>
                  <div className="jb" style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)", letterSpacing: "0.08em" }}>
                    &gt; DROP CHAT FILE HERE
                  </div>
                  <div className="jb" style={{ fontSize: 10, color: "var(--muted)" }}>SUPPORTED: .TXT // .JSON // .CSV</div>
                  <button className="btn-green" style={{ marginTop: 4 }} onClick={e => { e.stopPropagation(); simulateUpload(); }}>
                    SELECT FILE →
                  </button>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    DATA PRIVACY // USER CONTROLLED
                  </div>
                </div>

                {/* Progress Terminal */}
                <div style={{ marginTop: 12, background: "#010304", border: "1px solid var(--border)", padding: "12px 14px" }}>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                    <span>ACTIVE STREAM: {uploadStage > 0 ? "group_chat.txt" : "NO_STREAM"}</span>
                    <span style={{ color: "var(--green)" }}>{["IDLE", "INGESTING...", "PARSING...", "INDEXING...", "READY //"][uploadStage]}</span>
                  </div>
                  {[["IMPORTING...", uploadStage >= 1 ? "██████████████░░░░  70%" : "░░░░░░░░░░░░░░░░░░░░   0%"],
                    ["PARSING...  ", uploadStage >= 2 ? "████████████████░░  88%" : "░░░░░░░░░░░░░░░░░░░░   0%"],
                    ["INDEXING... ", uploadStage >= 3 ? "██████████████████ 100%" : "░░░░░░░░░░░░░░░░░░░░   0%"],
                  ].map(([l, v]) => (
                    <div key={l} className="jb" style={{ fontSize: 10, display: "flex", justifyContent: "space-between", marginBottom: 4, color: uploadStage >= 3 ? "var(--green)" : "var(--txt2)" }}>
                      <span style={{ color: "var(--txt2)" }}>{l}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`led ${uploadStage === 4 ? "led-g" : uploadStage > 0 ? "led-y" : "led-r"}`}
                        style={{ animation: uploadStage > 0 && uploadStage < 4 ? "pulse-g 1s infinite" : "none" }} />
                      <span className="jb" style={{ fontSize: 9, color: "var(--txt2)" }}>
                        {uploadStage === 4 ? "SYSTEM READY FOR ANALYSIS" : "STANDBY"}
                      </span>
                    </div>
                    <Barcode val="STREAM-00231" h={12} color="var(--muted)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          04 // AI CORE — THE AI IS NOSY
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-ai" style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="03 // AI CORE" label="HEURISTIC ENGINE ACTIVE" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <h2 className="section-title" style={{ color: "var(--txt)" }}>THE AI<br /><span style={{ color: "var(--green)" }}>IS NOSY.</span></h2>
              <div className="sg" style={{ fontSize: 28, fontWeight: 700, textTransform: "uppercase", color: "var(--txt2)", letterSpacing: "-0.02em", marginTop: 4 }}>
                NOT CREEPY NOSY.<br />GAME NOSY.
              </div>

              {/* Telemetry counters */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20 }}>
                {[
                  { l: "MESSAGES PARSED", v: 17492, c: "var(--txt)" },
                  { l: "PATTERNS FOUND", v: 283, c: "var(--green)" },
                  { l: "MEMORY CLUSTERS", v: 47, c: "var(--yellow)" },
                  { l: "GAME POTENTIAL", v: 98, c: "var(--cyan)", suffix: "%" },
                ].map(item => (
                  <div key={item.l} className="panel" style={{ padding: "12px 14px" }}>
                    <div className="jb" style={{ fontSize: 9, color: "var(--muted)", marginBottom: 4, letterSpacing: "0.1em" }}>{item.l}</div>
                    <div className="sg" style={{ fontSize: 28, fontWeight: 700, color: item.c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      <AnimCounter target={item.v} />{item.suffix ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="panel" style={{ padding: "16px" }}>
              <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 14, color: "var(--muted)" }}>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="led led-g pulse-g" />AI CORE // ANALYSIS 001</span>
                <span style={{ color: "var(--green)" }}>STATUS: ANALYSIS COMPLETE</span>
              </div>

              {/* Stat bars */}
              {[
                { l: "PERSONALITY SIGNAL", p: 98, c: "var(--green)" },
                { l: "INSIDE JOKE DENSITY", p: 91, c: "var(--green)" },
                { l: "MEMORY RECALL", p: 82, c: "var(--yellow)" },
                { l: "CHAOS POTENTIAL", p: 100, c: "var(--orange)" },
              ].map(s => (
                <div key={s.l} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span className="jb" style={{ fontSize: 10, color: "var(--txt2)", letterSpacing: "0.06em" }}>{s.l}</span>
                    <span className="jb" style={{ fontSize: 10, color: s.c, fontWeight: 700 }}>{s.p}%</span>
                  </div>
                  <ProgBar pct={s.p} color={s.c} />
                </div>
              ))}

              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["MODEL", "VYBZ CORE v3.1"], ["LATENCY", "12ms BATCH"], ["ACCURACY", "97.4% VERIFIED"]].map(([k, v]) => (
                  <div key={k}>
                    <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{k}</div>
                    <div className="jb" style={{ fontSize: 10, color: "var(--txt)", letterSpacing: "0.06em" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Terminal log */}
              <div style={{ marginTop: 14, background: "#010304", border: "1px solid var(--border)", padding: "10px 12px" }}>
                {[
                  ["> INITIALIZING ANALYSIS", "var(--muted)"],
                  ["> PARSING MESSAGE CLUSTERS", "var(--green)"],
                  ["> DETECTING RELATIONSHIPS", "var(--txt2)"],
                  ["> IDENTIFYING PHRASES", "var(--txt2)"],
                  ["> MAPPING PERSONALITIES", "var(--yellow)"],
                  ["> GAME ENGINE: READY ■", "var(--green)"],
                ].map(([l, c]) => (
                  <div key={l} className="jb" style={{ fontSize: 9, color: c, lineHeight: 1.9 }}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          05 // TRANSFORM — RAW TEXT IN. CHAOS OUT.
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "var(--chassis)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="04 // GENERATE" label="HEURISTIC SYNTHESIS PIPELINE" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 1fr", gap: 16, alignItems: "start" }}>
            {/* Left: Raw Chat */}
            <div>
              <div className="sg" style={{ fontSize: 36, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--yellow)", marginBottom: 12 }}>
                RAW TEXT.<br />CHAOS<br />GOES IN.
              </div>
              <div style={{ background: "var(--void)", border: "1px solid var(--border)", padding: "14px" }}>
                <div className="jb" style={{ fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>RAW STREAM // 00231</span>
                  <span style={{ color: "var(--orange)" }}>ENTROPY: HIGH</span>
                </div>
                {[
                  ["ALEX", "11:42", "I literally told you guys not to touch the aux cord 5 minutes ago", "var(--orange)"],
                  ["LIAM", "11:43", "Nobody wants to listen to 14-minute experimental synth tracks bro", "var(--muted)"],
                  ["MAYA", "11:44", "He does this every single road trip without fail 😭", "var(--cyan)"],
                  ["SAM", "11:52", "okay but hear me out", "var(--muted)"],
                ].map(([u, t, m, c]) => (
                  <div key={t} style={{ borderLeft: `2px solid ${c}`, paddingLeft: 8, marginBottom: 10 }}>
                    <div className="jb" style={{ fontSize: 9, color: "var(--muted)", display: "flex", gap: 10, marginBottom: 2 }}>
                      <span style={{ color: c as string }}>{u}</span>
                      <span>{t} PM</span>
                    </div>
                    <div className="jb" style={{ fontSize: 10, color: "var(--txt2)" }}>{m}</div>
                  </div>
                ))}
                <div className="jb" style={{ fontSize: 9, color: "var(--green)", marginTop: 8 }}>
                  GAME MATERIAL DETECTED ■
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
              <div style={{ background: "var(--cart)", border: "1px solid var(--green)", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #000" }}>
                <span className="sg" style={{ fontSize: 20, color: "var(--green)", fontWeight: 700 }}>→</span>
              </div>
              <div className="jb" style={{ fontSize: 8, color: "var(--muted)", textAlign: "center", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>SYNTH</div>
            </div>

            {/* Right: Generated Game */}
            <div>
              <div className="sg" style={{ fontSize: 36, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--green)", marginBottom: 12 }}>
                CHAOS<br />GOES OUT.<br />GAME IN.
              </div>
              <div style={{ background: "var(--void)", border: "1px solid var(--green)", padding: "14px", boxShadow: "4px 4px 0 var(--green)" }}>
                <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(57,255,20,0.2)", paddingBottom: 6, marginBottom: 12, color: "var(--muted)" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="chip chip-g">GAME 01</span> WHO SAID IT?</span>
                  <span style={{ color: "var(--green)" }}>COMPILED ✓</span>
                </div>
                <div className="jb" style={{ fontSize: 10, color: "var(--yellow)", marginBottom: 6 }}>QUESTION // PROMPT #042</div>
                <div className="sg" style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.01em", color: "var(--txt)", marginBottom: 8 }}>
                  &quot;WHO WOULD MOST LIKELY SAY THIS?&quot;
                </div>
                <div className="jb" style={{ fontSize: 10, color: "var(--green)", fontStyle: "italic", marginBottom: 12, borderLeft: "2px solid var(--green)", paddingLeft: 8 }}>
                  &quot;...not to touch the aux cord&quot;
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {answers.map(a => (
                    <div key={a.key} style={{ background: a.correct ? "rgba(57,255,20,0.1)" : "var(--cart)", border: `1px solid ${a.correct ? "var(--green)" : "var(--border)"}`, padding: "8px 10px" }}>
                      <div className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>KEY // [{a.key}]</div>
                      <div className="sg" style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: a.correct ? "var(--green)" : "var(--txt)" }}>{a.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          06 // ARCADE SHELF
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-shelf" style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="05 // ARCADE SHELF" label="5 ROM MODULES READY" />

          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div>
              <h2 className="section-title" style={{ color: "var(--txt)" }}>THE<br /><span style={{ color: "var(--green)" }}>ARCADE SHELF.</span></h2>
              <div className="jb" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>YOUR GROUP CHAT JUST BECAME A CARTRIDGE.</div>
            </div>
            <div className="jb" style={{ fontSize: 9, color: "var(--muted)", textAlign: "right" }}>
              <span>SLOT: 16-BIT BUS</span><br />
              <span style={{ color: "var(--green)" }}>● ACTIVE ROM LOADED</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {cartridges.map((c) => (
              <div key={c.id}
                className="cartridge"
                style={{ minHeight: 320, padding: "12px 12px 10px", borderColor: activeCart === c.id ? c.accent : "var(--border)" }}
                onClick={() => { snd.coin(); setActiveCart(c.id); }}
              >
                {/* Top label */}
                <div>
                  <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 8, color: "var(--muted)" }}>
                    <span style={{ color: c.accent as string, fontWeight: 700 }}>{c.rom}</span>
                    <span>{c.diff}</span>
                  </div>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>{c.sub}</div>
                  <div className="sg" style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--txt)", lineHeight: 1.1 }}>{c.title}</div>
                </div>

                {/* Middle space — accent stripe */}
                <div style={{ height: 3, background: c.accent as string, margin: "12px -12px", boxShadow: `0 0 8px ${c.accent}` }} />

                {/* Bottom meta */}
                <div>
                  <div className="jb" style={{ fontSize: 9, color: "var(--muted)", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>HIGH SCORE</span>
                    <span style={{ color: "var(--yellow)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{c.score}</span>
                  </div>
                  <Barcode val={c.rom} h={16} color="var(--muted)" />
                  <div className="jb" style={{ fontSize: 9, marginTop: 6, color: activeCart === c.id ? "var(--green)" : "var(--muted)", textAlign: "center", border: `1px solid ${activeCart === c.id ? "var(--green)" : "var(--border)"}`, padding: "3px" }}>
                    {activeCart === c.id ? "● LOADED" : "LOAD →"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          07 // PLAY
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-play" style={{ borderBottom: "1px solid var(--border)", background: "var(--chassis)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="06 // LIVE GAME BENCH" label={`ACTIVE: ${cartridges[activeCart].title}`} />

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>
            {/* Left: Score & Round Meta */}
            <div style={{ minWidth: 200 }}>
              <div className="sg" style={{ fontSize: 64, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.05em", color: "var(--txt)", lineHeight: 1 }}>PLAY.</div>

              <div style={{ marginTop: 20 }}>
                {[["ROUND", "04 / 10"], ["SCORE", String(score.toLocaleString()).padStart(6, "0")], ["TIME", "00:12"], ["HIGH SCORE", "09,820"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    <span className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>{k}</span>
                    <span className="jb" style={{ fontSize: 18, fontWeight: 700, color: k === "SCORE" ? "var(--yellow)" : "var(--txt)", fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <Barcode val="CONSOLE-EXEC" h={16} color="var(--muted)" />
              </div>
            </div>

            {/* Right: Game Cabinet Panel */}
            <div style={{ background: "var(--void)", border: "1px solid var(--border)", padding: "20px" }}>
              <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 14, color: "var(--muted)" }}>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="led led-g pulse-g" />CABINET CONSOLE // BENCH_04</span>
                <span>DIFFICULTY: NORMAL // 60FPS</span>
              </div>

              <div className="jb" style={{ fontSize: 10, color: "var(--yellow)", letterSpacing: "0.1em", marginBottom: 6 }}>
                {cartridges[activeCart].rom} — ROUND 04 / 10
              </div>
              <div className="sg" style={{ fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--txt)", marginBottom: 14 }}>
                WHO WOULD MOST LIKELY SAY THIS?
              </div>

              <div style={{ background: "#010304", border: "1px solid var(--border)", borderLeft: "4px solid var(--green)", padding: "14px 16px", marginBottom: 16 }}>
                <div className="jb" style={{ fontSize: 12, color: "var(--txt)", lineHeight: 1.5 }}>
                  &quot;I literally told you guys not to touch the aux cord five minutes ago&quot;
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {answers.map(a => {
                  const isChosen = selectedAns === a.key;
                  const isCorrectReveal = answerState !== null && a.correct;
                  return (
                    <button key={a.key}
                      onClick={() => pickAnswer(a.key, a.correct)}
                      className={`ans-btn${isChosen && answerState === "correct" ? " correct" : isChosen && answerState === "wrong" ? " wrong" : isCorrectReveal ? " correct" : ""}`}
                      style={{ cursor: answerState ? "default" : "pointer" }}
                    >
                      <div className="jb" style={{ fontSize: 9, color: "inherit", opacity: 0.7, marginBottom: 2 }}>KEY // [{a.key}] — {a.tag}</div>
                      <div className="sg" style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{a.label}</div>
                    </button>
                  );
                })}
              </div>

              {answerState && (
                <div style={{ marginTop: 12, padding: "12px 14px", border: `1px solid ${answerState === "correct" ? "var(--green)" : "var(--red)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: `rgba(${answerState === "correct" ? "57,255,20" : "255,51,75"},0.05)` }}>
                  <div className="jb" style={{ fontSize: 11, color: answerState === "correct" ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                    {answerState === "correct" ? "✔ CORRECT // +500 PTS" : "✖ INCORRECT"}
                    <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 400, marginTop: 2 }}>PLAYER PROFILE UPDATED // ADAPTIVE WEIGHTS RECALIBRATED</div>
                  </div>
                  <button className="btn-green" onClick={nextQuestion} style={{ fontSize: 9 }}>NEXT →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          08 // MEMORY — IT LEARNS YOUR VIBE
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-mem" style={{ borderBottom: "1px solid var(--border)", padding: "52px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <SectionMark n="07 // ADAPTIVE MEMORY" label="NEURAL WEIGHT ADAPTATION" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <h2 className="section-title" style={{ color: "var(--txt)" }}>IT<br />LEARNS<br />YOUR<br /><span style={{ color: "var(--green)" }}>VIBE.</span></h2>
              <div className="jb" style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7, borderLeft: "2px solid var(--green)", paddingLeft: 12, marginTop: 16 }}>
                EVERY ANSWER TEACHES VYBZ MORE<br />
                ABOUT THE WAY YOU PLAY. WRONG<br />
                ANSWERS. BIASES. PREFERENCES.<br />
                ALL RECALIBRATE YOUR NEXT ROM.
              </div>

              {/* Adaptive flowchart */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { state: "WRONG ANSWER", color: "var(--red)", icon: "✖" },
                  null,
                  { state: "MEMORY UPDATED", color: "var(--yellow)", icon: "△" },
                  null,
                  { state: "NEXT GAME ADAPTED", color: "var(--green)", icon: "✓" },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
                      <div style={{ width: 1, height: 18, background: "var(--border)" }} />
                    </div>
                  ) : (
                    <div key={item.state} className="panel" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${item.color}` }}>
                      <span className="jb" style={{ fontSize: 14, color: item.color }}>{item.icon}</span>
                      <span className="jb" style={{ fontSize: 11, color: "var(--txt)", letterSpacing: "0.06em" }}>{item.state}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Player Profile Stats */}
            <div>
              <div style={{ background: "var(--chassis)", border: "1px solid var(--border)", padding: "16px" }}>
                <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 14, color: "var(--muted)" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="led led-g pulse-g" />PLAYER PROFILE // 01</span>
                  <span className="chip chip-g">SYNC ACTIVE</span>
                </div>

                {[
                  { l: "CHAOS AFFINITY", p: 82, c: "var(--orange)" },
                  { l: "MEMORY RECALL", p: 91, c: "var(--green)" },
                  { l: "TRIVIA ACCURACY", p: 64, c: "var(--yellow)" },
                  { l: "INSIDE JOKES", p: 100, c: "var(--cyan)" },
                ].map(s => (
                  <div key={s.l} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span className="jb" style={{ fontSize: 10, color: "var(--txt2)" }}>{s.l}</span>
                      <span className="jb" style={{ fontSize: 10, color: s.c, fontWeight: 700 }}>{s.p}%</span>
                    </div>
                    <ProgBar pct={s.p} color={s.c} />
                    <div className="jb" style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>
                      {"█".repeat(Math.round(s.p / 10))}{"░".repeat(10 - Math.round(s.p / 10))}
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <Barcode val="PLAYER-01-METRIC" h={16} color="var(--muted)" />
                  <span className="jb" style={{ fontSize: 9, color: "var(--green)" }}>CALIBRATION: RUN #041</span>
                </div>
              </div>

              {/* Memory bank compact */}
              <div style={{ background: "var(--void)", border: "1px solid var(--border)", padding: "12px 14px", marginTop: 10 }}>
                <div className="jb" style={{ fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 10 }}>MEMORY BANK // PLAYER 01</div>
                {[
                  ["PREFERENCE // 001", "LIKES CHAOTIC QUESTIONS"],
                  ["PREFERENCE // 002", "STRONG MUSIC MEMORY"],
                  ["PREFERENCE // 003", "INSIDE JOKE RECALL: HIGH"],
                  ["PATTERN // 004", "FREQUENT 2AM DEBATES"],
                  ["RELATIONSHIP // 005", "RIVALRY: ALEX VS LIAM"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline", borderBottom: "1px dotted var(--border)", paddingBottom: 5, marginBottom: 5 }}>
                    <span className="jb" style={{ fontSize: 9, color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>{k}</span>
                    <span className="jb" style={{ fontSize: 9, color: "var(--txt2)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          09 // SYSTEM STATUS
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "var(--chassis)", padding: "32px 0" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 16, color: "var(--muted)", letterSpacing: "0.1em" }}>
            <span>SYSTEM STATUS LEDGER</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><span className="led led-g pulse-g" />ALL SYSTEMS NOMINAL</span>
          </div>
          {[
            ["CHAT INGESTION ENGINE", "4ms", "12%", "ONLINE"],
            ["NEURAL HEURISTIC CORE", "283ms/BATCH", "34%", "ONLINE"],
            ["PERSISTENT MEMORY BANK", "0.2ms", "99.98% SYNC", "ONLINE"],
            ["ARCADE ROM ENGINE", "60 FPS", "STABLE", "ONLINE"],
            ["PLAYER 01 PROFILE", "CONNECTED", "LOCK #8849", "ACTIVE"],
          ].map(([n, p, l, s]) => (
            <div key={n} className="jb" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px dotted var(--border)", padding: "7px 0", fontSize: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "var(--muted)" }}>01/</span>
                <span style={{ color: "var(--txt)", fontWeight: 700, letterSpacing: "0.06em" }}>{n}</span>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <span style={{ color: "var(--muted)" }}>{p}</span>
                <span style={{ color: "var(--yellow)" }}>{l}</span>
                <span style={{ color: "var(--green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><span className="led led-g" />{s}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          10 // EDITORIAL — YOUR GROUP CHAT WAS NEVER JUST A CHAT
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: "1px solid var(--border)", minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "52px 0", overflow: "hidden", position: "relative" }}>
        {/* Tiny telemetry side strips */}
        <div className="jb" style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%) rotate(180deg)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", writingMode: "vertical-rl", textTransform: "uppercase" }}>
          MANIFESTO // EDITORIAL BREAK // SECTION 08
        </div>
        <div className="jb" style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", writingMode: "vertical-rl", textTransform: "uppercase" }}>
          AUTHORED BY YOUR FRIENDS // ARCHIVAL PREMISE
        </div>

        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 80px", width: "100%" }}>
          <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 20, textTransform: "uppercase" }}>
            ┌ 08 // MANIFESTO — MAXIMUM SCALE
          </div>

          <div style={{ lineHeight: 0.88, userSelect: "none" }}>
            <div className="hero-title" style={{ color: "var(--txt)" }}>YOUR GROUP CHAT</div>
            <div className="hero-title" style={{ color: "var(--txt2)", paddingLeft: "6vw" }}>WAS NEVER</div>
            <div className="hero-title" style={{ color: "var(--green)", paddingLeft: "2vw", textShadow: "0 0 40px rgba(57,255,20,0.2)" }}>JUST A CHAT.</div>
          </div>

          <div style={{ marginTop: 28, paddingLeft: "14vw" }}>
            <div className="sg" style={{ fontSize: "clamp(24px,4vw,56px)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--yellow)" }}>
              IT WAS A GAME WAITING TO HAPPEN.
            </div>
            <div className="jb" style={{ fontSize: 9, color: "var(--muted)", marginTop: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              [ ARCHIVAL PREMISE // AUTHORED BY YOUR FRIENDS ] ┘
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          11 // FINAL CTA — READY PLAYER?
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="section-final" style={{ borderBottom: "1px solid var(--border)", minHeight: "90vh", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0", position: "relative", overflow: "hidden" }}>
        {/* Ghost VYBZ for final */}
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", pointerEvents: "none", userSelect: "none", zIndex: 0 }}>
          <div style={{ fontFamily: "var(--sg)", fontSize: "clamp(160px,28vw,400px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.06em", textTransform: "uppercase", WebkitTextStroke: "1px rgba(57,255,20,0.07)", color: "transparent" }} aria-hidden>VYBZ</div>
        </div>

        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {/* Top small label */}
          <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            VYBZ // FINAL SYSTEM — CREDITS: [{String(coins).padStart(2, "0")}]
          </div>

          {/* Main content */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }}>
            <div>
              <h2 className="hero-title" style={{ color: "var(--txt)" }}>READY</h2>
              <h2 className="hero-title" style={{ color: "var(--green)", textShadow: "0 0 32px rgba(57,255,20,0.25)" }}>PLAYER?</h2>

              <div className="sg" style={{ fontSize: 28, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--yellow)", marginTop: 8 }}>
                YOUR CHATS ARE WAITING.
              </div>

              <div className="jb" style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7, borderLeft: "2px solid var(--green)", paddingLeft: 12, marginTop: 16, maxWidth: 440 }}>
                DROP ANY WHATSAPP, TELEGRAM, OR DISCORD<br />
                GROUP CHAT EXPORT. YOUR CUSTOM ARCADE<br />
                CARTRIDGES COMPILE IN SECONDS.<br />
                ZERO TRACKING. USER-OWNED DATA.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}>
                <button className="btn-green" style={{ fontSize: 13, padding: "14px 28px" }} onClick={() => { insertCoin(); scrollTo("section-port"); }}>
                  INSERT COIN →
                  <span style={{ background: "#000", color: "var(--green)", fontSize: 9, padding: "2px 6px" }}>
                    [{String(coins).padStart(2, "0")}]
                  </span>
                </button>
                <button className="btn-outline" style={{ fontSize: 11, padding: "14px 22px" }} onClick={() => scrollTo("section-play")}>
                  START PLAYING →
                </button>
              </div>
            </div>

            {/* Final CRT Module */}
            <div>
              <div style={{ background: "var(--chassis)", border: "1px solid var(--border)", boxShadow: "6px 6px 0 #000" }}>
                <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                  <span>⊕ COIN_MOD // 99</span>
                  <span>CHASSIS_FINAL ⊕</span>
                </div>
                <div className="crt" style={{ margin: 8, padding: "20px 16px", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div className="jb" style={{ fontSize: 9, display: "flex", justifyContent: "space-between", color: "var(--muted)", borderBottom: "1px solid rgba(57,255,20,0.15)", paddingBottom: 5 }}>
                    <span>PLAYER 01</span>
                    <span style={{ color: "var(--green)" }}>● READY</span>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 6 }}>ALL-TIME RECORD</div>
                    <div className="score-num" style={{ fontSize: 42 }}>999,999</div>
                    <div className="jb" style={{ fontSize: 10, color: "var(--green)", letterSpacing: "0.1em", marginTop: 8 }}>GAME READY TO LAUNCH</div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(57,255,20,0.15)", paddingTop: 5, display: "flex", justifyContent: "space-between" }}>
                    <Barcode val="CREDIT-READY" h={14} color="var(--green)" />
                    <span className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>INSERT 1 TOKEN</span>
                  </div>
                </div>
                <div className="jb" style={{ fontSize: 8, display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
                  <span>⊕ GND</span>
                  <span style={{ color: "var(--green)" }}>HIGH VOLTAGE PHOSPHOR</span>
                  <span>⊕ PWR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom ticker / telemetry scroll */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div className="marquee-wrap">
              <div className="marquee-inner jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", gap: 32, display: "flex" }}>
                {Array.from({ length: 2 }).flatMap((_, n) =>
                  ["VYBZ // ARCADE SYSTEM", "INSERT COIN", "PLAY. LEARN. REPEAT.", "ROM CARTRIDGE SYSTEM", "AI HEURISTIC ENGINE", "PHOSPHOR ARCADE BRUTALISM", "MEMORY BANK ACTIVE", "ZERO TRACKING", "PLAYER 01 ONLINE"].map((t, i) => (
                    <span key={`${n}-${i}-${t}`} style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
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
      <footer style={{ background: "#07080A", borderTop: "2px solid var(--border)", padding: "32px 0 20px" }}>
        <div style={{ maxWidth: 1540, margin: "0 auto", padding: "0 24px" }}>
          {/* Corner marks */}
          <div className="jb" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 10, marginBottom: 20 }}>
            <span>┌ HARDWARE CHASSIS // 2026</span>
            <span>COORD: 37.7749° N, 122.4194° W ┐</span>
          </div>

          {/* Massive wordmark */}
          <div className="sg" style={{ fontSize: "clamp(60px,13vw,180px)", fontWeight: 700, letterSpacing: "-0.05em", textTransform: "uppercase", lineHeight: 0.9, color: "rgba(243,241,236,0.88)", userSelect: "none" }}>
            VYBZ
          </div>
          <div className="jb" style={{ fontSize: 9, color: "var(--green)", letterSpacing: "0.14em", marginTop: 4, textTransform: "uppercase" }}>
            [ AI-POWERED SOCIAL GAMING HARDWARE // TURN CHATS INTO GAMES ]
          </div>

          {/* Footer nav grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginTop: 28, marginBottom: 24 }}>
            {[
              ["NAVIGATION", ["INPUT", "DATA PORT", "AI CORE", "ROM SHELF", "LIVE PLAY", "MEMORY"]],
              ["GAME MODES", ["WHO SAID IT?", "MEMORY BANK", "FRIENDSHIP QUIZ", "HOT TAKE MACHINE", "CHAOS MODE"]],
              ["PRIVACY", ["CLIENT-SIDE PARSE", "ZERO CLOUD EXPORT", "USER-OWNED DATA", "NO LLM TRAINING", "AES-256 LOCAL"]],
              ["SYSTEM", ["BUILD: 01.04", "ENGINE: ACTIVE", "ROM BUS: 16-BIT", "FREQ: 60Hz", "CHASSIS: OK"]],
            ].map(([title, items]) => (
              <div key={title as string}>
                <div className="jb" style={{ fontSize: 9, color: "var(--muted)", borderBottom: "1px solid var(--border)", paddingBottom: 4, marginBottom: 10, letterSpacing: "0.12em" }}>{title}</div>
                {(items as string[]).map(item => (
                  <div key={item} className="jb" style={{ fontSize: 10, color: "var(--txt2)", lineHeight: 2.0 }}>
                    <span style={{ color: "var(--muted)" }}>&gt;</span> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Receipt copyright strip */}
          <div style={{ background: "#F3F1EC", color: "#0A0B0D", fontFamily: "var(--jb)", fontSize: 9, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700 }}>*** HARDWARE DISPATCH RECEIPT *** // SYSTEM BUILD 2026.04</span>
            <span>© 2026 VYBZ LABS. ALL RIGHTS RESERVED. ZERO GAUSSIAN BLUR PERMITTED.</span>
          </div>

          <div className="jb" style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span>└ CHASSIS GROUNDED // 0V</span>
            <span>PHOSPHOR ARCADE BRUTALISM ┘</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

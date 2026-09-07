"use client";

import React, { useState } from "react";
import { sound } from "../ui/SoundSystem";
import { Barcode } from "../ui/Barcode";
import { CartridgeItem } from "./Section06ArcadeShelf";

interface Section07GameplayProps {
  activeCartridge?: CartridgeItem;
  onUpdateScore?: (newScore: number) => void;
}

interface QuestionData {
  round: string;
  category: string;
  prompt: string;
  quote: string;
  correctAnswer: string;
  options: { key: string; label: string; tag: string }[];
}

const QUESTIONS: QuestionData[] = [
  {
    round: "ROUND 04 / 10",
    category: "ROM // 001: WHO SAID IT?",
    prompt: "WHO WOULD MOST LIKELY SAY THIS?",
    quote: '"I literally told you guys not to touch the aux cord five minutes ago"',
    correctAnswer: "A",
    options: [
      { key: "A", label: "Alex", tag: "THE AUX TYRANT // 14-MIN TRACKS" },
      { key: "B", label: "Maya", tag: "HISTORIAN // SCREENSHOT KEEPER" },
      { key: "C", label: "Sam", tag: "3AM VOICE NOTE PHILOSOPHER" },
      { key: "D", label: "Liam", tag: "CHRONIC DISAGREER" },
    ],
  },
  {
    round: "ROUND 05 / 10",
    category: "ROM // 002: MEMORY BANK",
    prompt: "WHICH EVENT HAPPENED FIRST IN CHAT HISTORY?",
    quote: '"The 48-hour argument over whether a hot dog is a sandwich"',
    correctAnswer: "B",
    options: [
      { key: "A", label: "The Paris Flight Cancellation Meltdown", tag: "OCTOBER 2023" },
      { key: "B", label: "The Hot Dog Philosophical War", tag: "JUNE 2023" },
      { key: "C", label: "Liam Leaving The Group Chat In Protest", tag: "DECEMBER 2023" },
      { key: "D", label: "Accidental Accidental Group FaceTime Call", tag: "MARCH 2024" },
    ],
  },
];

export const Section07Gameplay: React.FC<Section07GameplayProps> = ({
  activeCartridge,
}) => {
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(8420);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<"IDLE" | "CORRECT" | "INCORRECT">("IDLE");
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const currentQ = QUESTIONS[questionIdx % QUESTIONS.length];

  const handleSelectAnswer = (key: string) => {
    if (answerState !== "IDLE") return;

    setSelectedOption(key);

    if (key === currentQ.correctAnswer) {
      sound.playSuccess();
      setAnswerState("CORRECT");
      setScore((prev) => prev + 500);
    } else {
      sound.playError();
      setAnswerState("INCORRECT");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    setSelectedOption(null);
    setAnswerState("IDLE");
    setQuestionIdx((prev) => prev + 1);
  };

  return (
    <section
      id="section-gameplay"
      className="relative py-28 px-4 md:px-10 border-b border-[#22252B] bg-[#0E0F12]"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header Marker */}
        <div className="flex items-center justify-between font-mono text-xs text-[#7E828C] mb-8 border-b border-[#22252B] pb-4">
          <div className="flex items-center gap-3">
            <span className="badge-phosphor">06 // LIVE GAME BENCH</span>
            <span>ACTIVE: {activeCartridge ? activeCartridge.title : "ROM // 001"}</span>
            <span className="text-[#39FF14]">● TEST ENGINE MOUNTED</span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[#FFD000]">{currentQ.round}</span>
            <span className="text-[#F3F1EC] font-bold tabular-numbers">
              SCORE: {score.toLocaleString().padStart(6, "0")}
            </span>
          </div>
        </div>

        {/* Arcade Cabinet Control Panel Container */}
        <div
          className={`max-w-4xl mx-auto bg-[#111216] border transition-all duration-150 p-6 md:p-10 shadow-hard-lg relative ${
            isShaking ? "translate-x-2 border-[#FF334B]" : "border-[#22252B]"
          }`}
        >
          {/* Hardware Header Strip */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#22252B] font-mono text-xs text-[#7E828C]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#39FF14]" />
              <span className="font-bold text-[#F3F1EC]">CABINET CONSOLE // BENCH_04</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span>DIFFICULTY: NORMAL</span>
              <span className="text-[#39FF14]">ARCADE CLOCK: 60FPS</span>
            </div>
          </div>

          {/* QUESTION PROMPT (Dominates the Interface) */}
          <div className="mb-8">
            <div className="font-mono text-xs text-[#FFD000] tracking-widest uppercase mb-2">
              {currentQ.category} — {currentQ.round}
            </div>

            <h2 className="type-headline-lg text-[#F3F1EC] uppercase mb-4">
              {currentQ.prompt}
            </h2>

            {/* Brutalist Quote Display Box */}
            <div className="p-6 bg-[#0A0B0D] border-l-4 border-[#39FF14] text-base md:text-lg font-mono text-[#F3F1EC] italic leading-relaxed">
              {currentQ.quote}
            </div>
          </div>

          {/* 4 Square Answer Modules (No Rounded SaaS Buttons) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {currentQ.options.map((opt) => {
              const isChosen = selectedOption === opt.key;
              const isCorrectOpt = opt.key === currentQ.correctAnswer;

              let btnStyle = "bg-[#16181D] border-[#22252B] hover:border-[#39FF14] text-[#F3F1EC]";

              if (answerState === "CORRECT" && isChosen) {
                btnStyle = "bg-[#39FF14] border-[#39FF14] text-[#0A0B0D] shadow-hard-phosphor font-bold";
              } else if (answerState === "INCORRECT" && isChosen) {
                btnStyle = "bg-[#FF334B] border-[#FF334B] text-[#0A0B0D] shadow-hard font-bold";
              } else if (answerState !== "IDLE" && isCorrectOpt) {
                btnStyle = "bg-[#16181D] border-[#39FF14] text-[#39FF14]";
              }

              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectAnswer(opt.key)}
                  className={`p-5 border text-left font-mono transition-all duration-100 flex flex-col justify-between min-h-[90px] shadow-hard cursor-pointer ${btnStyle}`}
                  data-cursor="ANSWER"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold opacity-80">KEY // [{opt.key}]</span>
                    <span className="text-[9px] opacity-60 uppercase">{opt.tag}</span>
                  </div>
                  <div className="font-display text-lg font-bold uppercase tracking-tight">
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback & State Telemetry */}
          {answerState !== "IDLE" && (
            <div
              className={`p-4 border font-mono text-xs flex flex-wrap items-center justify-between gap-4 mb-6 ${
                answerState === "CORRECT"
                  ? "bg-[#111216] border-[#39FF14] text-[#39FF14]"
                  : "bg-[#111216] border-[#FF334B] text-[#FF334B]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{answerState === "CORRECT" ? "✔" : "✖"}</span>
                <div>
                  <div className="font-bold tracking-wider">
                    {answerState === "CORRECT" ? "CORRECT ANSWER // +500 PTS" : "INCORRECT ANSWER"}
                  </div>
                  <div className="text-[10px] text-[#7E828C] mt-0.5">
                    PLAYER PROFILE UPDATED // ADAPTIVE WEIGHTS RECALIBRATED.
                  </div>
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className="btn-phosphor px-5 py-2 text-xs font-bold tracking-widest text-[#0A0B0D]"
                data-cursor="NEXT"
              >
                NEXT QUESTION →
              </button>
            </div>
          )}

          {/* Cabinet Bottom Diagnostics */}
          <div className="pt-4 border-t border-[#22252B] flex items-center justify-between font-mono text-[9px] text-[#7E828C]">
            <div className="flex items-center gap-3">
              <span>CONTROLLER: KEYBOARD / CLICK</span>
              <span>INPUT DELAY: 0.2ms</span>
            </div>
            <Barcode value="CONSOLE-EXEC" height={14} showText={false} color="#7E828C" />
          </div>
        </div>
      </div>
    </section>
  );
};

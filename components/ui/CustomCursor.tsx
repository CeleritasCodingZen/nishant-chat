"use client";

import React, { useEffect, useState, useRef } from "react";

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState({ x: -100, y: -100 });
  const [label, setLabel] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Only show on fine pointer devices (desktop)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      if (cursorTarget) {
        setLabel(cursorTarget.getAttribute("data-cursor"));
        setIsHovered(true);
      } else if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        setLabel("TARGET");
        setIsHovered(true);
      } else {
        setLabel(null);
        setIsHovered(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Smooth lerp cursor animation
    let currentX = -100;
    let currentY = -100;

    const updateLoop = () => {
      currentX += (targetPos.x - currentX) * 0.35;
      currentY += (targetPos.y - currentY) * 0.35;
      setPos({ x: currentX, y: currentY });
      rafRef.current = requestAnimationFrame(updateLoop);
    };

    rafRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetPos, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[99999] transition-opacity duration-150"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Central Phosphor Square Dot */}
      <div
        className={`w-2 h-2 bg-[#39FF14] transition-transform duration-75 ${
          isClicking ? "scale-50 bg-[#00E5FF]" : isHovered ? "scale-125" : "scale-100"
        }`}
      />

      {/* Target Crosshair Box */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#39FF14]/50 transition-all duration-150 ${
          isHovered
            ? "w-10 h-10 border-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.5)]"
            : "w-6 h-6 border-[#39FF14]/40"
        }`}
      >
        {/* Corner registration notches */}
        <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-[#39FF14]" />
        <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t border-r border-[#39FF14]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b border-l border-[#39FF14]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r border-[#39FF14]" />
      </div>

      {/* Context Badge Label */}
      {label && (
        <div className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#111216] border border-[#39FF14] px-1.5 py-0.5 text-[9px] font-mono tracking-widest text-[#39FF14] shadow-[2px_2px_0px_#000000]">
          [{label}]
        </div>
      )}
    </div>
  );
};

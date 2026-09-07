"use client";

import React from "react";

export const CrtOverlay: React.FC = () => {
  return (
    <>
      {/* Subtle Scanlines & Screen Vignette */}
      <div className="crt-scanlines pointer-events-none" />
      <div className="crt-vignette pointer-events-none" />

      {/* Screen Boundary Registration Marks */}
      <div className="fixed top-2 left-2 z-[9990] pointer-events-none font-mono text-[9px] text-[#7E828C]/60 flex items-center gap-1 select-none">
        <span className="text-[#39FF14]">┌</span> COORD: 00.00
      </div>
      <div className="fixed top-2 right-2 z-[9990] pointer-events-none font-mono text-[9px] text-[#7E828C]/60 flex items-center gap-1 select-none">
        FREQ: 60Hz <span className="text-[#39FF14]">┐</span>
      </div>
      <div className="fixed bottom-2 left-2 z-[9990] pointer-events-none font-mono text-[9px] text-[#7E828C]/60 flex items-center gap-1 select-none">
        <span className="text-[#39FF14]">└</span> TERMINAL: CHASSIS_01
      </div>
      <div className="fixed bottom-2 right-2 z-[9990] pointer-events-none font-mono text-[9px] text-[#7E828C]/60 flex items-center gap-1 select-none">
        PHOSPHOR: ACTIVE <span className="text-[#39FF14]">┘</span>
      </div>
    </>
  );
};

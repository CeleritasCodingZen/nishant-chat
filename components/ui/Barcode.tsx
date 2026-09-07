"use client";

import React from "react";

export interface BarcodeProps {
  value?: string;
  val?: string;
  className?: string;
  height?: number;
  h?: number;
  showText?: boolean;
  color?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  val,
  className = "",
  height,
  h,
  showText = false,
  color = "currentColor",
}) => {
  const actualValue = val || value || "VYBZ-8849-01";
  const actualHeight = h || height || 18;

  // Generate deterministic pseudo bar patterns based on string chars
  const bars = React.useMemo(() => {
    const pattern: number[] = [];
    for (let i = 0; i < actualValue.length; i++) {
      const code = actualValue.charCodeAt(i);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 1) % 2) + 1);
      pattern.push(((code >> 2) % 3) + 1);
      pattern.push(1); // space
    }
    return pattern;
  }, [actualValue]);

  const totalWidth = bars.reduce((acc, w) => acc + w, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={actualHeight}
        viewBox={`0 0 ${totalWidth} ${actualHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block flex-shrink-0"
      >
        {bars.map((width, idx) => {
          const x = currentX;
          currentX += width;
          // Every 4th item is a blank separator gap
          if (idx % 4 === 3) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={Math.max(0.5, width - 0.2)}
              height={actualHeight}
              fill={color}
            />
          );
        })}
      </svg>
      {showText && (
        <span
          className="font-mono text-[8px] tracking-[0.16em] uppercase mt-1 opacity-80"
          style={{ color }}
        >
          {actualValue}
        </span>
      )}
    </div>
  );
};

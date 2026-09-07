"use client";

import React from "react";

interface BarcodeProps {
  value?: string;
  className?: string;
  height?: number;
  showText?: boolean;
  color?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value = "VYBZ-8849-01",
  className = "",
  height = 24,
  showText = true,
  color = "currentColor",
}) => {
  // Generate deterministic pseudo bar patterns based on string chars
  const bars = React.useMemo(() => {
    const pattern: number[] = [];
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 1) % 2) + 1);
      pattern.push(((code >> 2) % 3) + 1);
      pattern.push(1); // space
    }
    return pattern;
  }, [value]);

  const totalWidth = bars.reduce((acc, w) => acc + w, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
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
              width={width - 0.2}
              height={height}
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
          {value}
        </span>
      )}
    </div>
  );
};

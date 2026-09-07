"use client";

import React, { useEffect, useState, useRef } from "react";

interface ScrambleTextProps {
  text: string;
  className?: string;
  triggerOnMount?: boolean;
  speed?: number;
  characters?: string;
}

const DEFAULT_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>[]_";

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = "",
  triggerOnMount = true,
  speed = 35,
  characters = DEFAULT_CHARS,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const animatingRef = useRef(false);

  const scramble = () => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    let iteration = 0;
    const maxIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((letter, index) => {
            if (letter === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        animatingRef.current = false;
        setDisplayText(text);
      }

      iteration += 1 / 2;
    }, speed);
  };

  useEffect(() => {
    if (triggerOnMount) {
      scramble();
    }
  }, [text, triggerOnMount]);

  return (
    <span
      className={`font-mono inline-block ${className}`}
      onMouseEnter={scramble}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {displayText}
    </span>
  );
};

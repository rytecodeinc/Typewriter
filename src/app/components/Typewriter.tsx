import { motion } from "motion/react";
import { useEffect, useRef } from "react";

interface TypewriterProps {
  carriageOffset: number;
  paperOffset: number;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onReturn: () => void;
  inkColor: string;
  onInkColorChange: (color: string) => void;
  currentText: string;
  paperScrollOffset: number;
  onSendNote: () => void;
}

const CHAR_WIDTH = 12; // Fixed character width in pixels
const LINE_HEIGHT = 24; // Fixed line height in pixels
const CHARS_PER_LINE = 52; // Characters per line

export function Typewriter({
  carriageOffset,
  paperOffset,
  onKeyPress,
  onBackspace,
  onReturn,
  inkColor,
  onInkColorChange,
  currentText,
  paperScrollOffset,
  onSendNote,
}: TypewriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for keys we handle
      if (
        e.key.length === 1 ||
        e.key === "Backspace" ||
        e.key === "Enter"
      ) {
        e.preventDefault();
      }

      if (e.key === "Backspace") {
        onBackspace();
      } else if (e.key === "Enter") {
        onReturn();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        onKeyPress(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress, onBackspace, onReturn]);

  // Keep in sync with `App.tsx` to ensure typed lines never exceed the paper.
  const PAPER_WIDTH = 450;
  const PAPER_SIDE_PADDING = 45;
  const PAPER_TOP_PADDING = 60;
  const PAPER_BOTTOM_PADDING = 60;
  const PAPER_CONTENT_WIDTH = PAPER_WIDTH - PAPER_SIDE_PADDING * 2; // 360px
  const LINE_HEIGHT = 24;

  const BASE_WIDTH = 920;
  const BASE_HEIGHT = 320;
  // Where the paper visually "emerges" from the base.
  const PAPER_ANCHOR_FROM_BOTTOM = BASE_HEIGHT - 80;

  // Calculate text lines with colors
  const lines: Array<{ text: string; color: string }[]> = [];
  let currentLine: Array<{ text: string; color: string }> = [];
  let currentColor = "black";
  
  for (let i = 0; i < currentText.length; i++) {
    const char = currentText[i];
    
    // Check for color markers
    if (char === "§" && currentText[i + 1] === "r") {
      currentColor = "#dc2626"; // red
      i++; // Skip next char
      continue;
    } else if (char === "§" && currentText[i + 1] === "b") {
      currentColor = "black";
      i++; // Skip next char
      continue;
    }
    
    if (char === "\n") {
      lines.push(currentLine);
      currentLine = [];
    } else {
      currentLine.push({ text: char, color: currentColor });
    }
  }
  lines.push(currentLine); // Add the last line

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 flex justify-center"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative w-[min(1100px,calc(100vw-2rem))]"
        style={{ height: "680px" }}
      >
      {/* Paper Layer - Moves both horizontally with carriage and vertically */}
      <motion.div
        className="absolute"
        style={{
          zIndex: 2,
          left: "50%",
          bottom: `${PAPER_ANCHOR_FROM_BOTTOM}px`,
        }}
        animate={{
          x: carriageOffset,
          y: paperOffset - paperScrollOffset,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <div
          className="bg-[#faf9f6] shadow-2xl relative"
          style={{
            width: `${PAPER_WIDTH}px`,
            minHeight: "720px",
            padding: `${PAPER_TOP_PADDING}px ${PAPER_SIDE_PADDING}px ${PAPER_BOTTOM_PADDING}px`,
            transform: "translateX(-50%)",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Ink ribbon selector - top left of paper */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-600">ink ribbon:</span>
            <button
              onClick={() => onInkColorChange("black")}
              className={`px-3 py-1 rounded transition-all text-xs ${
                inkColor === "black"
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              black
            </button>
            <button
              onClick={() => onInkColorChange("red")}
              className={`px-3 py-1 rounded transition-all text-xs ${
                inkColor === "red"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              red
            </button>
          </div>

          {/* Paper texture effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 23px, #f0f0f0 23px, #f0f0f0 24px)",
            }}
          />

          {/* Paper content */}
          <div
            className="font-mono text-base relative"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              // Avoid extra letter spacing; it causes lines to exceed the sheet width.
              letterSpacing: "0em",
              width: `${PAPER_CONTENT_WIDTH}px`,
              maxWidth: `${PAPER_CONTENT_WIDTH}px`,
              overflow: "hidden",
            }}
          >
            {lines.map((line, lineIdx) => (
              <div 
                key={lineIdx} 
                style={{ 
                  height: `${LINE_HEIGHT}px`,
                  minHeight: `${LINE_HEIGHT}px`,
                  whiteSpace: "pre",
                }}
              >
                {line.length === 0 ? (
                  // Empty line - render a space to maintain height
                  <span style={{ opacity: 0 }}>&nbsp;</span>
                ) : (
                  line.map((char, charIdx) => (
                    <span 
                      key={charIdx} 
                      style={{ 
                        color: char.color,
                        display: "inline",
                        whiteSpace: "pre",
                      }}
                    >
                      {char.text}
                    </span>
                  ))
                )}
              </div>
            ))}
          </div>

          {/* Send button */}
          {currentText.trim().length > 0 && (
            <button
              onClick={onSendNote}
              className="absolute bottom-6 right-6 px-5 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors font-mono shadow-lg"
              style={{ zIndex: 10 }}
            >
              send →
            </button>
          )}
        </div>
      </motion.div>

      {/* Base Layer - Static typewriter base */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          // Base overlays the bottom of the sheet to make the paper feel "inside".
          zIndex: 4,
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
        }}
      >
        {/* Hand-drawn typewriter base */}
        <svg
          width={BASE_WIDTH}
          height={BASE_HEIGHT}
          viewBox="0 0 800 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Main typewriter body */}
          <path
            d="M 50 120 L 50 260 L 750 260 L 750 120 C 750 100 740 90 720 90 L 80 90 C 60 90 50 100 50 120 Z"
            fill="#3a3a3a"
            stroke="#2a2a2a"
            strokeWidth="2"
          />
          
          {/* Top curved section */}
          <ellipse cx="400" cy="100" rx="280" ry="35" fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="2" />
          
          {/* Paper slot */}
          <rect x="250" y="60" width="300" height="8" fill="#1a1a1a" rx="2" />
          
          {/* Keyboard keys grid */}
          {Array.from({ length: 48 }).map((_, i) => {
            const row = Math.floor(i / 12);
            const col = i % 12;
            const x = 120 + col * 50;
            const y = 140 + row * 28;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width="38"
                  height="22"
                  rx="3"
                  fill="#f5f5f5"
                  stroke="#d0d0d0"
                  strokeWidth="1"
                />
                <rect
                  x={x + 2}
                  y={y + 2}
                  width="34"
                  height="18"
                  rx="2"
                  fill="#ffffff"
                  stroke="#e0e0e0"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}
          
          {/* Space bar */}
          <rect x="250" y="252" width="300" height="22" rx="3" fill="#f5f5f5" stroke="#d0d0d0" strokeWidth="1" />
          <rect x="252" y="254" width="296" height="18" rx="2" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
          
          {/* Side details */}
          <circle cx="80" cy="180" r="12" fill="#2a2a2a" />
          <circle cx="720" cy="180" r="12" fill="#2a2a2a" />
        </svg>
        
        {/* Instructions text on typewriter base */}
        <div className="absolute top-[128px] left-1/2 -translate-x-1/2 text-center text-sm text-gray-300 font-mono">
          <p>Type on your keyboard to create notes for the creator</p>
        </div>
      </div>
      </div>
    </div>
  );
}
import { motion } from "motion/react";

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}

interface NotesWallProps {
  notes: Note[];
}

export function NotesWall({ notes }: NotesWallProps) {
  // Parse note content to render with colors
  const parseNoteContent = (content: string) => {
    const lines: Array<{ text: string; color: string }[]> = [];
    let currentLine: Array<{ text: string; color: string }> = [];
    let currentColor = "black";

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // Check for color markers
      if (char === "§" && content[i + 1] === "r") {
        currentColor = "#dc2626"; // red
        i++; // Skip next char
        continue;
      } else if (char === "§" && content[i + 1] === "b") {
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
    lines.push(currentLine);
    return lines;
  };

  return (
    <div className="fixed top-16 left-16 max-w-[650px] max-h-[calc(100vh-160px)] overflow-y-auto pr-4 pb-8">
      {/* Custom scrollbar styling */}
      <style>{`
        .notes-wall::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
      
      <div className="grid grid-cols-2 gap-8 notes-wall">
        {notes.map((note, index) => {
          const lines = parseNoteContent(note.content);
          const rotation = (index % 5) * 1.5 - 3;
          
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 180,
                damping: 18,
              }}
              className="bg-[#faf9f6] shadow-xl p-8 relative group hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-default"
              style={{
                aspectRatio: "4/5",
                transform: `rotate(${rotation}deg)`,
                border: "1px solid #e0e0e0",
              }}
            >
              {/* Paper texture */}
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 19px, #f5f5f5 19px, #f5f5f5 20px)",
                }}
              />

              <div
                className="font-mono text-sm overflow-hidden relative"
                style={{
                  lineHeight: "1.6",
                  letterSpacing: "0.03em",
                  maxHeight: "100%",
                }}
              >
                {lines.slice(0, 14).map((line, lineIdx) => (
                  <div 
                    key={lineIdx} 
                    className="whitespace-pre-wrap break-words"
                    style={{
                      minHeight: '1.6em',
                      display: 'block',
                    }}
                  >
                    {line.length === 0 ? (
                      <span style={{ opacity: 0 }}>&nbsp;</span>
                    ) : (
                      line.map((char, charIdx) => (
                        <span key={charIdx} style={{ color: char.color }}>
                          {char.text}
                        </span>
                      ))
                    )}
                  </div>
                ))}
                {lines.length > 14 && (
                  <div className="text-gray-400 italic text-xs mt-2">
                    ...
                  </div>
                )}
              </div>

              {/* Pin effect with shadow */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg" />
                <div className="w-2 h-2 rounded-full bg-gray-300 absolute top-1 left-1" />
              </div>

              {/* Date stamp */}
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
                {new Date(note.timestamp).toLocaleDateString()}
              </div>
            </motion.div>
          );
        })}
      </div>

      {notes.length === 0 && (
        <div className="text-gray-500 text-sm italic font-mono mt-4">
          notes will appear here after you type and send them...
        </div>
      )}
    </div>
  );
}
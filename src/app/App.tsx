import { useState, useEffect, useRef } from "react";
import { Typewriter } from "./components/Typewriter";
import { NotesWall, Note } from "./components/NotesWall";
import { SoundEngine } from "./components/SoundEngine";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const CHAR_WIDTH = 12;
const LINE_HEIGHT = 24;
// Keep this in sync with the paper's usable text width.
// Paper padding is 45px on each side of a 450px sheet => ~360px usable.
const CHARS_PER_LINE = 30; // 360px / 12px per char
const INITIAL_CARRIAGE_OFFSET = 100; // Start slightly to the right
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-798a08af`;

export default function App() {
  const [currentText, setCurrentText] = useState("");
  const [carriageOffset, setCarriageOffset] = useState(INITIAL_CARRIAGE_OFFSET);
  const [paperOffset, setPaperOffset] = useState(0);
  const [paperScrollOffset, setPaperScrollOffset] = useState(0);
  const [currentLineLength, setCurrentLineLength] = useState(0);
  const [currentLineNumber, setCurrentLineNumber] = useState(0);
  const [inkColor, setInkColor] = useState("black");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNewSheet, setIsNewSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Initialize sound engine
  useEffect(() => {
    soundEngineRef.current = new SoundEngine();
  }, []);

  // Load notes from Supabase
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes from server:", error);
      // Fallback to localStorage
      const savedNotes = localStorage.getItem("typewriter-notes");
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle paper scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      isScrollingRef.current = true;

      setPaperScrollOffset((prev) => {
        const newOffset = prev + e.deltaY * 0.5;
        // Limit scrolling range
        return Math.max(-500, Math.min(500, newOffset));
      });

      // Reset scroll position after user stops scrolling
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Snap paper back when typing resumes
  useEffect(() => {
    if (!isScrollingRef.current && paperScrollOffset !== 0) {
      setPaperScrollOffset(0);
    }
  }, [currentText, paperScrollOffset]);

  const handleKeyPress = (key: string) => {
    // Auto-scroll back to current position
    if (isScrollingRef.current) {
      setPaperScrollOffset(0);
      isScrollingRef.current = false;
    }

    // Check if we're at the end of the line
    if (currentLineLength >= CHARS_PER_LINE) {
      // Auto-advance to next line
      handleReturn();
    }

    // Add color marker if ink color changed
    let textToAdd = key;
    if (inkColor === "red") {
      // Check if we need to add a color marker
      const lastColorMarker = currentText.lastIndexOf("§");
      if (lastColorMarker === -1 || currentText[lastColorMarker + 1] !== "r") {
        textToAdd = "§r" + key;
      }
    } else {
      // Check if we need to switch back to black
      const lastColorMarker = currentText.lastIndexOf("§");
      if (lastColorMarker !== -1 && currentText[lastColorMarker + 1] === "r") {
        // We were in red, switch back to black
        textToAdd = "§b" + key;
      }
    }

    setCurrentText((prev) => prev + textToAdd);
    setCarriageOffset((prev) => prev - CHAR_WIDTH);
    setCurrentLineLength((prev) => prev + 1);

    // Play sound
    soundEngineRef.current?.playKeyPress();
  };

  const handleBackspace = () => {
    if (currentText.length === 0) return;

    // Auto-scroll back to current position
    if (isScrollingRef.current) {
      setPaperScrollOffset(0);
      isScrollingRef.current = false;
    }

    setCurrentText((prev) => {
      // Check if we're removing a color marker
      if (prev.endsWith("§r") || prev.endsWith("§b")) {
        return prev.slice(0, -2);
      }
      
      const lastChar = prev[prev.length - 1];
      if (lastChar === "\n") {
        // Moving back to previous line
        setCurrentLineNumber((n) => Math.max(0, n - 1));
        // Recalculate line length
        const lines = prev.slice(0, -1).split("\n");
        const prevLine = lines[lines.length - 1] || "";
        setCurrentLineLength(prevLine.replace(/§[rb]/g, "").length);
        setCarriageOffset(INITIAL_CARRIAGE_OFFSET - prevLine.replace(/§[rb]/g, "").length * CHAR_WIDTH);
        setPaperOffset((o) => Math.max(0, o - LINE_HEIGHT));
      } else {
        setCarriageOffset((prev) => prev + CHAR_WIDTH);
        setCurrentLineLength((l) => Math.max(0, l - 1));
      }
      return prev.slice(0, -1);
    });

    soundEngineRef.current?.playKeyPress();
  };

  const handleReturn = () => {
    // Auto-scroll back to current position
    if (isScrollingRef.current) {
      setPaperScrollOffset(0);
      isScrollingRef.current = false;
    }

    setCurrentText((prev) => prev + "\n");
    setCarriageOffset(INITIAL_CARRIAGE_OFFSET);
    setPaperOffset((prev) => prev + LINE_HEIGHT);
    setCurrentLineLength(0);
    setCurrentLineNumber((n) => n + 1);

    // Play carriage return sound
    soundEngineRef.current?.playCarriageReturn();
  };

  const handleInkColorChange = (color: string) => {
    setInkColor(color);
  };

  const handleSendNote = async () => {
    if (currentText.trim().length === 0) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentText,
      timestamp: Date.now(),
    };

    // Optimistically add to UI
    setNotes((prevNotes) => [newNote, ...prevNotes]);

    // Save to backend
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ content: currentText }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      // Also save to localStorage as backup
      const updatedNotes = [newNote, ...notes];
      localStorage.setItem("typewriter-notes", JSON.stringify(updatedNotes));
      
      // Refresh notes from server to get all notes
      fetchNotes();
    } catch (error) {
      console.error("Error saving note to server:", error);
      // Keep the optimistic update and save to localStorage
      const updatedNotes = [newNote, ...notes];
      localStorage.setItem("typewriter-notes", JSON.stringify(updatedNotes));
    }

    // Trigger new sheet animation
    setIsNewSheet(true);
    
    // Reset typewriter with slight delay for animation
    setTimeout(() => {
      setCurrentText("");
      setCarriageOffset(INITIAL_CARRIAGE_OFFSET);
      setPaperOffset(0);
      setPaperScrollOffset(0);
      setCurrentLineLength(0);
      setCurrentLineNumber(0);
      setIsNewSheet(false);
    }, 300);
  };

  return (
    <div className="w-screen h-screen bg-[#e8e6e1] overflow-hidden relative">
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="text-gray-600 font-mono">Loading typewriter...</div>
        </div>
      ) : (
        <>
          {/* Notes Wall */}
          <NotesWall notes={notes} />

          {/* Typewriter */}
          <Typewriter
            carriageOffset={carriageOffset}
            paperOffset={paperOffset}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onReturn={handleReturn}
            inkColor={inkColor}
            onInkColorChange={handleInkColorChange}
            currentText={currentText}
            paperScrollOffset={paperScrollOffset}
            onSendNote={handleSendNote}
          />

          {/* Scroll hint */}
          <div className="fixed bottom-4 right-4 text-xs text-gray-500 font-mono">
            Scroll to read • Enter for new line
          </div>
        </>
      )}
    </div>
  );
}
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = ["точно", "надёжно", "по стандартам", "в срок"];

// Find the longest word for the invisible sizer
const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b));

export default function RotatingText() {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  // Delay start so Hero entrance animation finishes
  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [started]);

  return (
    <span className="relative inline-block">
      {/* Invisible sizer to prevent layout shift */}
      <span className="invisible">{longestWord}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-gradient absolute inset-0 flex left-0 justify-start"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

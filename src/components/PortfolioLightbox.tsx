"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import type { Project } from "./Portfolio";

interface PortfolioLightboxProps {
  projects: Project[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PortfolioLightbox({
  projects,
  currentIndex,
  onClose,
  onNavigate,
}: PortfolioLightboxProps) {
  const isOpen = currentIndex !== null;

  const goNext = useCallback(() => {
    if (currentIndex === null) return;
    onNavigate((currentIndex + 1) % projects.length);
  }, [currentIndex, projects.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex === null) return;
    onNavigate((currentIndex - 1 + projects.length) % projects.length);
  }, [currentIndex, projects.length, onNavigate]);

  // Body scroll lock + keyboard nav
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, goNext, goPrev]);

  const project = currentIndex !== null ? projects[currentIndex] : null;

  return (
    <AnimatePresence>
      {isOpen && project && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-4xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Project image with swipe support */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) goNext();
                  else if (info.offset.x > 80) goPrev();
                }}
                className="rounded-2xl overflow-hidden"
              >
                <div
                  className={`bg-gradient-to-br ${project.gradient} w-full h-64 sm:h-80 md:h-[28rem] flex items-center justify-center`}
                >
                  <svg
                    className="w-24 h-24 text-white/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d={project.icon}
                    />
                  </svg>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Info */}
            <div className="mt-4 text-white">
              <h3 className="text-xl sm:text-2xl font-bold">{project.title}</h3>
              <p className="text-white/60 mt-1">{project.category}</p>
              <div className="flex gap-6 mt-3 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  {project.area}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {project.year}
                </span>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goPrev}
              className="absolute top-1/2 -left-4 sm:-left-14 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute top-1/2 -right-4 sm:-right-14 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Counter */}
            <div className="text-center mt-4 text-white/40 text-sm">
              {currentIndex !== null ? currentIndex + 1 : 0} / {projects.length}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

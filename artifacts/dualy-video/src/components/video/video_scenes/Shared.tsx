import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Shared springs
export const springSnappy = { type: 'spring' as const, stiffness: 400, damping: 30 };
export const springBouncy = { type: 'spring' as const, stiffness: 300, damping: 15 };
export const springSmooth = { type: 'spring' as const, stiffness: 120, damping: 25 };
export const easeCustom = [0.16, 1, 0.3, 1] as const; // cinematic ease out

// Utility component to split text into staggered characters
export function SplitText({ 
  text, 
  delay = 0, 
  stagger = 0.03,
  className = "",
  initial = { y: 40, opacity: 0, rotateX: -45 },
  animate = { y: 0, opacity: 1, rotateX: 0 }
}: { 
  text: string; 
  delay?: number; 
  stagger?: number;
  className?: string;
  initial?: any;
  animate?: any;
}) {
  const words = text.split(" ");
  
  return (
    <span className={`inline-block ${className}`} style={{ perspective: "1000px" }}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap overflow-visible mr-[0.25em]">
          {word.split("").map((char, charIndex) => {
            // Calculate absolute index for stagger across words
            const prevCharsCount = words.slice(0, wordIndex).join("").length;
            const absoluteIndex = prevCharsCount + charIndex;
            
            return (
              <motion.span
                key={charIndex}
                className="inline-block origin-bottom"
                initial={initial}
                animate={animate}
                transition={{
                  ...springSnappy,
                  delay: delay + (absoluteIndex * stagger)
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

// Background that persists across scenes
export function PersistentBackground({ sceneIndex }: { sceneIndex: number }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      {/* Grid Pattern */}
      <motion.div 
        className="absolute inset-0 bg-grid-pattern opacity-30"
        animate={{
          scale: sceneIndex === 0 ? 1 : sceneIndex === 3 ? 1.5 : 1.1,
          rotate: sceneIndex === 4 ? 5 : 0,
          opacity: sceneIndex === 1 ? 0.5 : 0.3
        }}
        transition={{ duration: 3, ease: easeCustom }}
      />
      
      {/* Background image: bull/bear (scenes 1-2), trading chart (scenes 3-4), crossfaded */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}bull-bear-abstract.png)` }}
        animate={{
          opacity: sceneIndex <= 1 ? 0.35 : 0,
          scale: sceneIndex <= 1 ? 1.05 : 1.12,
        }}
        transition={{ duration: 3, ease: easeCustom }}
      />
      <motion.div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}trading-chart-abstract.png)` }}
        animate={{
          opacity: sceneIndex >= 2 ? 0.35 : 0,
          scale: sceneIndex >= 2 ? 1.05 : 1,
        }}
        transition={{ duration: 3, ease: easeCustom }}
      />

      {/* Dark vignette so text stays readable over the images */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(2,6,23,0.45) 0%, rgba(2,6,23,0.85) 100%)' }}
      />

      {/* Gradient dots pattern, drifting slowly */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%)',
        }}
        animate={{
          backgroundPosition: sceneIndex % 2 === 0 ? '0px 0px' : '14px 14px',
          opacity: sceneIndex === 1 ? 0.5 : 0.35,
        }}
        transition={{ duration: 4, ease: easeCustom }}
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
    </div>
  );
}
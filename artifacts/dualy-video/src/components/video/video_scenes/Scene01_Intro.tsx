import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springSnappy, springBouncy, easeCustom, SplitText } from './Shared';

export default function Scene01_Intro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),  // Logo text
      setTimeout(() => setPhase(2), 2200), // Main claim
      setTimeout(() => setPhase(3), 3500), // UI elements sneak peek
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        scale: 1.1,
        opacity: 0, 
        filter: 'blur(10px)',
        transition: { duration: 0.8, ease: easeCustom }
      }}
    >
      {/* Background asset if generated */}
      <motion.div 
        className="absolute inset-0 opacity-20 object-cover object-center mix-blend-screen"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 4, ease: "linear" }}
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}bull-bear-abstract.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto px-12 w-full text-center">
        {/* Logo Reveal */}
        <motion.div 
          className="flex items-center gap-6 mb-12"
          initial={{ y: 60, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={springBouncy}
        >
          <motion.img 
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="DualyStocks Logo"
            className="w-32 h-auto drop-shadow-2xl"
            initial={{ rotate: -15, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ ...springBouncy, delay: 0.2 }}
          />
          <div className="flex flex-col items-start text-left">
            <motion.h1 
              className="font-display font-bold text-6xl tracking-tight text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
              transition={springSnappy}
            >
              DUALY<span className="text-emerald-500">STOCKS</span>
            </motion.h1>
            <motion.div 
              className="h-1 bg-gradient-to-r from-emerald-500 to-transparent mt-2 rounded-full"
              initial={{ width: 0 }}
              animate={phase >= 1 ? { width: "100%" } : { width: 0 }}
              transition={{ ...springSnappy, delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Main Value Prop */}
        <div className="h-40 flex items-center justify-center w-full">
          <h2 className="font-display font-medium text-7xl tracking-tighter leading-tight text-white text-glow">
            {phase >= 2 && (
              <>
                <SplitText text="Clear investing," delay={0} className="block mb-2 text-white" />
                <SplitText text="no jargon." delay={0.4} className="block text-emerald-400" />
              </>
            )}
          </h2>
        </div>

        {/* Floating UI Elements (Sneak Peek) */}
        <div className="absolute inset-0 pointer-events-none perspective-[1000px]">
          {/* Green Up Tag */}
          <motion.div 
            className="absolute top-1/4 right-[15%] glass-panel-emerald rounded-xl p-4 flex items-center gap-3 box-glow"
            initial={{ opacity: 0, x: 100, y: 50, rotateY: 45, rotateZ: 10 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, y: 0, rotateY: -15, rotateZ: 5 } : { opacity: 0, x: 100, y: 50, rotateY: 45, rotateZ: 10 }}
            transition={{ ...springBouncy, delay: 0.1 }}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-slate-400 font-mono">AAPL</div>
              <div className="text-xl font-bold text-white">+2.45%</div>
            </div>
          </motion.div>

          {/* Score Badge */}
          <motion.div 
            className="absolute bottom-1/4 left-[15%] glass-panel rounded-2xl p-5 border-emerald-500/30"
            initial={{ opacity: 0, x: -100, y: 50, rotateY: -45, rotateZ: -10 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, y: 0, rotateY: 15, rotateZ: -5 } : { opacity: 0, x: -100, y: 50, rotateY: -45, rotateZ: -10 }}
            transition={{ ...springBouncy, delay: 0.3 }}
          >
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Score de Dualy</div>
            <div className="text-5xl font-display font-bold text-emerald-400">85<span className="text-2xl text-slate-500">/100</span></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
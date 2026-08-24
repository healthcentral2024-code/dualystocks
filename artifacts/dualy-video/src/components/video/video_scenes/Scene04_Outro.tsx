import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springSnappy, easeCustom, SplitText } from './Shared';

export default function Scene04_Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Chart lines draw
      setTimeout(() => setPhase(2), 1500), // Logo & Name
      setTimeout(() => setPhase(3), 2500), // Tagline
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden z-20 bg-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 1, ease: "linear" }
      }}
    >
      {/* Background Chart Visual */}
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 4, ease: easeCustom }}
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}trading-chart-abstract.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Abstract Glowing Grid overlay specific to outro */}
      <div className="absolute inset-0 bg-grid-pattern-emerald opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Logo Mark */}
        <motion.div
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={phase >= 2 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -45, opacity: 0 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[60px] opacity-40 scale-150" />
          <img 
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="DualyStocks Logo"
            className="w-48 h-auto relative z-10 drop-shadow-2xl"
          />
        </motion.div>

        {/* Brand Name */}
        <motion.h1 
          className="font-display font-bold text-7xl tracking-tight text-white mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ ...springSnappy, delay: 0.2 }}
        >
          DUALY<span className="text-emerald-500">STOCKS</span>
        </motion.h1>

        {/* Final Tagline */}
        <div className="overflow-hidden">
          <motion.p 
            className="text-2xl text-slate-300 font-body tracking-wide font-medium"
            initial={{ y: "100%" }}
            animate={phase >= 3 ? { y: 0 } : { y: "100%" }}
            transition={springSnappy}
          >
            Technical + Fundamental. One Clear View.
          </motion.p>
        </div>

      </div>
    </motion.div>
  );
}
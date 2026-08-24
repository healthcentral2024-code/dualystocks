import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springSnappy, easeCustom, SplitText } from './Shared';

export default function Scene03_Screener() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),  // Presets cascade in
      setTimeout(() => setPhase(2), 1200), // Middle column active
      setTimeout(() => setPhase(3), 2000), // Results populate
      setTimeout(() => setPhase(4), 3000), // Highlight one result
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const presets = [
    { name: "Valor Subestimado", icon: "💎", active: false },
    { name: "Dividendos Seguros", icon: "💵", active: true },
    { name: "Oportunidades", icon: "🚀", active: false }
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        scale: 0.9,
        opacity: 0,
        transition: { duration: 0.6, ease: easeCustom }
      }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-12 flex flex-col items-center h-full pt-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-6xl tracking-tight text-white mb-4">
            <SplitText text="Ideas de Inversión" delay={0.2} />
          </h2>
          <motion.div 
            className="text-xl text-emerald-400 font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Filtros preestablecidos. Opciones ganadoras.
          </motion.div>
        </div>

        {/* Screener UI Concept */}
        <div className="w-full max-w-5xl grid grid-cols-3 gap-8 perspective-[1000px]">
          
          {/* Column 1: Presets */}
          <div className="flex flex-col gap-4">
            <motion.div 
              className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Estrategias
            </motion.div>
            
            {presets.map((preset, i) => (
              <motion.div 
                key={i}
                className={`p-5 rounded-xl border flex items-center gap-4 transition-colors ${
                  preset.active 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-900/50 border-slate-800'
                }`}
                initial={{ opacity: 0, x: -50 }}
                animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ delay: i * 0.15, ...springSnappy }}
              >
                <div className="text-2xl">{preset.icon}</div>
                <div className={`font-semibold ${preset.active ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {preset.name}
                </div>
                {preset.active && (
                  <motion.div 
                    className="ml-auto w-2 h-2 rounded-full bg-emerald-500"
                    layoutId="activeDot"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Column 2 & 3: Results List */}
          <div className="col-span-2 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col gap-3 relative overflow-hidden">
            
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
            />

            {/* Results Header */}
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-800 text-sm font-bold text-slate-500 uppercase">
              <div className="col-span-2">Acción</div>
              <div>Rendimiento</div>
              <div className="text-right">Score</div>
            </div>

            {/* Results Items */}
            {[
              { ticker: "JNJ", name: "Johnson & Johnson", yield: "3.2%", score: 82, highlight: false },
              { ticker: "PEP", name: "PepsiCo Inc.", yield: "2.8%", score: 79, highlight: false },
              { ticker: "KO", name: "Coca-Cola Co.", yield: "3.1%", score: 91, highlight: true },
              { ticker: "PG", name: "Procter & Gamble", yield: "2.4%", score: 76, highlight: false },
            ].map((stock, i) => (
              <motion.div 
                key={i}
                className={`grid grid-cols-4 gap-4 items-center p-4 rounded-xl transition-all ${
                  phase >= 4 && stock.highlight 
                    ? 'bg-emerald-500/20 border border-emerald-500/50 scale-[1.02] shadow-lg relative z-10' 
                    : 'bg-slate-800/30 border border-transparent'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={phase >= 3 ? { opacity: phase >= 4 && !stock.highlight ? 0.4 : 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: i * 0.1, ...springSnappy }}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white text-sm">
                    {stock.ticker}
                  </div>
                  <div>
                    <div className={`font-bold ${phase >= 4 && stock.highlight ? 'text-white' : 'text-slate-200'}`}>{stock.name}</div>
                  </div>
                </div>
                <div className="text-emerald-400 font-mono font-semibold">{stock.yield}</div>
                <div className="text-right flex justify-end">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    stock.score > 85 ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {stock.score}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
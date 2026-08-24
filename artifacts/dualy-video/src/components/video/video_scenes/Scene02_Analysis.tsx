import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springSnappy, easeCustom, SplitText } from './Shared';

export default function Scene02_Analysis() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // UI enters
      setTimeout(() => setPhase(2), 1500), // Scanning effect starts
      setTimeout(() => setPhase(3), 2800), // Verdict reveals
      setTimeout(() => setPhase(4), 4500), // Exit prep
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center overflow-hidden z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        y: '-100vh',
        opacity: 0,
        transition: { duration: 0.8, ease: easeCustom }
      }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-12 grid grid-cols-12 gap-12 items-center h-full">
        
        {/* Left Side: Typography & Value Prop */}
        <div className="col-span-5 flex flex-col justify-center h-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springSnappy, delay: 0.2 }}
            className="w-16 h-1 bg-emerald-500 mb-8 rounded-full"
          />
          <h2 className="font-display font-bold text-5xl tracking-tight leading-tight text-white mb-6">
            <SplitText text="Analiza cualquier acción" delay={0.4} />
            <br />
            <SplitText text="en segundos." delay={0.8} className="text-emerald-400" />
          </h2>
          <motion.p 
            className="text-xl text-slate-400 font-body max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            De datos complejos a un veredicto claro y simple.
          </motion.p>
        </div>

        {/* Right Side: UI Mockup */}
        <div className="col-span-7 relative h-[70vh] flex items-center justify-center perspective-[2000px]">
          
          <motion.div 
            className="w-full max-w-lg glass-panel rounded-3xl p-8 relative overflow-hidden box-shadow-2xl border border-slate-700/50"
            initial={{ opacity: 0, rotateY: 30, z: -500, x: 100 }}
            animate={{ opacity: 1, rotateY: -10, z: 0, x: 0 }}
            transition={{ duration: 1.2, ease: easeCustom }}
          >
            {/* Header / Ticker */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold text-white shadow-inner">MSFT</div>
                <div>
                  <div className="text-white font-bold text-2xl">Microsoft Corp.</div>
                  <div className="text-slate-400">NASDAQ: MSFT</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">$415.20</div>
                <div className="text-emerald-400 font-semibold">+1.2%</div>
              </div>
            </div>

            {/* Analysis Loading / Results Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: "Valoración", val: "Justa", color: "text-amber-400", bg: "bg-amber-400/10" },
                { label: "Crecimiento", val: "Fuerte", color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { label: "Salud Financiera", val: "Excelente", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Rentabilidad", val: "Alta", color: "text-emerald-400", bg: "bg-emerald-400/10" }
              ].map((metric, i) => (
                <motion.div 
                  key={i}
                  className="bg-slate-900/80 rounded-xl p-4 border border-slate-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 * i, ...springSnappy }}
                >
                  <div className="text-sm text-slate-400 mb-2">{metric.label}</div>
                  <div className={`font-bold ${metric.color} ${metric.bg} inline-block px-3 py-1 rounded-md text-sm`}>
                    {metric.val}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Scanning Line Effect */}
            <motion.div 
              className="absolute left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20"
              initial={{ top: "0%", opacity: 0 }}
              animate={phase >= 2 && phase < 3 ? { top: ["0%", "100%", "0%"], opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
            />

            {/* Final Verdict Banner */}
            <motion.div 
              className="mt-6 rounded-2xl overflow-hidden relative"
              initial={{ height: 0, opacity: 0 }}
              animate={phase >= 3 ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ ...springSnappy, delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-emerald-900/80 to-slate-900 p-6 border-l-4 border-emerald-500">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <span className="text-white font-bold text-xl">88</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-bold text-lg mb-1">Señal de Compra Fuerte</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Fundamentales sólidos con crecimiento constante de ingresos. Cotizando por debajo de estimaciones justas.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
          
        </div>
      </div>
    </motion.div>
  );
}
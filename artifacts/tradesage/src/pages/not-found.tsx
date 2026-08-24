import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background treatment */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-[0.03] dark:opacity-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="max-w-md w-full text-center space-y-10 animate-in fade-in zoom-in duration-500 relative z-10 bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-28 h-28 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-[2rem] mx-auto flex items-center justify-center rotate-12 shadow-xl shadow-rose-900/10 border border-rose-200 dark:border-rose-800/50">
          <AlertCircle className="w-14 h-14 -rotate-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-6xl font-display font-bold text-slate-900 dark:text-white drop-shadow-sm">404</h1>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{t("notFoundTitle")}</p>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("notFoundDesc")}
          </p>
        </div>
        <Link href="/">
          <Button size="lg" className="h-16 px-10 text-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-900/30 transition-all border border-emerald-500/50 mt-4">
            <ArrowLeft className="w-6 h-6 mr-3" />
            {t("notFoundBack")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
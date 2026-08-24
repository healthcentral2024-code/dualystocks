import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { LANGS, type Lang } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
}

/**
 * Compact ES/EN toggle with a globe icon. Elegant, vivid glassmorphism for dark navy headers.
 */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-white/20 bg-black/10 backdrop-blur-md p-1 pl-2.5 shadow-inner",
        className,
      )}
      role="group"
      aria-label={t("langSelectorLabel")}
    >
      <Globe className="w-4 h-4 text-white/70 mr-1" />
      {LANGS.map((code: Lang) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            "px-2.5 py-1 text-xs font-bold uppercase rounded-full transition-all duration-300",
            lang === code
              ? "bg-white text-emerald-800 shadow-md scale-105 dark:bg-emerald-500 dark:text-white"
              : "text-white/70 hover:text-white hover:bg-white/10",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
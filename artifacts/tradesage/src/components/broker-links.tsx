import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/language";

export const BROKERS = [
  {
    id: "tc2000",
    name: "TC2000",
    description: { es: "Plataforma de gráficos (no es bróker)", en: "Charting platform (not a broker)" },
    url: "https://www.tc2000.com/",
    logo: "brokers/tc2000-official.png",
    initials: "TC",
  },
  {
    id: "thinkorswim",
    name: "Thinkorswim",
    description: { es: "Bróker de Charles Schwab", en: "Charles Schwab's broker" },
    url: "https://www.schwab.com/trading/thinkorswim",
    logo: "brokers/schwab-official.png",
    initials: "TS",
  },
  {
    id: "etrade",
    name: "E*TRADE",
    description: { es: "Bróker de Morgan Stanley", en: "Morgan Stanley's broker" },
    url: "https://us.etrade.com/",
    logo: "brokers/etrade-light.svg",
    initials: "E*",
  },
] as const;

export function BrokerLinks() {
  const { t, lang } = useLanguage();

  return (
    <div className="w-full max-w-md" data-testid="card-broker-links">
      <p className="text-center text-sm font-medium text-foreground mb-1">
        {t("brokersTitle")}
      </p>
      <p className="text-center text-xs text-muted-foreground mb-3">
        {t("brokersSubtitle")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {BROKERS.map((b) => (
          <a
            key={b.id}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-broker-${b.id}`}
            className="flex flex-col items-center gap-1.5 rounded-lg border bg-card/80 p-3 text-center transition-colors hover:bg-accent"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-bold text-muted-foreground">
              <img
                src={`${import.meta.env.BASE_URL}${b.logo}`}
                alt={b.name}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  // Fallback to initials if the logo can't load
                  const img = e.currentTarget;
                  img.style.display = "none";
                  img.parentElement!.textContent = b.initials;
                }}
              />
            </span>
            <span className="text-xs font-semibold leading-tight flex items-center gap-1">
              {b.name}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              {b.description[lang]}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {t("brokersDisclaimer")}
      </p>
    </div>
  );
}

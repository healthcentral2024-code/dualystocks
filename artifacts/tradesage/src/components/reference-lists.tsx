import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crown, Layers, Rocket, TrendingDown, ChevronRight, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { DOUBLES, INVERSES, type TickerGroup, type TickerItem } from "@/lib/leveraged-etfs";

const MAG7: TickerGroup[] = [
  {
    title: { es: "Las 7 Magníficas", en: "The Magnificent 7" },
    items: [
      { ticker: "AAPL", label: { es: "Apple", en: "Apple" } },
      { ticker: "MSFT", label: { es: "Microsoft", en: "Microsoft" } },
      { ticker: "GOOGL", label: { es: "Alphabet (Google)", en: "Alphabet (Google)" } },
      { ticker: "AMZN", label: { es: "Amazon", en: "Amazon" } },
      { ticker: "NVDA", label: { es: "Nvidia", en: "Nvidia" } },
      { ticker: "META", label: { es: "Meta (Facebook)", en: "Meta (Facebook)" } },
      { ticker: "TSLA", label: { es: "Tesla", en: "Tesla" } },
    ],
  },
];

const BLOCKS: TickerGroup[] = [
  {
    title: { es: "Índices (el mercado completo)", en: "Indexes (the whole market)" },
    items: [
      { ticker: "SPY", label: { es: "S&P 500", en: "S&P 500" } },
      { ticker: "DIA", label: { es: "Dow Jones", en: "Dow Jones" } },
      { ticker: "QQQ", label: { es: "Nasdaq 100", en: "Nasdaq 100" } },
      { ticker: "IWM", label: { es: "Russell 2000 (pequeñas)", en: "Russell 2000 (small caps)" } },
    ],
  },
  {
    title: { es: "Semiconductores (chips)", en: "Semiconductors (chips)" },
    items: [
      { ticker: "NVDA", label: { es: "Nvidia", en: "Nvidia" } },
      { ticker: "AMD", label: { es: "AMD", en: "AMD" } },
      { ticker: "MU", label: { es: "Micron", en: "Micron" } },
      { ticker: "AVGO", label: { es: "Broadcom", en: "Broadcom" } },
      { ticker: "TSM", label: { es: "TSMC", en: "TSMC" } },
      { ticker: "QCOM", label: { es: "Qualcomm", en: "Qualcomm" } },
      { ticker: "MRVL", label: { es: "Marvell", en: "Marvell" } },
      { ticker: "ASML", label: { es: "ASML", en: "ASML" } },
    ],
  },
  {
    title: { es: "Megatecnológicas (nube y publicidad)", en: "Mega-cap tech (cloud & ads)" },
    items: [
      { ticker: "MSFT", label: { es: "Microsoft", en: "Microsoft" } },
      { ticker: "META", label: { es: "Meta", en: "Meta" } },
      { ticker: "AMZN", label: { es: "Amazon", en: "Amazon" } },
      { ticker: "GOOGL", label: { es: "Alphabet", en: "Alphabet" } },
    ],
  },
  {
    title: { es: "Bancos grandes", en: "Big banks" },
    items: [
      { ticker: "JPM", label: { es: "JPMorgan", en: "JPMorgan" } },
      { ticker: "BAC", label: { es: "Bank of America", en: "Bank of America" } },
      { ticker: "WFC", label: { es: "Wells Fargo", en: "Wells Fargo" } },
      { ticker: "C", label: { es: "Citigroup", en: "Citigroup" } },
      { ticker: "GS", label: { es: "Goldman Sachs", en: "Goldman Sachs" } },
    ],
  },
  {
    title: { es: "Petroleras", en: "Oil companies" },
    items: [
      { ticker: "XOM", label: { es: "Exxon", en: "Exxon" } },
      { ticker: "CVX", label: { es: "Chevron", en: "Chevron" } },
      { ticker: "COP", label: { es: "ConocoPhillips", en: "ConocoPhillips" } },
    ],
  },
  {
    title: { es: "Ligadas al Bitcoin", en: "Bitcoin-linked" },
    items: [
      { ticker: "COIN", label: { es: "Coinbase", en: "Coinbase" } },
      { ticker: "HOOD", label: { es: "Robinhood", en: "Robinhood" } },
      { ticker: "MSTR", label: { es: "Strategy (MicroStrategy)", en: "Strategy (MicroStrategy)" } },
    ],
  },
];

function TickerChip({ item }: { item: TickerItem }) {
  const { lang } = useLanguage();
  return (
    <Link href={`/analisis/${item.ticker}`}>
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 ring-1 ring-transparent hover:ring-emerald-400/60 cursor-pointer transition-all group"
        data-testid={`chip-${item.ticker}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{item.base ?? item.ticker}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {item.base ? `(${item.label[lang]})` : item.label[lang]}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
      </div>
    </Link>
  );
}

function GroupList({ groups }: { groups: TickerGroup[] }) {
  const { lang } = useLanguage();
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.title.es}>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            {g.title[lang]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {g.items.map((item) => (
              <TickerChip key={item.ticker + g.title.es} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CardTheme {
  /** gradient strip + glow */
  gradient: string;
  /** icon tile */
  iconBg: string;
  /** hover ring */
  hoverRing: string;
  /** badge colors */
  badge: string;
  /** dialog title accent */
  titleAccent: string;
}

interface ReferenceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge: string;
  dialogTitle: string;
  dialogDescription: string;
  children: React.ReactNode;
  testId: string;
  theme: CardTheme;
}

function ReferenceCard({ icon: Icon, title, subtitle, badge, dialogTitle, dialogDescription, children, testId, theme }: ReferenceCardProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card
          className={`relative overflow-hidden bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border-0 ring-1 ring-slate-900/10 dark:ring-white/10 ${theme.hoverRing} transition-all cursor-pointer rounded-3xl text-left hover:shadow-2xl hover:-translate-y-1 group h-full`}
          data-testid={testId}
        >
          {/* Top gradient strip */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
          {/* Soft glow blob */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${theme.gradient} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity`} />
          <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative">
            <div className="flex items-center justify-between w-full">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
              </div>
              <Badge variant="secondary" className={`text-[11px] font-bold border-0 ${theme.badge}`}>{badge}</Badge>
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">{subtitle}</p>
            </div>
            <div className={`mt-auto flex items-center gap-1 text-sm font-bold ${theme.titleAccent}`}>
              <span>{t("refOpenList")}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg mb-1`}>
            <Icon className="w-6 h-6" />
          </div>
          <DialogTitle className="font-display text-2xl">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">{dialogDescription}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

const THEMES: Record<"mag7" | "blocks" | "doubles" | "inverses", CardTheme> = {
  mag7: {
    gradient: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-100 dark:bg-amber-500/10",
    hoverRing: "hover:ring-amber-400/70",
    badge: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
    titleAccent: "text-amber-600 dark:text-amber-400",
  },
  blocks: {
    gradient: "from-sky-400 to-indigo-500",
    iconBg: "bg-sky-100 dark:bg-sky-500/10",
    hoverRing: "hover:ring-sky-400/70",
    badge: "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300",
    titleAccent: "text-sky-600 dark:text-sky-400",
  },
  doubles: {
    gradient: "from-fuchsia-500 to-violet-600",
    iconBg: "bg-fuchsia-100 dark:bg-fuchsia-500/10",
    hoverRing: "hover:ring-fuchsia-400/70",
    badge: "bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    titleAccent: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  inverses: {
    gradient: "from-rose-500 to-red-600",
    iconBg: "bg-rose-100 dark:bg-rose-500/10",
    hoverRing: "hover:ring-rose-400/70",
    badge: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300",
    titleAccent: "text-rose-600 dark:text-rose-400",
  },
};

export function ReferenceLists() {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="reference-lists">
      <ReferenceCard
        icon={Crown}
        title={t("refMag7Title")}
        subtitle={t("refMag7Subtitle")}
        badge={t("refBadgeList")}
        dialogTitle={t("refMag7Title")}
        dialogDescription={t("refMag7Desc")}
        testId="card-ref-mag7"
        theme={THEMES.mag7}
      >
        <GroupList groups={MAG7} />
      </ReferenceCard>

      <ReferenceCard
        icon={Layers}
        title={t("refBlocksTitle")}
        subtitle={t("refBlocksSubtitle")}
        badge={t("refBadgeGroups")}
        dialogTitle={t("refBlocksTitle")}
        dialogDescription={t("refBlocksDesc")}
        testId="card-ref-blocks"
        theme={THEMES.blocks}
      >
        <GroupList groups={BLOCKS} />
      </ReferenceCard>

      <ReferenceCard
        icon={Rocket}
        title={t("refDoublesTitle")}
        subtitle={t("refDoublesSubtitle")}
        badge={t("refBadgeEtf")}
        dialogTitle={t("refDoublesTitle")}
        dialogDescription={t("refDoublesDesc")}
        testId="card-ref-doubles"
        theme={THEMES.doubles}
      >
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/30 p-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-snug">{t("refDoublesWarning")}</p>
        </div>
        <GroupList groups={DOUBLES} />
      </ReferenceCard>

      <ReferenceCard
        icon={TrendingDown}
        title={t("refInversesTitle")}
        subtitle={t("refInversesSubtitle")}
        badge={t("refBadgeEtf")}
        dialogTitle={t("refInversesTitle")}
        dialogDescription={t("refInversesDesc")}
        testId="card-ref-inverses"
        theme={THEMES.inverses}
      >
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/30 p-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-snug">{t("refInversesWarning")}</p>
        </div>
        <GroupList groups={INVERSES} />
      </ReferenceCard>
    </div>
  );
}

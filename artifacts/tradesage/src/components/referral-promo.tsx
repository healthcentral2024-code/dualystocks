import { useEffect, useState } from "react";
import { useSession } from "@clerk/react";
import { BadgePercent, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { InviteDialog } from "@/components/invite-dialog";

const SEEN_KEY = "ds_promo_session";

/**
 * Login promo: each time the user starts a new session ("logs in"), show a
 * one-time dialog inviting them to share the app with a friend to earn the
 * 25% referral discount. Keyed by Clerk session id in localStorage so it
 * appears once per login, not on every page load.
 */
export function ReferralPromo() {
  const { session } = useSession();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!session?.id) return;
    try {
      // Keep a bounded list of seen session ids so switching between two
      // still-valid sessions doesn't re-trigger the promo.
      let seen: string[] = [];
      try {
        const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
        if (Array.isArray(raw)) seen = raw.filter((s): s is string => typeof s === "string");
      } catch {
        // legacy single-string value or corrupt data: start fresh
      }
      if (!seen.includes(session.id)) {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, session.id].slice(-10)));
        // Small delay so it doesn't collide with page load / redirects.
        const timer = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable: skip the promo rather than nag every load.
    }
    return undefined;
  }, [session?.id]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl" data-testid="dialog-referral-promo">
          <DialogHeader className="items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
              <Gift className="w-8 h-8" />
            </div>
            <DialogTitle className="font-display text-2xl">{t("promoTitle")}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {t("promoBody")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            <BadgePercent className="w-5 h-5 shrink-0" />
            {t("promoReward")}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="flex-1 h-11 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={() => {
                setOpen(false);
                setInviteOpen(true);
              }}
              data-testid="button-promo-invite"
            >
              {t("promoCta")}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-11 font-semibold text-slate-500"
              onClick={() => setOpen(false)}
              data-testid="button-promo-later"
            >
              {t("promoLater")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

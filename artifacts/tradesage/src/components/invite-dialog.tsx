import { useState } from "react";
import { useUser } from "@clerk/react";
import { Gift, MessageSquareText, Share2, Copy, Check, BadgePercent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

/** Public URL of the app (works in dev and on dualystocks.com), with the
 * inviter's referral code so their 25% reward can be tracked. */
function appUrl(refCode?: string | null): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return refCode ? `${base}?ref=${encodeURIComponent(refCode)}` : base;
}

export function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const { user } = useUser();
  const link = appUrl(user?.id);
  const message = `${t("inviteMessage")} ${link}`;
  const [copied, setCopied] = useState<"msg" | "link" | null>(null);

  const copy = async (text: string, which: "msg" | "link") => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for browsers without the async Clipboard API
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt(t("inviteCopyManual"), text);
    }
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-6 h-6 text-emerald-600" />
            {t("inviteTitle")}
          </DialogTitle>
          <DialogDescription>{t("inviteSubtitle")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-line">
          {message}
        </div>

        <p className="flex items-start gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <BadgePercent className="w-4 h-4 shrink-0 mt-0.5" />
          {t("inviteRewardNote")}
        </p>

        <div className="grid gap-2">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            data-testid="button-invite-sms"
          >
            <a href={`sms:?&body=${encodeURIComponent(message)}`}>
              <MessageSquareText className="w-4 h-4 mr-2" />
              {t("inviteSms")}
            </a>
          </Button>
          {canShare && (
            <Button
              variant="secondary"
              className="font-bold"
              onClick={() =>
                navigator
                  .share({ text: message })
                  .catch(() => {/* user closed the share sheet */})
              }
              data-testid="button-invite-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t("inviteShare")}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => copy(message, "msg")}
              data-testid="button-invite-copy-message"
            >
              {copied === "msg" ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied === "msg" ? t("inviteCopied") : t("inviteCopyMessage")}
            </Button>
            <Button
              variant="outline"
              onClick={() => copy(link, "link")}
              data-testid="button-invite-copy-link"
            >
              {copied === "link" ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied === "link" ? t("inviteCopied") : t("inviteCopyLink")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

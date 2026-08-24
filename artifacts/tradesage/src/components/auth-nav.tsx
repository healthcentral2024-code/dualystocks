import { useState } from "react";
import { Show, useUser, useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { LogOut, ShieldCheck, User, CreditCard, KeyRound, ChevronDown, Gift, LifeBuoy } from "lucide-react";
import { InviteDialog } from "@/components/invite-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/language";
import { useSubscription } from "@/pages/subscribe";

export function AuthNav() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [inviteOpen, setInviteOpen] = useState(false);
  // Belt & suspenders: the API also reports admin status, so the tab shows
  // even if the cached Clerk user object hasn't refreshed its metadata yet.
  const { data: sub } = useSubscription();
  const isAdmin = user?.publicMetadata?.role === "admin" || sub?.isAdmin === true;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="flex items-center gap-4">
      <Link href="/soporte">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="link-header-support"
        >
          <LifeBuoy className="w-4 h-4" />
          <span className="hidden md:inline">{t("supportNavLabel")}</span>
        </Button>
      </Link>
      <Show when="signed-out">
        <Link href="/sign-in">
          <Button variant="ghost" size="sm" className="font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            {t("authSignIn")}
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button size="sm" className="font-bold hidden sm:inline-flex bg-white text-emerald-800 hover:bg-emerald-50 shadow-md border-0 transition-all dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500">
            {t("authSignUp")}
          </Button>
        </Link>
      </Show>

      <Show when="signed-in">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-emerald-200 hover:text-white hover:bg-emerald-500/30 transition-colors font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 text-sm font-bold text-white bg-black/10 py-1.5 px-3.5 rounded-full border border-white/20 backdrop-blur-md shadow-inner hover:bg-black/20 transition-colors"
                data-testid="button-profile-menu"
                aria-label={t("profileMenuAria")}
              >
                <User className="w-4 h-4 text-emerald-200 dark:text-emerald-400" />
                <span className="hidden sm:inline truncate max-w-[150px]">{user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="font-bold">{user?.fullName || user?.firstName}</p>
                <p className="text-xs font-normal text-muted-foreground truncate">{user?.emailAddresses[0]?.emailAddress}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex flex-col items-start gap-0.5 cursor-pointer"
                onClick={() => navigate("/suscripcion")}
                data-testid="menu-item-plan"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {t("profileMenuPlan")}: {" "}
                  {sub?.isAdmin
                    ? t("profilePlanAdmin")
                    : sub?.founder
                      ? t("profilePlanFounder")
                      : sub?.status === "trialing"
                        ? t("profilePlanTrial")
                        : sub?.active
                          ? t("profilePlanActive")
                          : t("profilePlanNone")}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{t("profileMenuPlanView")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex flex-col items-start gap-0.5 cursor-pointer"
                onClick={() => openUserProfile()}
                data-testid="menu-item-security"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  {t("profileMenuSecurity")}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{t("profileMenuSecurityHint")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex flex-col items-start gap-0.5 cursor-pointer"
                onClick={() => setInviteOpen(true)}
                data-testid="menu-item-invite"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  {t("inviteMenuItem")}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{t("inviteMenuHint")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex flex-col items-start gap-0.5 cursor-pointer"
                onClick={() => navigate("/soporte")}
                data-testid="menu-item-support"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  {t("supportNavLabel")}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{t("supportNavHint")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-rose-600 focus:text-rose-600 font-semibold"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                data-testid="menu-item-signout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t("authSignOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
        </div>
      </Show>
    </div>
  );
}
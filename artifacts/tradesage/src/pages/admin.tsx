import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Mail,
  LifeBuoy,
  ShieldCheck,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { HeaderChart } from "@/components/header-chart";

const API = `${import.meta.env.BASE_URL}api`;

interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string;
  createdAt: number;
  lastActiveAt: number | null;
  isAdmin: boolean;
  isFounder: boolean;
  subscriptionStatus: string | null;
  subscriptionActive: boolean;
}

interface SupportMessage {
  id: number;
  userId: string;
  email: string | null;
  name: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface AdminInvitation {
  id: string;
  email: string;
  status: string;
  createdAt: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error ?? `Error ${res.status}`);
  return body as T;
}

function fmtDate(ts: number | null, lang: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Admin() {
  const { t, lang } = useLanguage();
  const { user: me } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");

  const usersQ = useQuery<{ users: AdminUser[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => fetchJson(`${API}/admin/users`),
  });
  const invitesQ = useQuery<{ invitations: AdminInvitation[] }>({
    queryKey: ["admin", "invitations"],
    queryFn: () => fetchJson(`${API}/admin/invitations`),
  });

  const supportQ = useQuery<{ messages: SupportMessage[] }>({
    queryKey: ["admin", "support-messages"],
    queryFn: () => fetchJson(`${API}/admin/support-messages`),
  });

  const setSupportStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "open" | "resolved" }) =>
      fetchJson(`${API}/admin/support-messages/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "support-messages"] }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const invite = useMutation({
    mutationFn: (email: string) =>
      fetchJson(`${API}/admin/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["admin", "invitations"] });
      toast({ title: t("adminInviteSent") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API}/admin/invitations/${id}/revoke`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "invitations"] });
      toast({ title: t("adminInviteRevoked") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const removeUser = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API}/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: t("adminUserDeleted") });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const isForbidden =
    usersQ.isError && /403|administrador/i.test((usersQ.error as Error)?.message ?? "");

  const pending = (invitesQ.data?.invitations ?? []).filter((i) => i.status === "pending");
  const others = (invitesQ.data?.invitations ?? []).filter((i) => i.status !== "pending");

  // New-signup alert: users created after the admin's last "mark as seen".
  // Keyed per admin so two admins each get their own alert state.
  const seenKey = me?.id ? `ds_admin_signups_seen_${me.id}` : null;
  const [seenAt, setSeenAt] = useState<number>(() => {
    // First visit on this browser: baseline = now, so the alert only fires
    // for signups that happen after this point (not the whole history).
    const now = Date.now();
    if (!seenKey) return now;
    try {
      const stored = localStorage.getItem(seenKey);
      const v = Number(stored);
      if (stored && Number.isFinite(v)) return v;
      localStorage.setItem(seenKey, String(now));
    } catch {
      // localStorage unavailable
    }
    return now;
  });
  // Clerk's user may not be loaded on first render; once it is, adopt the
  // stored baseline for this admin (or persist the current one).
  useEffect(() => {
    if (!seenKey) return;
    try {
      const stored = localStorage.getItem(seenKey);
      const v = Number(stored);
      if (stored && Number.isFinite(v)) setSeenAt(v);
      else localStorage.setItem(seenKey, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
  }, [seenKey]);
  const newSignups = (usersQ.data?.users ?? []).filter((u) => u.createdAt > seenAt);
  const markSignupsSeen = () => {
    const now = Date.now();
    setSeenAt(now);
    if (seenKey) {
      try {
        localStorage.setItem(seenKey, String(now));
      } catch {
        // localStorage unavailable: alert just reappears next visit
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-sm relative overflow-hidden">
        <HeaderChart />
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-3 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{t("adminBack")}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-white font-display font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            {t("adminTitle")}
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {isForbidden ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {t("adminForbidden")}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* New signups alert */}
            {newSignups.length > 0 && (
              <Card
                className="border-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/30"
                data-testid="card-signup-alert"
              >
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl shrink-0">
                      <BellRing className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        {newSignups.length === 1
                          ? t("adminNewSignupOne")
                          : `${newSignups.length} ${t("adminNewSignupMany")}`}
                      </p>
                      <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80 truncate">
                        {newSignups
                          .slice(0, 5)
                          .map((u) => u.name || u.email || u.id)
                          .join(", ")}
                        {newSignups.length > 5 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    onClick={markSignupsSeen}
                    data-testid="button-signups-seen"
                  >
                    {t("adminNewSignupSeen")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Invitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  {t("adminInvitations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="flex gap-2 max-w-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inviteEmail.trim()) invite.mutate(inviteEmail.trim());
                  }}
                >
                  <Input
                    type="email"
                    required
                    placeholder={t("adminInvitePlaceholder")}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button type="submit" disabled={invite.isPending} className="gap-2">
                    {invite.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {t("adminInviteSend")}
                  </Button>
                </form>
                <p className="text-sm text-slate-500">{t("adminInviteHint")}</p>

                {invitesQ.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <div className="space-y-2">
                    {pending.length === 0 && others.length === 0 && (
                      <p className="text-sm text-slate-400">{t("adminNoInvitations")}</p>
                    )}
                    {[...pending, ...others].map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{inv.email}</p>
                          <p className="text-xs text-slate-500">
                            {fmtDate(inv.createdAt, lang)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={inv.status === "pending" ? "default" : "secondary"}
                            className={
                              inv.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : inv.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : ""
                            }
                          >
                            {inv.status === "pending"
                              ? t("adminInvitePending")
                              : inv.status === "accepted"
                                ? t("adminInviteAccepted")
                                : t("adminInviteRevokedBadge")}
                          </Badge>
                          {inv.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              disabled={revoke.isPending}
                              onClick={() => revoke.mutate(inv.id)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support messages */}
            <Card data-testid="card-admin-support">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <LifeBuoy className="w-5 h-5 text-emerald-600" />
                  {t("adminSupportTitle")}
                  {supportQ.data && (
                    <span className="text-sm font-normal text-slate-500">
                      ({supportQ.data.messages.filter((m) => m.status === "open").length})
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-slate-500">{t("adminSupportDesc")}</p>
              </CardHeader>
              <CardContent>
                {supportQ.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (supportQ.data?.messages ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">{t("adminSupportEmpty")}</p>
                ) : (
                  <div className="space-y-3">
                    {(supportQ.data?.messages ?? []).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2"
                        data-testid={`row-support-message-${m.id}`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{m.subject}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {m.name || m.email || m.userId}
                              {m.email ? ` · ${m.email}` : ""} · {fmtDate(new Date(m.createdAt).getTime(), lang)}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              m.status === "open"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                            }
                          >
                            {m.status === "open" ? t("adminSupportOpen") : t("adminSupportResolved")}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{m.message}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={setSupportStatus.isPending}
                            onClick={() =>
                              setSupportStatus.mutate({
                                id: m.id,
                                status: m.status === "open" ? "resolved" : "open",
                              })
                            }
                            data-testid={`button-support-toggle-${m.id}`}
                          >
                            {m.status === "open" ? t("adminSupportMarkResolved") : t("adminSupportReopen")}
                          </Button>
                          {m.email && (
                            <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                              <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-700">
                                <Mail className="w-4 h-4" /> {t("adminSupportReply")}
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Users className="w-5 h-5 text-emerald-600" />
                  {t("adminUsers")}
                  {usersQ.data && (
                    <span className="text-sm font-normal text-slate-500">
                      ({usersQ.data.users.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersQ.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <div className="space-y-2">
                    {(usersQ.data?.users ?? []).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.imageUrl}
                            alt=""
                            className="w-9 h-9 rounded-full shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {u.name || u.email || u.id}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {u.email} · {t("adminSince")} {fmtDate(u.createdAt, lang)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {u.createdAt > seenAt && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1">
                              <BellRing className="w-3 h-3" /> {t("adminNewBadge")}
                            </Badge>
                          )}
                          {u.isAdmin && (
                            <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100 gap-1">
                              <Crown className="w-3 h-3" /> Admin
                            </Badge>
                          )}
                          {u.isFounder && !u.isAdmin && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                              <Crown className="w-3 h-3" /> {t("adminFounder")}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={
                              u.subscriptionActive
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : ""
                            }
                          >
                            {u.isAdmin || u.isFounder
                              ? t("adminAccessFree")
                              : u.subscriptionActive
                                ? t("adminSubActive")
                                : t("adminSubNone")}
                          </Badge>
                          {u.id !== me?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              disabled={removeUser.isPending}
                              onClick={() => {
                                if (window.confirm(t("adminDeleteConfirm"))) {
                                  removeUser.mutate(u.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

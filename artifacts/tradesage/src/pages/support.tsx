import { useState } from "react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import { usePostSupportMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderChart } from "@/components/header-chart";
import { AuthNav } from "@/components/auth-nav";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/language";
import { ArrowLeft, CheckCircle2, LifeBuoy, Mail, Send } from "lucide-react";

export const SUPPORT_EMAIL = "costumer@dualystocks.com";

export default function Support() {
  const { t } = useLanguage();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { mutate, isPending, isError } = usePostSupportMessage({
    mutation: {
      onSuccess: () => {
        setSent(true);
        setSubject("");
        setMessage("");
      },
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || isPending) return;
    mutate({ data: { subject: subject.trim(), message: message.trim() } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-sm relative overflow-hidden">
        <HeaderChart />
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{t("supportBack")}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <img src="/logo.png" alt="DualyStocks" className="h-10 md:h-12 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]" />
            <LanguageSelector />
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-10 md:py-16 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">{t("supportTitle")}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t("supportSubtitle")}</p>
        </div>

        <Show when="signed-in">
          {sent ? (
            <Card className="rounded-3xl border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/30" data-testid="card-support-success">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">{t("supportSuccessTitle")}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{t("supportSuccessBody")}</p>
                <Button variant="outline" onClick={() => setSent(false)} data-testid="button-support-another">
                  {t("supportSendAnother")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl shadow-lg">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={submit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="support-subject">
                      {t("supportSubjectLabel")}
                    </label>
                    <Input
                      id="support-subject"
                      value={subject}
                      maxLength={200}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("supportSubjectPlaceholder")}
                      data-testid="input-support-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="support-message">
                      {t("supportMessageLabel")}
                    </label>
                    <Textarea
                      id="support-message"
                      value={message}
                      maxLength={5000}
                      rows={6}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("supportMessagePlaceholder")}
                      data-testid="input-support-message"
                    />
                  </div>
                  {isError && (
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400" data-testid="text-support-error">
                      {t("supportError")}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending || !subject.trim() || !message.trim()}
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                    data-testid="button-support-send"
                  >
                    <Send className="w-4 h-4" />
                    {isPending ? t("supportSending") : t("supportSend")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </Show>

        <Show when="signed-out">
          <Card className="rounded-3xl">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-300 font-medium">{t("supportSignInPrompt")}</p>
              <Link href="/sign-in">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" data-testid="button-support-signin">
                  {t("authSignIn")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Show>

        <Card className="rounded-3xl border-slate-200 dark:border-slate-800" data-testid="card-support-email">
          <CardContent className="p-6 md:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white mb-1">{t("supportEmailTitle")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("supportEmailBody")}{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  data-testid="link-support-email"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

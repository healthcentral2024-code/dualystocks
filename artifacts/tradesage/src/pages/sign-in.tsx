import { SignIn } from "@clerk/react";
import { BrokerLinks } from "@/components/broker-links";
import { FinvizSeal } from "@/components/finviz-seal";

export default function SignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="min-h-screen bg-background/50 flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 h-[700px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-top opacity-[0.25] dark:opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background"></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        <FinvizSeal />
        <BrokerLinks />
      </div>
    </div>
  );
}

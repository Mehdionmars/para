"use client";

import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/dashboard/ui/Button";
import { Input } from "@/components/dashboard/ui/Input";
import { cn } from "@/lib/dashboard/cn";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(
    searchParams.get("error") === "acces_refuse"
      ? "Ce compte n'a pas les autorisations nécessaires pour accéder au tableau de bord."
      : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard-auth/login", {
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Identifiants invalides.");
      }
      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f2edfa] px-4 py-12">
      <DecorativeBackdrop />

      <div className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white p-10 shadow-[0_30px_80px_-30px_rgba(76,29,149,0.35)]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative mb-4 h-24 w-24">
            <Image src="/assets/logo.png" alt="Para d'Hiver" fill sizes="96px" className="object-contain" priority />
          </div>
          <h1 className="font-serif text-2xl text-violet-950">Connexion à votre compte</h1>
          <p className="mt-1.5 text-sm text-gray-500">Entrez vos identifiants pour accéder au tableau de bord.</p>
        </div>

        <div className="mb-6 h-px w-full bg-gray-100" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-800">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-violet-100 bg-violet-50/30 pl-10 focus:border-violet-400 focus:bg-white"
                placeholder="vous@para-dhiver.ma"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-800">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-violet-100 bg-violet-50/30 pl-10 pr-10 focus:border-violet-400 focus:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-700 accent-violet-700 focus:ring-violet-400"
              />
              Se souvenir de moi
            </label>
            <a href="mailto:paradhiver@gmail.com" className="font-medium text-teal-600 hover:text-teal-700">
              Mot de passe oublié ?
            </a>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-1 h-12 w-full rounded-xl bg-violet-700 text-base font-semibold hover:bg-violet-800",
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </div>

      <p className="relative mt-6 flex items-center gap-1.5 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
        Para d&apos;hiver Admin — Accès réservé au personnel autorisé
      </p>
    </div>
  );
}

function DecorativeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute -right-16 -top-16 h-72 w-72 text-violet-200/60" viewBox="0 0 100 100" fill="none">
        <path
          d="M50 2 L50 98 M50 2 L38 14 M50 2 L62 14 M50 98 L38 86 M50 98 L62 86 M2 50 L98 50 M2 50 L14 38 M2 50 L14 62 M98 50 L86 38 M98 50 L86 62 M15 15 L85 85 M15 15 L15 27 M15 15 L27 15 M85 85 L85 73 M85 85 L73 85 M15 85 L85 15 M15 85 L15 73 M15 85 L27 85 M85 15 L85 27 M85 15 L73 15"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <svg className="absolute -bottom-10 -left-14 h-64 w-64 text-violet-200/50" viewBox="0 0 100 100" fill="none">
        <path
          d="M50 2 L50 98 M50 2 L38 14 M50 2 L62 14 M50 98 L38 86 M50 98 L62 86 M2 50 L98 50 M2 50 L14 38 M2 50 L14 62 M98 50 L86 38 M98 50 L86 62 M15 15 L85 85 M15 15 L15 27 M15 15 L27 15 M85 85 L85 73 M85 85 L73 85 M15 85 L85 15 M15 85 L15 73 M15 85 L27 85 M85 15 L85 27 M85 15 L73 15"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <svg className="absolute bottom-0 left-0 h-80 w-40 text-violet-300/25" viewBox="0 0 100 200" fill="none">
        <path
          d="M50 200 C50 160 30 150 20 120 M50 180 C50 150 70 140 78 115 M50 150 C50 120 32 108 24 85 M50 130 C50 105 66 96 72 78 M50 100 C50 80 36 70 30 52"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

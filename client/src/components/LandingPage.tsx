import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Database,
  FileCheck,
  Globe,
  Lock,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
}

const primaryFeatures: Feature[] = [
  {
    title: "Immutable Ledger Core",
    description: "Anchors every evidence event to a tamper-proof, append-only ledger.",
    icon: Database,
    bullets: ["Creates a verifiable chain-of-custody", "Provides cryptographic proof of origin"],
  },
  {
    title: "Zero-Trust Enforcement",
    description: "Controls access using automated smart contracts.",
    icon: Lock,
    bullets: ["Enforces granular roles and access policies", "Sensitive records are protected by encryption."],
  },
  {
    title: "Operational Assurance",
    description: "Realtime integrity monitoring with intelligent dispute detection.",
    icon: FileCheck,
    bullets: ["Stores metadata on the blockchain and large files off-chain", "Adaptive compliance scoring"],
  },
];

const logoSrc = new URL('../public/ledgis-logo.png', import.meta.url).href;

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-neutral-800/30 blur-3xl animate-float" />
        <div
          className="absolute right-10 top-32 h-[26rem] w-[26rem] -translate-y-16 rounded-full bg-neutral-800/20 blur-3xl animate-float"
          style={{ animationDelay: "1.8s" }}
        />
        <div
          className="absolute left-1/2 top-3/4 h-72 w-72 -translate-x-1/2 rounded-full bg-neutral-900/40 blur-3xl animate-float"
          style={{ animationDelay: "3.2s" }}
        />
      </div>

      <header className="relative border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <img src={logoSrc} alt="LEDGIS" className="h-10 w-auto" />

          <div className="flex items-center gap-3">
            <button className="btn-primary inline-flex items-center" onClick={onGetStarted}>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-26 sm:py-32" id="solutions">
          <div className="absolute inset-0 bg-gradient-radial from-neutral-900 via-neutral-950 to-neutral-950 opacity-80" aria-hidden />
          <div className="absolute inset-x-0 top-12 mx-auto h-[460px] w-[460px] rounded-full bg-gradient-conic from-neutral-200/15 via-neutral-800/10 to-transparent blur-3xl" aria-hidden />

          <div className="relative z-10 mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-neutral-700/60 bg-neutral-900/60 px-4 py-2 text-sm text-neutral-300 shadow-sm shadow-black/40">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Secure • Decentralized • Immutable
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                  LEDGIS
                </h1>
                <p className="text-lg leading-relaxed text-neutral-400 sm:text-xl">
                  A Blockchain-Based Framework for Secure Management of Government and Law Enforcement Records
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={onGetStarted}>
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative flex h-[380px] w-[380px] items-center justify-center rounded-full border border-neutral-800/70 bg-neutral-950/60 shadow-[0_40px_140px_-70px_rgba(0,0,0,0.85)]">
                <div className="absolute inset-6 rounded-full border border-neutral-800/40" />
                <div className="absolute inset-12 rounded-full border border-neutral-800/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 shadow-[0_30px_60px_-38px_rgba(255,255,255,0.45)]">
                    <Globe className="h-14 w-14 animate-spin-slow" />
                  </div>
                </div>
                <span className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full bg-neutral-200 shadow-[0_10px_30px_rgba(255,255,255,0.35)] animate-float" />
                <span className="absolute bottom-4 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_10px_40px_rgba(16,185,129,0.35)] animate-float" style={{ animationDelay: "1.2s" }} />
                <span className="absolute left-6 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-neutral-400/80 animate-float" style={{ animationDelay: "2.1s" }} />
                <span className="absolute right-6 top-1/3 h-2 w-2 rounded-full bg-neutral-300/80 animate-float" style={{ animationDelay: "2.8s" }} />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-900/60 bg-neutral-900/20 py-24" id="features">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl space-y-4">
                <p className="text-sm uppercase tracking-[0.4em] text-neutral-500">Core platform pillars</p>
                <h2 className="text-3xl font-semibold text-neutral-100 sm:text-4xl">Built for forensic-grade reliability</h2>
                <p className="text-neutral-400">
                This framework is designed to manage legal and law enforcement records by focusing on three main goals: making sure the evidence is reliable, enforcing strict security, and guaranteeing smooth operations.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {primaryFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-8 shadow-[0_25px_80px_-50px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-200 text-neutral-900">
                    <feature.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mb-3 text-xl font-semibold text-neutral-100">{feature.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-400">{feature.description}</p>
                  <ul className="space-y-2 text-sm text-neutral-300/90">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-200" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

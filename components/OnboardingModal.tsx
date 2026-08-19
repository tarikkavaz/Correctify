"use client";

import { KeyRound, Sparkles } from "lucide-react";
import type { Provider } from "@/lib/types";
import { useState } from "react";

interface OnboardingModalProps { isOpen: boolean; onComplete: (provider: Provider, key: string) => Promise<boolean>; }

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [key, setKey] = useState("");
  const [state, setState] = useState<"idle" | "testing" | "error">("idle");
  if (!isOpen) return null;
  const submit = async () => { if (!key.trim()) return; setState("testing"); if (!(await onComplete(provider, key.trim()))) setState("error"); };
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"><section className="w-full max-w-lg rounded-2xl border border-border bg-card-bg p-7 shadow-2xl" style={{ backgroundColor: "var(--card-bg-solid)" }} role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-button-text"><Sparkles className="h-5 w-5" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome to Correctify</p><h1 id="onboarding-title" className="mt-2 text-2xl font-semibold text-foreground">Make every correction dependable.</h1><p className="mt-2 text-sm leading-6 text-foreground/70">Start with an API key. It is saved only in your operating system’s secure keychain. Correctify will test it before saving.</p><div className="mt-6 grid grid-cols-2 gap-2">{(["openai", "anthropic", "mistral", "openrouter"] as Provider[]).map((item) => <button key={item} type="button" onClick={() => setProvider(item)} className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${provider === item ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/70 hover:bg-foreground/5"}`}>{item === "openrouter" ? "OpenRouter" : item}</button>)}</div><label className="mt-5 block text-sm font-medium text-foreground" htmlFor="onboarding-key">{provider === "openai" ? "OpenAI" : provider} API key</label><div className="mt-2 flex gap-2"><div className="relative flex-1"><KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-foreground/40" /><input id="onboarding-key" type="password" autoFocus value={key} onChange={(event) => { setKey(event.target.value); setState("idle"); }} className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" placeholder="Paste your key" /></div><button type="button" disabled={state === "testing"} onClick={submit} className="rounded-lg bg-primary px-4 text-sm font-medium text-button-text disabled:opacity-60">{state === "testing" ? "Testing…" : "Continue"}</button></div>{state === "error" && <p className="mt-2 text-sm text-error-text">That key could not be validated. It was not saved.</p>}<p className="mt-5 text-xs text-foreground/55">Your global shortcut will copy corrected text by default. Auto-paste is an optional setting.</p></section></div>;
}

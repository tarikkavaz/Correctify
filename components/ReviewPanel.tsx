"use client";

import { resolvedReviewText } from "@/lib/review";
import type { CorrectionReview } from "@/lib/types";
import { Check, Copy, RotateCcw, Replace, X } from "lucide-react";

interface ReviewPanelProps {
  review: CorrectionReview;
  model: string;
  duration: number;
  estimatedCost: number;
  onChange: (review: CorrectionReview) => void;
  onCopy: (text: string) => void;
  onReplace: (text: string) => void;
  onRestore: () => void;
}

const languageNames = { en: "English", tr: "Turkish", de: "German", fr: "French", mixed: "Mixed", unknown: "Unknown" };

export default function ReviewPanel({ review, model, duration, estimatedCost, onChange, onCopy, onReplace, onRestore }: ReviewPanelProps) {
  const text = resolvedReviewText(review);
  const accepted = review.edits.filter((edit) => edit.accepted).length;
  const setAll = (accepted: boolean) => onChange({ ...review, edits: review.edits.map((edit) => ({ ...edit, accepted })) });
  const toggle = (id: string) => onChange({ ...review, edits: review.edits.map((edit) => edit.id === id ? { ...edit, accepted: !edit.accepted } : edit) });

  if (review.edits.length === 0) {
    return <section className="mt-6 rounded-2xl border border-success-border bg-success-bg p-5" aria-live="polite"><h2 className="font-semibold text-success-text">No changes needed</h2><p className="mt-1 text-sm text-success-text/80">Your writing is ready to use.</p></section>;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card-bg shadow-sm" style={{ backgroundColor: "var(--card-bg-solid)" }} aria-live="polite">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Review changes</p><h2 className="mt-1 text-lg font-semibold text-foreground">{accepted} of {review.edits.length} edits accepted</h2><p className="mt-1 text-xs text-foreground/60">{languageNames[review.language]} · {model} · {(duration / 1000).toFixed(1)}s · ${estimatedCost.toFixed(4)}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setAll(true)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-foreground/5">Accept all</button><button type="button" onClick={() => setAll(false)} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-foreground/5">Reject all</button></div>
      </header>
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        <button type="button" onClick={() => onCopy(text)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-button-text hover:bg-primary-hover"><Copy className="h-4 w-4" />Copy accepted text</button>
        <button type="button" onClick={() => onReplace(text)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5"><Replace className="h-4 w-4" />Replace input</button>
        <button type="button" onClick={onRestore} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/5"><RotateCcw className="h-4 w-4" />Restore original</button>
      </div>
      <div className="max-h-[32rem] divide-y divide-border overflow-y-auto" aria-label="Suggested edits">
        {review.edits.map((edit, index) => <article key={edit.id} className={`flex gap-3 p-4 transition-colors ${edit.accepted ? "bg-primary/5" : "opacity-60"}`}>
          <button type="button" onClick={() => toggle(edit.id)} aria-label={`${edit.accepted ? "Reject" : "Accept"} edit ${index + 1}`} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${edit.accepted ? "border-primary bg-primary text-button-text" : "border-border text-foreground/40"}`}>{edit.accepted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</button>
          <div className="min-w-0 text-sm"><p className="break-words text-error-text line-through">{edit.original || "∅"}</p><p className="mt-1 break-words font-medium text-success-text">{edit.corrected || "∅"}</p></div>
        </article>)}
      </div>
    </section>
  );
}

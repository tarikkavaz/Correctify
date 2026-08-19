import type { CorrectionReview, DetectedLanguage, ReviewEdit } from "./types";

const TOKEN_PATTERN = /(\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_])/gu;

interface Token { value: string; start: number; end: number; }
interface DiffChunk { removed: string; added: string; start: number; end: number; }

function tokens(value: string): Token[] {
  return [...value.matchAll(TOKEN_PATTERN)].map((match) => ({ value: match[0], start: match.index, end: match.index + match[0].length }));
}

/** A compact LCS diff. Whitespace is retained as tokens so Markdown is never rebuilt. */
function diffTokens(original: Token[], corrected: Token[], originalLength: number): DiffChunk[] {
  const rows = original.length + 1;
  const cols = corrected.length + 1;
  if (rows * cols > 2_000_000) return [{ removed: original.map((token) => token.value).join(""), added: corrected.map((token) => token.value).join(""), start: 0, end: originalLength }];
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));
  for (let i = original.length - 1; i >= 0; i--) {
    for (let j = corrected.length - 1; j >= 0; j--) {
      table[i][j] = original[i].value === corrected[j].value ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const chunks: DiffChunk[] = [];
  let i = 0, j = 0, removed = "", added = "", start: number | null = null, end = 0;
  const beginChange = () => {
    if (start !== null) return;
    start = original[i]?.start ?? originalLength;
    end = start;
  };
  const flush = () => {
    if (removed || added) chunks.push({ removed, added, start: start ?? originalLength, end });
    removed = ""; added = ""; start = null; end = 0;
  };
  while (i < original.length || j < corrected.length) {
    if (i < original.length && j < corrected.length && original[i].value === corrected[j].value) { flush(); i++; j++; }
    else if (j < corrected.length && (i === original.length || table[i][j + 1] >= table[i + 1][j])) { beginChange(); added += corrected[j++].value; }
    else { beginChange(); removed += original[i].value; end = original[i++].end; }
  }
  flush();
  return chunks;
}

export function detectLanguage(text: string): DetectedLanguage {
  const sample = text.toLocaleLowerCase();
  if (!sample.trim()) return "unknown";
  const scores = {
    // `i` is common to English and must not be treated as Turkish-specific.
    tr: (sample.match(/[çğıöşü]/g)?.length ?? 0) * 3 + (sample.match(/\b(ve|bir|bu|için|ile|çok|de|da)\b/g)?.length ?? 0),
    de: (sample.match(/[äöüß]/g)?.length ?? 0) * 3 + (sample.match(/\b(und|der|die|das|ist|nicht|mit)\b/g)?.length ?? 0),
    fr: (sample.match(/[àâçéèêëîïôùûüÿœ]/g)?.length ?? 0) * 3 + (sample.match(/\b(le|la|les|de|des|et|est|pour)\b/g)?.length ?? 0),
    en: sample.match(/\b(the|and|is|are|to|of|for|with)\b/g)?.length ?? 0,
  };
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked[0][1]) return "unknown";
  if (ranked[1][1] > 0 && ranked[0][1] - ranked[1][1] <= 1) return "mixed";
  return ranked[0][0] as DetectedLanguage;
}

export function createReview(original: string, corrected: string): CorrectionReview {
  const chunks = diffTokens(tokens(original), tokens(corrected), original.length);
  const edits: ReviewEdit[] = chunks.map((chunk, index) => ({ id: `edit-${index}`, original: chunk.removed, corrected: chunk.added, accepted: true, start: chunk.start, end: chunk.end }));
  return { original, corrected, edits, language: detectLanguage(original) };
}

export function resolvedReviewText(review: CorrectionReview): string {
  if (review.edits.length === 0) return review.original;
  let remainder = review.original;
  for (const edit of [...review.edits].reverse()) {
    remainder = remainder.slice(0, edit.start) + (edit.accepted ? edit.corrected : edit.original) + remainder.slice(edit.end);
  }
  return remainder;
}

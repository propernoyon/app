"use client";

import { useSyncExternalStore } from "react";

import type { CartLine } from "@/lib/domain/cart";

/* ────────────────────────────────────────────────────────────────────────────
 * "Buy it again" history.
 *
 * After an order is placed we keep the basket lines locally, so the home page
 * can offer to re-add them. Cart lines already carry a display snapshot (name,
 * price, image), so this needs no extra API call and no id → product lookup.
 *
 * Same external-store shape as the cart: a stable server snapshot keeps SSR
 * deterministic, and localStorage is only touched from the browser.
 * ──────────────────────────────────────────────────────────────────────────── */

const HISTORY_KEY = "mini-mercado:recent";
const HISTORY_LIMIT = 12;

const EMPTY: CartLine[] = [];

let cached: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "number" &&
    typeof line.name === "string" &&
    typeof line.quantity === "number" &&
    typeof line.unitPrice === "number" &&
    (line.sellMode === "piece" || line.sellMode === "box")
  );
}

function emit(): void {
  for (const listener of listeners) listener();
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    cached = Array.isArray(parsed) ? parsed.filter(isLine).slice(0, HISTORY_LIMIT) : EMPTY;
  } catch {
    cached = EMPTY;
  }

  emit();
}

export function subscribeRecent(listener: () => void): () => void {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentSnapshot(): CartLine[] {
  return cached;
}

export function getRecentServerSnapshot(): CartLine[] {
  return EMPTY;
}

/** Called after a successful order. Deduplicated by product + sell mode. */
export function rememberRecentLines(lines: readonly CartLine[]): void {
  if (typeof window === "undefined" || lines.length === 0) return;

  const merged: CartLine[] = [];
  const seen = new Set<string>();

  for (const line of [...lines, ...cached]) {
    const key = `${line.productId}:${line.sellMode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(line);
    if (merged.length >= HISTORY_LIMIT) break;
  }

  cached = merged;
  loaded = true;

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(cached));
  } catch {
    // Non-fatal: the rail simply won't persist.
  }

  emit();
}

/** Reads the remembered lines, re-rendering when they change. */
export function useRecentLines(): CartLine[] {
  return useSyncExternalStore(subscribeRecent, getRecentSnapshot, getRecentServerSnapshot);
}

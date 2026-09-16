"use client";

import { useEffect } from "react";

import boundaryEn from "@/messages/boundary/en.json";

/**
 * Last-resort error boundary.
 *
 * `global-error.tsx` replaces the root layout when an error escapes it, so it
 * must render its own `<html>` and `<body>` and cannot rely on any provider, the
 * dictionary loader, or the design-system stylesheet. It therefore carries a
 * self-contained `<style>` block (using the same `prefers-color-scheme` signal
 * the rest of the app derives its default from) and the tiny English boundary
 * catalogue.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ui] fatal error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            color-scheme: light;
            --ge-bg: #fbfbfd;
            --ge-fg: #1c1f26;
            --ge-muted: #5f6470;
            --ge-brand: #065cd7;
            --ge-on-brand: #ffffff;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              color-scheme: dark;
              --ge-bg: #14161a;
              --ge-fg: #eceef1;
              --ge-muted: #a2a8b2;
              --ge-brand: #3082f6;
              --ge-on-brand: #06152e;
            }
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          background: "var(--ge-bg)",
          color: "var(--ge-fg)",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>{boundaryEn.errorTitle}</h1>
          <p style={{ margin: 0, color: "var(--ge-muted)", lineHeight: 1.6 }}>
            {boundaryEn.errorBody}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: "none",
              background: "var(--ge-brand)",
              color: "var(--ge-on-brand)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {boundaryEn.retry}
          </button>
        </div>
      </body>
    </html>
  );
}

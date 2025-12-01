import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import * as Sentry from "@sentry/remix";

// Initialize Sentry on the client
// Note: DSN should be provided via environment variables that are available at build time
// For Remix, you may need to use a different approach to inject the DSN
try {
  // Sentry will be initialized if SENTRY_DSN is available
  // This is a placeholder - actual DSN injection depends on your deployment setup
  if (typeof window !== "undefined") {
    // DSN would typically come from window.__SENTRY_DSN__ or similar
    // For now, initialization is optional
  }
} catch {
  // Sentry not configured - continue without it
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});


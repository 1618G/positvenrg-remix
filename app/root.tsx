import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import * as Sentry from "@sentry/remix";
import { applySecurityHeaders } from "~/lib/security.server";

import stylesheet from "~/styles/globals.css";
import { AccessibilitySkipLink } from "~/components/AccessibilitySkipLink";

// Error Boundary for Sentry
export function ErrorBoundary() {
  const error = useRouteError();
  
  // Send error to Sentry (only if Sentry is initialized)
  try {
    if (error) {
      if (isRouteErrorResponse(error)) {
        Sentry.captureException(new Error(`Route Error: ${error.status} ${error.statusText}`));
      } else if (error instanceof Error) {
        Sentry.captureException(error);
      }
    }
  } catch {
    // Sentry not configured or error in Sentry itself - ignore
  }

  return (
    <html>
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>{isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Apply security headers
  const headers = new Headers();
  applySecurityHeaders(headers);
  
  return new Response(null, { headers });
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nojever - AI Companions for Mental Wellness</title>
        <meta name="description" content="Nojever provides AI companions for mental wellness, offering support, guidance, and therapeutic conversations." />
        <meta name="theme-color" content="#f59e0b" />
        <Meta />
        <Links />
      </head>
      <body>
        <AccessibilitySkipLink />
        <div id="main-content">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

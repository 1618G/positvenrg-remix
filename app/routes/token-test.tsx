import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createUserSession } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Create a test token for the test user
  const testUserId = "cmh4dchpw0000rzc51xfflmc5"; // Test user ID from the auth test
  const token = createUserSession(testUserId);
  
  return json({ 
    token,
    dashboardUrl: `/dashboard?token=${token}`,
    chatUrl: `/chat/cmh47amb90000ta7spx3d0j5p?token=${token}` // First companion ID
  });
}

export default function TokenTest() {
  const { token, dashboardUrl, chatUrl } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎫</div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
          JWT Token Generated
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "2rem" }}>
          Use this token to test protected routes
        </p>
        
        <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Test Links</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <a
              href={dashboardUrl}
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: "600"
              }}
            >
              🏠 Dashboard (Protected)
            </a>
            <a
              href={chatUrl}
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                backgroundColor: "#10b981",
                color: "white",
                textDecoration: "none",
                borderRadius: "0.5rem",
                fontWeight: "600"
              }}
            >
              💬 Chat with PositiveNRG (Protected)
            </a>
          </div>
        </div>
        
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "1rem", marginBottom: "2rem" }}>
          <p style={{ color: "white", fontSize: "0.875rem", margin: 0, wordBreak: "break-all" }}>
            <strong>Token:</strong> {token}
          </p>
        </div>
        
        <div style={{ marginTop: "2rem" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "white",
              color: "#1f2937",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

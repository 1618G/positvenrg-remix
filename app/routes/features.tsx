import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return json({ companions });
}

export default function Features() {
  const { companions } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
            🚀 Platform Features
          </h1>
          <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)" }}>
            Discover the full power of PositiveNRG's AI-powered wellness platform
          </p>
        </div>

        {/* AI Companions Section */}
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1.5rem", textAlign: "center" }}>
            🤖 AI Companions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {companions.map((companion) => (
              <div key={companion.id} style={{ background: "white", padding: "1.5rem", borderRadius: "0.75rem", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "2.5rem", marginRight: "1rem" }}>{companion.avatar}</div>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                      {companion.name}
                    </h3>
                    <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                      {companion.description}
                    </p>
                  </div>
                </div>
                <p style={{ color: "#4b5563", fontSize: "0.875rem", fontStyle: "italic", marginBottom: "1rem" }}>
                  {companion.personality}
                </p>
                <Link
                  to={`/chat/${companion.id}`}
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    fontSize: "0.875rem"
                  }}
                >
                  Start Chat
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {/* AI Integration */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>🤖</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              AI Integration
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>Google Gemini API powered</li>
              <li>Real-time AI responses</li>
              <li>Contextual conversations</li>
              <li>Personality-driven interactions</li>
              <li>Emotional intelligence</li>
            </ul>
          </div>

          {/* Authentication */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>🔐</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              Secure Authentication
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>JWT token-based auth</li>
              <li>Password hashing with bcrypt</li>
              <li>Session management</li>
              <li>User registration & login</li>
              <li>Role-based access control</li>
            </ul>
          </div>

          {/* Database */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>🗄️</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              Database Management
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>PostgreSQL production database</li>
              <li>Prisma ORM integration</li>
              <li>User & companion management</li>
              <li>Chat history storage</li>
              <li>Message persistence</li>
            </ul>
          </div>

          {/* Chat System */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>💬</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              Real-time Chat
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>Socket.io integration</li>
              <li>Instant messaging</li>
              <li>Chat history</li>
              <li>Multiple companions</li>
              <li>Message threading</li>
            </ul>
          </div>

          {/* Logging */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>📊</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              Structured Logging
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>Pino JSON logging</li>
              <li>Performance monitoring</li>
              <li>Security event tracking</li>
              <li>AI response timing</li>
              <li>User activity logs</li>
            </ul>
          </div>

          {/* Deployment */}
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign: "center" }}>🐳</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
              Production Ready
            </h3>
            <ul style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: "1.6" }}>
              <li>Docker containerization</li>
              <li>Render deployment</li>
              <li>Environment configuration</li>
              <li>Auto-scaling</li>
              <li>Health monitoring</li>
            </ul>
          </div>
        </div>

        {/* Test Routes */}
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "1rem", padding: "2rem", marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem", textAlign: "center" }}>
            🧪 Test & Development Routes
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Link to="/db-test" style={{ display: "block", padding: "1rem", background: "#f3f4f6", borderRadius: "0.5rem", textDecoration: "none", color: "#1f2937", textAlign: "center" }}>
              🗄️ Database Test
            </Link>
            <Link to="/ai-test" style={{ display: "block", padding: "1rem", background: "#f3f4f6", borderRadius: "0.5rem", textDecoration: "none", color: "#1f2937", textAlign: "center" }}>
              🤖 AI Test
            </Link>
            <Link to="/auth-test" style={{ display: "block", padding: "1rem", background: "#f3f4f6", borderRadius: "0.5rem", textDecoration: "none", color: "#1f2937", textAlign: "center" }}>
              🔐 Auth Test
            </Link>
            <Link to="/logging-test" style={{ display: "block", padding: "1rem", background: "#f3f4f6", borderRadius: "0.5rem", textDecoration: "none", color: "#1f2937", textAlign: "center" }}>
              📊 Logging Test
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link to="/" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "white", color: "#1f2937", textDecoration: "none", borderRadius: "0.5rem", fontWeight: "600", fontSize: "1.125rem" }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

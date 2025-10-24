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

export default function Index() {
  const { companions } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #FFE87C 0%, #FFB88C 50%, #A8E6A1 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
          🌟 PositiveNRG - Your AI Energy Companions
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#374151", marginBottom: "2rem" }}>
          Connect with AI companions designed to boost your mood, energy, and well-being
        </p>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
          <Link 
            to="/login" 
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#10b981",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}
          >
            Sign Up
          </Link>
        </div>
        
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "2rem" }}>
            Meet Your AI Companions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
            {companions.map((companion) => (
              <div key={companion.id} style={{ background: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", transition: "transform 0.2s ease" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{companion.avatar}</div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                  {companion.name}
                </h3>
                <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "1rem" }}>
                  {companion.description}
                </p>
                <p style={{ color: "#4b5563", fontSize: "0.875rem", fontStyle: "italic" }}>
                  {companion.personality}
                </p>
                <Link
                  to={`/chat/${companion.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f59e0b",
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

        <div style={{ marginTop: "3rem", padding: "2rem", background: "rgba(255,255,255,0.8)", borderRadius: "1rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>
            🚀 Features
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", textAlign: "left" }}>
            <div>
              <h4 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>🤖 AI-Powered</h4>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Advanced AI companions with unique personalities</p>
            </div>
            <div>
              <h4 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>💬 Real-time Chat</h4>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Instant responses and meaningful conversations</p>
            </div>
            <div>
              <h4 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>🧘‍♀️ Mindfulness</h4>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Guided meditation and stress relief</p>
            </div>
            <div>
              <h4 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>⚡ Motivation</h4>
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Goal setting and productivity support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

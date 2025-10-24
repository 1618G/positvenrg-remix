import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return redirect("/login");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const companions = await db.companion.findMany({
    where: { isActive: true },
  });

  const recentChats = await db.chat.findMany({
    where: { userId: user.id },
    include: {
      companion: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return json({ user, companions, recentChats });
}

export default function Dashboard() {
  const { user, companions, recentChats } = useLoaderData<typeof loader>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.5rem" }}>
              Welcome back, {user.name || user.email}!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.9)" }}>Choose a companion to start your positive energy journey</p>
          </div>
          <Link
            to="/logout"
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Logout
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {companions.map((companion) => (
            <div key={companion.id} style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{companion.avatar}</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                {companion.name}
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{companion.description}</p>
              <Link
                to={`/chat/${companion.id}`}
                style={{
                  display: "inline-block",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontWeight: "600"
                }}
              >
                Start Chat
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

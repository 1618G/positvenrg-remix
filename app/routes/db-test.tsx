import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const companions = await db.companion.findMany();
    const users = await db.user.findMany();
    
    return json({ 
      companions: companions.length,
      users: users.length,
      message: "Database connection successful!",
      companionNames: companions.map(c => c.name)
    });
  } catch (error) {
    return json({ 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export default function DbTest() {
  const data = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗄️</div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
          Database Test
        </h1>
        
        {data.error ? (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ color: "#ef4444", margin: 0 }}>❌ {data.error}</p>
            <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>{data.details}</p>
          </div>
        ) : (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ color: "#10b981", margin: 0 }}>✅ {data.message}</p>
            <div style={{ color: "white", fontSize: "1.125rem", marginTop: "1rem" }}>
              <p>Companions: {data.companions}</p>
              <p>Users: {data.users}</p>
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Available Companions:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                  {data.companionNames?.map((name, index) => (
                    <span key={index} style={{ background: "rgba(255,255,255,0.2)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.875rem" }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
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

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { createUser, verifyLogin } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  
  return json({ users });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  
  if (action === "create") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    
    try {
      const user = await createUser(email, password, name);
      return json({ success: true, message: `User created: ${user.email}`, user });
    } catch (error) {
      return json({ success: false, message: "Failed to create user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  
  if (action === "login") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    try {
      const user = await verifyLogin(email, password);
      if (user) {
        return json({ success: true, message: `Login successful: ${user.email}`, user });
      } else {
        return json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      return json({ success: false, message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  
  return json({ success: false, message: "Invalid action" });
}

export default function AuthTest() {
  const { users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔐</div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
            Authentication Test
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)" }}>Test user registration and login</p>
        </div>

        {actionData && (
          <div style={{ 
            background: actionData.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
            border: `1px solid ${actionData.success ? "#10b981" : "#ef4444"}`, 
            borderRadius: "0.5rem", 
            padding: "1rem", 
            marginBottom: "2rem" 
          }}>
            <p style={{ color: actionData.success ? "#10b981" : "#ef4444", margin: 0 }}>
              {actionData.success ? "✅" : "❌"} {actionData.message}
            </p>
            {actionData.error && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                {actionData.error}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {/* Create User */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Create User</h2>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="action" value="create" />
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter name"
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Create User
              </button>
            </Form>
          </div>

          {/* Login User */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Login User</h2>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="action" value="login" />
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Login User
              </button>
            </Form>
          </div>
        </div>

        {/* Users List */}
        <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Existing Users ({users.length})</h2>
          {users.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {users.map((user) => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#f9fafb", borderRadius: "0.5rem" }}>
                  <div>
                    <span style={{ fontWeight: "600", color: "#1f2937" }}>{user.name || "No name"}</span>
                    <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>({user.email})</span>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    {user.role} • {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#6b7280", textAlign: "center" }}>No users found</p>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
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

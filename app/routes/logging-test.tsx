import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { authLogger, securityLogger, aiLogger, performanceLogger, appLogger } from "~/lib/logger.server";

export async function loader({ request }: LoaderFunctionArgs) {
  appLogger.startup(8780, 'development');
  
  return json({ 
    message: "Logging test page loaded",
    timestamp: new Date().toISOString()
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const testType = formData.get("testType") as string;
  
  switch (testType) {
    case "auth":
      authLogger.loginAttempt("test@example.com", true);
      authLogger.userCreated("test-user-id", "test@example.com", "USER");
      authLogger.sessionCreated("test-user-id", "test@example.com");
      break;
      
    case "security":
      securityLogger.suspiciousActivity("test-user-id", "Multiple failed login attempts", "192.168.1.1");
      securityLogger.rateLimitExceeded("192.168.1.1", "/api/chat");
      securityLogger.invalidToken("invalid-token-123", "192.168.1.1");
      break;
      
    case "ai":
      aiLogger.request("companion-123", "user-456", 50);
      aiLogger.response("companion-123", "user-456", 200, 1500);
      aiLogger.error("companion-123", "user-456", "API rate limit exceeded");
      break;
      
    case "performance":
      performanceLogger.slowQuery("SELECT * FROM users", 2500);
      performanceLogger.memoryUsage(process.memoryUsage());
      break;
      
    case "app":
      appLogger.error(new Error("Test application error"), "logging-test");
      appLogger.shutdown("SIGTERM");
      break;
      
    default:
      return json({ success: false, message: "Invalid test type" });
  }
  
  return json({ 
    success: true, 
    message: `Logged ${testType} events successfully`,
    timestamp: new Date().toISOString()
  });
}

export default function LoggingTest() {
  const { message, timestamp } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📊</div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
            Logging System Test
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)" }}>
            Test the comprehensive logging system with Pino
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
            Loaded: {timestamp}
          </p>
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
            {actionData.timestamp && (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", margin: "0.5rem 0 0 0" }}>
                {actionData.timestamp}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {/* Authentication Logging */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>🔐 Auth Logging</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Test authentication events: login attempts, user creation, sessions
            </p>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input type="hidden" name="testType" value="auth" />
              <button
                type="submit"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Test Auth Events
              </button>
            </Form>
          </div>

          {/* Security Logging */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>🛡️ Security Logging</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Test security events: suspicious activity, rate limits, invalid tokens
            </p>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input type="hidden" name="testType" value="security" />
              <button
                type="submit"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Test Security Events
              </button>
            </Form>
          </div>

          {/* AI Logging */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>🤖 AI Logging</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Test AI events: requests, responses, errors
            </p>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input type="hidden" name="testType" value="ai" />
              <button
                type="submit"
                style={{
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Test AI Events
              </button>
            </Form>
          </div>

          {/* Performance Logging */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>⚡ Performance</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Test performance events: slow queries, memory usage
            </p>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input type="hidden" name="testType" value="performance" />
              <button
                type="submit"
                style={{
                  backgroundColor: "#f59e0b",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Test Performance
              </button>
            </Form>
          </div>

          {/* Application Logging */}
          <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>🚀 App Logging</h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Test application events: errors, startup, shutdown
            </p>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input type="hidden" name="testType" value="app" />
              <button
                type="submit"
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Test App Events
              </button>
            </Form>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "1.5rem", marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white", marginBottom: "1rem" }}>📋 Logging Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div>
              <h3 style={{ color: "#10b981", fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>✅ Structured Logging</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                JSON format with consistent fields for easy parsing
              </p>
            </div>
            <div>
              <h3 style={{ color: "#3b82f6", fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>🔍 Event Tracking</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                Authentication, security, AI, and performance events
              </p>
            </div>
            <div>
              <h3 style={{ color: "#8b5cf6", fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>📊 Performance</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                Request timing, memory usage, slow query detection
              </p>
            </div>
            <div>
              <h3 style={{ color: "#f59e0b", fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>🛡️ Security</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                Invalid tokens, rate limits, suspicious activity
              </p>
            </div>
          </div>
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

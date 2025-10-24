import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { generateResponse } from "~/lib/gemini.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  if (!message) {
    return json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const response = await generateResponse(message);
    return json({ success: true, response });
  } catch (error) {
    return json({ 
      error: error instanceof Error ? error.message : "AI service error" 
    }, { status: 500 });
  }
}

export default function AITest() {
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🤖</div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>AI Integration Test</h1>
        <p style={{ color: "rgba(255,255,255,0.9)" }}>Test Google Gemini AI responses</p>

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
          <div>
            <label htmlFor="message" style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "white", marginBottom: "0.5rem" }}>Test Message</label>
            <input
              type="text"
              id="message"
              name="message"
              required
              placeholder="Type a message to test AI response..."
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
            />
          </div>
          <button type="submit" style={{ backgroundColor: "#10b981", color: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", fontWeight: "600", cursor: "pointer" }}>
            Test AI Response
          </button>
        </Form>

        {actionData?.response && (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "0.5rem", padding: "1rem", marginTop: "2rem", textAlign: "left" }}>
            <p style={{ color: "#10b981", margin: "0 0 0.5rem 0", fontWeight: "600" }}>✅ AI Response:</p>
            <p style={{ color: "#1f2937", margin: 0, background: "white", padding: "1rem", borderRadius: "0.5rem" }}>{actionData.response}</p>
          </div>
        )}
        {actionData?.error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "0.5rem", padding: "1rem", marginTop: "2rem" }}>
            <p style={{ color: "#ef4444", margin: 0 }}>❌ {actionData.error}</p>
          </div>
        )}

        <div style={{ marginTop: "2rem" }}>
          <a href="/" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "white", color: "#1f2937", textDecoration: "none", borderRadius: "0.5rem", fontWeight: "600", fontSize: "1.125rem" }}>
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

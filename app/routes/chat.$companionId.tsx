import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateCompanionResponse } from "~/lib/gemini.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
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

  const companion = await db.companion.findUnique({
    where: { id: params.companionId },
  });

  if (!companion) {
    throw new Response("Companion not found", { status: 404 });
  }

  // Get or create chat
  let chat = await db.chat.findFirst({
    where: {
      userId: user.id,
      companionId: companion.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    chat = await db.chat.create({
      data: {
        userId: user.id,
        companionId: companion.id,
        title: `Chat with ${companion.name}`,
      },
      include: {
        messages: true,
      },
    });
  }

  return json({ user, companion, chat });
}

export async function action({ request, params }: ActionFunctionArgs) {
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

  const formData = await request.formData();
  const message = formData.get("message") as string;

  if (!message) {
    return json({ error: "Message is required" }, { status: 400 });
  }

  const companion = await db.companion.findUnique({
    where: { id: params.companionId },
  });

  if (!companion) {
    return json({ error: "Companion not found" }, { status: 404 });
  }

  // Get or create chat
  let chat = await db.chat.findFirst({
    where: {
      userId: user.id,
      companionId: companion.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    chat = await db.chat.create({
      data: {
        userId: user.id,
        companionId: companion.id,
        title: `Chat with ${companion.name}`,
      },
      include: {
        messages: true,
      },
    });
  }

  // Save user message
  const userMessage = await db.message.create({
    data: {
      content: message,
      role: "USER",
      userId: user.id,
      chatId: chat.id,
    },
  });

  // Generate AI response
  const chatHistory = chat.messages.map(msg => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  const aiResponse = await generateCompanionResponse(
    message,
    companion.id,
    chatHistory
  );

  // Save AI response
  await db.message.create({
    data: {
      content: aiResponse,
      role: "ASSISTANT",
      userId: user.id,
      chatId: chat.id,
    },
  });

  // Update chat timestamp
  await db.chat.update({
    where: { id: chat.id },
    data: { updatedAt: new Date() },
  });

  return json({ success: true });
}

export default function Chat() {
  const { user, companion, chat } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", minHeight: "100vh", background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
          {/* Chat Header */}
          <div style={{ background: "#3b82f6", color: "white", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "3rem", marginRight: "1rem" }}>{companion.avatar}</span>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.25rem" }}>{companion.name}</h1>
                <p style={{ color: "rgba(255,255,255,0.8)" }}>{companion.description}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ height: "400px", overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {chat.messages.length === 0 && (
              <div style={{ display: "flex", justifyContent: "start" }}>
                <div style={{ background: "#f3f4f6", color: "#1f2937", maxWidth: "300px", padding: "0.75rem 1rem", borderRadius: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>Hello! I'm {companion.name}, {companion.description?.toLowerCase() || "your AI companion"}. How are you feeling today?</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: "0.25rem 0 0 0" }}>Just now</p>
                </div>
              </div>
            )}
            
            {chat.messages.map((message) => (
              <div
                key={message.id}
                style={{ display: "flex", justifyContent: message.role === "USER" ? "end" : "start" }}
              >
                <div
                  style={{
                    background: message.role === "USER" ? "#3b82f6" : "#f3f4f6",
                    color: message.role === "USER" ? "white" : "#1f2937",
                    maxWidth: "300px",
                    padding: "0.75rem 1rem",
                    borderRadius: "1rem"
                  }}
                >
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>{message.content}</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: "0.25rem 0 0 0" }}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isSubmitting && (
              <div style={{ display: "flex", justifyContent: "start" }}>
                <div style={{ background: "#f3f4f6", color: "#1f2937", maxWidth: "300px", padding: "0.75rem 1rem", borderRadius: "1rem" }}>
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>Thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div style={{ borderTop: "1px solid #e5e7eb", padding: "1.5rem" }}>
            <Form method="post" style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                name="message"
                placeholder="Type your message..."
                required
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem"
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </Form>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <a
            href="/dashboard"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

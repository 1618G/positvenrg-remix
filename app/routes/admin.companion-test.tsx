import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { generateCompanionResponse } from "~/lib/gemini.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return json({ error: "Admin access required" }, { status: 403 });
  }

  // Get all companions
  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      knowledge: {
        where: { isActive: true },
        take: 5, // Get sample of knowledge entries
      },
    },
  });

  return json({ companions });
}

export async function action({ request }: ActionFunctionArgs) {
  // Require admin authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const companionId = formData.get("companionId") as string;
  const testMessage = formData.get("testMessage") as string || "Hello, how are you?";

  if (!companionId) {
    return json({ error: "Companion ID required" }, { status: 400 });
  }

  const companion = await db.companion.findUnique({
    where: { id: companionId },
  });

  if (!companion) {
    return json({ error: "Companion not found" }, { status: 404 });
  }

  try {
    const startTime = Date.now();
    const response = await generateCompanionResponse(
      testMessage,
      companion.id,
      [] // No chat history
    );
    const duration = Date.now() - startTime;

    return json({
      success: true,
      companionName: companion.name,
      testMessage,
      response,
      duration: `${duration}ms`,
      companionConfig: {
        hasSystemPrompt: !!companion.systemPrompt,
        systemPromptLength: companion.systemPrompt?.length || 0,
        hasTrainingData: !!companion.trainingData,
        hasKnowledgeBase: !!companion.knowledgeBaseUrl,
        personality: companion.personality,
      },
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      companionName: companion.name,
    }, { status: 500 });
  }
}

export default function CompanionTest() {
  const { companions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Companion Testing & Verification</h1>
        
        {actionData?.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">✅ Test Successful - {actionData.companionName}</h2>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>Response Time:</strong> {actionData.duration}</p>
              <p><strong>Test Message:</strong> "{actionData.testMessage}"</p>
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="font-medium mb-1">Response:</p>
                <p className="text-gray-800">{actionData.response}</p>
              </div>
              <div className="mt-3 text-xs">
                <p><strong>Configuration:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>System Prompt: {actionData.companionConfig.hasSystemPrompt ? `Yes (${actionData.companionConfig.systemPromptLength} chars)` : "No"}</li>
                  <li>Training Data: {actionData.companionConfig.hasTrainingData ? "Yes" : "No"}</li>
                  <li>Knowledge Base: {actionData.companionConfig.hasKnowledgeBase ? "Yes" : "No"}</li>
                  <li>Personality: {actionData.companionConfig.personality || "Not set"}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {actionData?.success === false && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="font-semibold text-red-800 mb-2">❌ Test Failed - {actionData.companionName}</h2>
            <p className="text-red-700">{actionData.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companions.map((companion) => (
            <div key={companion.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">{companion.avatar}</span>
                    {companion.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{companion.description}</p>
                </div>
                {companion.isPremium && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Premium</span>
                )}
              </div>

              <div className="mb-4 space-y-2 text-sm">
                <div>
                  <strong>Status:</strong>{" "}
                  <span className={companion.isActive ? "text-green-600" : "text-red-600"}>
                    {companion.isActive ? "✅ Active" : "❌ Inactive"}
                  </span>
                </div>
                <div>
                  <strong>System Prompt:</strong>{" "}
                  <span className={companion.systemPrompt ? "text-green-600" : "text-red-600"}>
                    {companion.systemPrompt ? `✅ (${companion.systemPrompt.length} chars)` : "❌ Missing"}
                  </span>
                </div>
                <div>
                  <strong>Training Data:</strong>{" "}
                  <span className={companion.trainingData ? "text-green-600" : "text-red-600"}>
                    {companion.trainingData ? "✅ Present" : "❌ Missing"}
                  </span>
                </div>
                <div>
                  <strong>Knowledge Base:</strong>{" "}
                  <span className={companion.knowledge.length > 0 ? "text-green-600" : "text-yellow-600"}>
                    {companion.knowledge.length > 0 ? `✅ ${companion.knowledge.length} entries` : "⚠️ No entries"}
                  </span>
                </div>
                <div>
                  <strong>Personality:</strong>{" "}
                  <span className="text-gray-600">{companion.personality || "Not set"}</span>
                </div>
              </div>

              {companion.knowledge.length > 0 && (
                <div className="mb-4">
                  <strong className="text-sm">Sample Knowledge Entries:</strong>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    {companion.knowledge.slice(0, 3).map((k) => (
                      <li key={k.id}>• {k.title} ({k.category})</li>
                    ))}
                  </ul>
                </div>
              )}

              <Form method="post" className="mt-4">
                <input type="hidden" name="companionId" value={companion.id} />
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Test Message:</label>
                  <input
                    type="text"
                    name="testMessage"
                    defaultValue="Hello, how are you?"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Test {companion.name}
                </button>
              </Form>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">Test Results Summary</h3>
          <p className="text-sm text-gray-700">
            Total Companions: <strong>{companions.length}</strong> | 
            Active: <strong>{companions.filter(c => c.isActive).length}</strong> | 
            With System Prompts: <strong>{companions.filter(c => c.systemPrompt).length}</strong> | 
            With Training Data: <strong>{companions.filter(c => c.trainingData).length}</strong> | 
            With Knowledge: <strong>{companions.filter(c => c.knowledge.length > 0).length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}




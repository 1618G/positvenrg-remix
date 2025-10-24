import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function loader({ request }: LoaderFunctionArgs) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  
  if (!apiKey) {
    return json({ 
      error: "GEMINI_API_KEY not found in environment variables",
      apiKey: "NOT_SET",
      model 
    });
  }

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    // Test with a simple prompt
    const result = await geminiModel.generateContent("Hello, how are you?");
    const response = await result.response;
    const text = response.text();

    return json({
      success: true,
      apiKey: apiKey.substring(0, 10) + "...",
      model,
      response: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      apiKey: apiKey.substring(0, 10) + "...",
      model,
      timestamp: new Date().toISOString()
    });
  }
}

export default function GeminiTest() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-sunrise-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-charcoal-900 mb-8">Gemini API Test</h1>
        
        <div className="bg-white rounded-lg shadow-soft p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2">
            <p><strong>API Key:</strong> {data.apiKey}</p>
            <p><strong>Model:</strong> {data.model}</p>
            <p><strong>Timestamp:</strong> {data.timestamp}</p>
          </div>
        </div>

        {data.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Success!</h2>
            <div className="bg-white rounded p-4">
              <p className="text-charcoal-700"><strong>Response:</strong></p>
              <p className="text-charcoal-900 mt-2">{data.response}</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Error</h2>
            <div className="bg-white rounded p-4">
              <p className="text-charcoal-700"><strong>Error:</strong></p>
              <p className="text-red-600 mt-2">{data.error}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Troubleshooting</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Check that GEMINI_API_KEY is set in your .env file</li>
            <li>Verify the API key is valid and has proper permissions</li>
            <li>Check if the API key has referrer restrictions that might block localhost</li>
            <li>Ensure the model name is correct (gemini-2.5-flash)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

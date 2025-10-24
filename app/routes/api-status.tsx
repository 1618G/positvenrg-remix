import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { apiClient } from "~/lib/api.client";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get API client status
    const status = apiClient.getStatus();
    
    // Check external service health
    const healthCheck = await apiClient.healthCheck();
    
    return json({
      success: true,
      timestamp: new Date().toISOString(),
      status,
      healthCheck,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
      },
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export default function ApiStatus() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-sunrise-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="heading-lg mb-4">API Status Dashboard</h1>
            <p className="text-body">
              Monitor the health and configuration of all API services
            </p>
          </div>

          {data.success ? (
            <div className="space-y-8">
              {/* Overall Status */}
              <div className="bg-pastel-50 border border-pastel-200 rounded-2xl p-6">
                <h2 className="heading-md mb-4 text-pastel-800">✅ System Status</h2>
                <p className="text-body text-pastel-700">
                  All systems operational as of {new Date(data.timestamp).toLocaleString()}
                </p>
              </div>

              {/* API Configuration */}
              <div className="bg-white border border-sunrise-200 rounded-2xl p-6">
                <h2 className="heading-md mb-4">🔧 API Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-2">Internal API</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Base URL:</span> {data.status.config.baseUrl}</div>
                      <div><span className="font-medium">Timeout:</span> {data.status.config.timeout}ms</div>
                      <div><span className="font-medium">Retries:</span> {data.status.config.retries}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal-900 mb-2">External APIs</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Gemini Base URL:</span> {data.status.externalApis.gemini.baseUrl}</div>
                      <div><span className="font-medium">Gemini Model:</span> {data.status.externalApis.gemini.model}</div>
                      <div><span className="font-medium">API Key:</span> {data.status.externalApis.gemini.hasApiKey ? '✅ Set' : '❌ Missing'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Check Results */}
              <div className="bg-white border border-sunrise-200 rounded-2xl p-6">
                <h2 className="heading-md mb-4">🏥 Service Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(data.healthCheck).map(([service, isHealthy]) => (
                    <div key={service} className={`p-4 rounded-xl border-2 ${
                      isHealthy 
                        ? 'bg-pastel-50 border-pastel-200' 
                        : 'bg-peach-50 border-peach-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold capitalize">{service}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isHealthy 
                            ? 'bg-pastel-200 text-pastel-800' 
                            : 'bg-peach-200 text-peach-800'
                        }`}>
                          {isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-white border border-sunrise-200 rounded-2xl p-6">
                <h2 className="heading-md mb-4">🔐 Environment Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Node Environment</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.environment.nodeEnv === 'production' 
                          ? 'bg-sunrise-200 text-sunrise-800' 
                          : 'bg-mist-200 text-mist-800'
                      }`}>
                        {data.environment.nodeEnv}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gemini API Key</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.environment.hasGeminiKey 
                          ? 'bg-pastel-200 text-pastel-800' 
                          : 'bg-peach-200 text-peach-800'
                      }`}>
                        {data.environment.hasGeminiKey ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database URL</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.environment.hasDatabaseUrl 
                          ? 'bg-pastel-200 text-pastel-800' 
                          : 'bg-peach-200 text-peach-800'
                      }`}>
                        {data.environment.hasDatabaseUrl ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">JWT Secret</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.environment.hasJwtSecret 
                          ? 'bg-pastel-200 text-pastel-800' 
                          : 'bg-peach-200 text-peach-800'
                      }`}>
                        {data.environment.hasJwtSecret ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-sunrise-50 border border-sunrise-200 rounded-2xl p-6">
                <h2 className="heading-md mb-4">🚀 Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <a href="/ai-test" className="btn-secondary">
                    Test AI Integration
                  </a>
                  <a href="/db-test" className="btn-secondary">
                    Test Database
                  </a>
                  <a href="/auth-test" className="btn-secondary">
                    Test Authentication
                  </a>
                  <a href="/" className="btn-primary">
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-peach-50 border border-peach-200 rounded-2xl p-6">
              <h2 className="heading-md mb-4 text-peach-800">❌ System Error</h2>
              <p className="text-body text-peach-700 mb-4">
                There was an error checking the API status:
              </p>
              <div className="bg-white border border-peach-200 rounded-lg p-4">
                <code className="text-sm text-peach-800">{data.error}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

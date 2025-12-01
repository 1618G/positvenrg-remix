import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { getCrisisStats } from "~/lib/crisis-detection.server";
import { getSafetyMetrics, getRecentSafetyIncidents } from "~/lib/safety.server";
import { getKnowledgeStats } from "~/lib/knowledge-base.server";
import { getMemoryStats } from "~/lib/memory.server";
import { getFeatureStats } from "~/lib/companion-features.server";
import { extractSessionFromRequest } from "~/lib/utils.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin authentication
  let user;
  try {
    const sessionResult = await extractSessionFromRequest(request);
    user = sessionResult.user;
    if (user.role !== "ADMIN") {
      return redirect("/dashboard");
    }
  } catch {
    return redirect("/login");
  }
  
  try {
    // Get crisis statistics
    const crisisStats = await getCrisisStats();
    
    // Get safety metrics
    const safetyMetrics = await getSafetyMetrics();
    const recentSafetyIncidents = await getRecentSafetyIncidents(10);
    
    // Get knowledge base statistics
    const knowledgeStats = await getKnowledgeStats();
    
    // Get memory statistics
    const memoryStats = await getMemoryStats();
    
    // Get feature statistics
    const featureStats = await getFeatureStats();
    
    // Get recent activity
    const recentCrises = await db.crisisLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    
    const recentConversations = await db.conversationSummary.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          include: {
            companion: {
              select: { name: true, avatar: true }
            }
          }
        }
      }
    });
    
    const companionStats = await db.companion.findMany({
      include: {
        _count: {
          select: {
            chats: true,
            knowledge: true
          }
        }
      }
    });
    
    return json({
      crisisStats,
      safetyMetrics,
      recentSafetyIncidents,
      knowledgeStats,
      memoryStats,
      featureStats,
      recentCrises,
      recentConversations,
      companionStats
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error loading monitoring data');
    return json({
      crisisStats: { totalCrises: 0, criticalCrises: 0, resolvedCrises: 0, recentCrises: [] },
      safetyMetrics: { totalMessages: 0, flaggedMessages: 0, crisisDetections: 0, interventions: 0, averageRiskLevel: 0 },
      recentSafetyIncidents: [],
      knowledgeStats: { totalEntries: 0, entriesByCompanion: {}, entriesByCategory: {} },
      memoryStats: { totalSummaries: 0, totalPreferences: 0, recentSummaries: [] },
      featureStats: { totalFeatures: 0, featuresByCompanion: {}, featuresByCategory: {} },
      recentCrises: [],
      recentConversations: [],
      companionStats: []
    });
  }
}

export default function AdminMonitoring() {
  const {
    crisisStats,
    knowledgeStats,
    memoryStats,
    featureStats,
    recentCrises,
    recentConversations,
    companionStats
  } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Monitoring Dashboard</h1>
              <p className="text-gray-600">Real-time monitoring of companion performance and safety</p>
            </div>
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Crisis Monitoring - Priority Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🚨 Crisis Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Critical Crises</p>
                  <p className="text-2xl font-bold text-red-900">{crisisStats.criticalCrises}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">⚠</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Total Crises</p>
                  <p className="text-2xl font-bold text-orange-900">{crisisStats.totalCrises}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-900">{crisisStats.resolvedCrises}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {crisisStats.totalCrises > 0 
                      ? Math.round((crisisStats.resolvedCrises / crisisStats.totalCrises) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Base Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Knowledge Base</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Entries</h3>
              <p className="text-3xl font-bold text-blue-600">{knowledgeStats.totalEntries}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By Companion</h3>
              <div className="space-y-2">
                {Object.entries(knowledgeStats.entriesByCompanion).map(([companionId, count]) => (
                  <div key={companionId} className="flex justify-between">
                    <span className="text-sm text-gray-600">{companionId}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
              <div className="space-y-2">
                {Object.entries(knowledgeStats.entriesByCategory).slice(0, 5).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Memory & Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🧠 Memory & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversation Summaries</h3>
              <p className="text-3xl font-bold text-purple-600">{memoryStats.totalSummaries}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Preferences</h3>
              <p className="text-3xl font-bold text-green-600">{memoryStats.totalPreferences}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Features</h3>
              <p className="text-3xl font-bold text-blue-600">{featureStats.totalFeatures}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Companions</h3>
              <p className="text-3xl font-bold text-orange-600">{companionStats.length}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Crises */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Crisis Events</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {recentCrises.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentCrises.map((crisis) => (
                    <div key={crisis.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {crisis.user?.name || crisis.user?.email || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Risk Level: <span className={`font-medium ${
                              crisis.riskLevel === 'critical' ? 'text-red-600' :
                              crisis.riskLevel === 'high' ? 'text-orange-600' :
                              crisis.riskLevel === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>{crisis.riskLevel}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(crisis.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(crisis.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No recent crisis events
                </div>
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {recentConversations.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentConversations.map((summary) => (
                    <div key={summary.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {summary.chat.companion.name} {summary.chat.companion.avatar}
                          </p>
                          <p className="text-sm text-gray-600 truncate max-w-xs">
                            {summary.summary}
                          </p>
                          <p className="text-sm text-gray-500">
                            Sentiment: <span className={`font-medium ${
                              summary.sentiment === 'positive' ? 'text-green-600' :
                              summary.sentiment === 'negative' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>{summary.sentiment}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(summary.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No recent conversations
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companion Performance */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Companion Performance</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Companion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Knowledge Entries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companionStats.map((companion) => (
                    <tr key={companion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{companion.avatar}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{companion.name}</div>
                            <div className="text-sm text-gray-500">{companion.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {companion._count.chats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {companion._count.knowledge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          companion.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {companion.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

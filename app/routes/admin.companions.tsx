import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Require admin authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return redirect("/login");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.userId);
  if (!user || user.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const companions = await db.companion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          knowledge: true,
          chats: true,
        },
      },
    },
  });

  return json({ companions, user });
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
  const action = formData.get("action") as string;

  // Create new companion
  if (action === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const personality = formData.get("personality") as string;
    const avatar = formData.get("avatar") as string || "🌟";
    const tagline = formData.get("tagline") as string;
    const mood = formData.get("mood") as string;
    const color = formData.get("color") as string;
    const systemPrompt = formData.get("systemPrompt") as string;
    const trainingDataStr = formData.get("trainingData") as string;
    const isPremium = formData.get("isPremium") === "true";
    const requiredTier = formData.get("requiredTier") as string || "FREE";

    if (!name || !description || !personality || !systemPrompt) {
      return json({ error: "Name, description, personality, and system prompt are required" }, { status: 400 });
    }

    let trainingData = null;
    if (trainingDataStr) {
      try {
        trainingData = JSON.parse(trainingDataStr);
      } catch (e) {
        return json({ error: "Invalid JSON in training data" }, { status: 400 });
      }
    }

    try {
      await db.companion.create({
        data: {
          name,
          description,
          personality,
          avatar,
          tagline: tagline || null,
          mood: mood || null,
          color: color || null,
          systemPrompt,
          trainingData: trainingData || null,
          isPremium,
          userId: user.id,
          isActive: true,
        },
      });

      return json({ success: true, message: "Companion created successfully" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to create companion" }, { status: 400 });
    }
  }

  // Update companion
  if (action === "update") {
    const companionId = formData.get("companionId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const personality = formData.get("personality") as string;
    const avatar = formData.get("avatar") as string;
    const tagline = formData.get("tagline") as string;
    const mood = formData.get("mood") as string;
    const color = formData.get("color") as string;
    const systemPrompt = formData.get("systemPrompt") as string;
    const trainingDataStr = formData.get("trainingData") as string;
    const isPremium = formData.get("isPremium") === "true";
    const isActive = formData.get("isActive") === "true";

    if (!companionId || !name || !description || !personality || !systemPrompt) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    let trainingData = null;
    if (trainingDataStr) {
      try {
        trainingData = JSON.parse(trainingDataStr);
      } catch (e) {
        return json({ error: "Invalid JSON in training data" }, { status: 400 });
      }
    }

    try {
      await db.companion.update({
        where: { id: companionId },
        data: {
          name,
          description,
          personality,
          avatar: avatar || null,
          tagline: tagline || null,
          mood: mood || null,
          color: color || null,
          systemPrompt,
          trainingData: trainingData || null,
          isPremium,
          isActive,
        },
      });

      return json({ success: true, message: "Companion updated successfully" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to update companion" }, { status: 400 });
    }
  }

  // Delete/deactivate companion
  if (action === "delete") {
    const companionId = formData.get("companionId") as string;
    if (!companionId) {
      return json({ error: "Companion ID required" }, { status: 400 });
    }

    try {
      await db.companion.update({
        where: { id: companionId },
        data: { isActive: false },
      });

      return json({ success: true, message: "Companion deactivated" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to deactivate companion" }, { status: 400 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminCompanions() {
  const { companions, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingCompanion = editingId ? companions.find(c => c.id === editingId) : null;

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="heading-xl text-charcoal-900">Companion Management</h1>
            <p className="text-body text-charcoal-600 mt-2">Create and manage AI companions</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
            <Link to="/admin/knowledge" className="btn-secondary">Knowledge Bases</Link>
          </div>
        </div>

        {actionData?.error && (
          <div className="bg-peach-50 border border-peach-200 text-peach-800 px-4 py-3 rounded-xl mb-6">
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="bg-pastel-50 border border-pastel-200 text-pastel-800 px-4 py-3 rounded-xl mb-6">
            {actionData.message}
          </div>
        )}

        {/* Create/Edit Form */}
        <div className="card mb-8">
          <h2 className="heading-md mb-6">
            {editingCompanion ? "Edit Companion" : "Create New Companion"}
          </h2>
          
          <Form method="post" className="space-y-6">
            <input type="hidden" name="action" value={editingCompanion ? "update" : "create"} />
            {editingCompanion && <input type="hidden" name="companionId" value={editingCompanion.id} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCompanion?.name}
                  required
                  className="input"
                  placeholder="Companion name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Avatar (emoji)
                </label>
                <input
                  type="text"
                  name="avatar"
                  defaultValue={editingCompanion?.avatar || "🌟"}
                  className="input"
                  placeholder="🌟"
                  maxLength={2}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  defaultValue={editingCompanion?.description || ""}
                  required
                  rows={2}
                  className="input"
                  placeholder="Short description of the companion"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Personality *
                </label>
                <textarea
                  name="personality"
                  defaultValue={editingCompanion?.personality || ""}
                  required
                  rows={3}
                  className="input"
                  placeholder="Describe the companion's personality and traits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  defaultValue={editingCompanion?.tagline || ""}
                  className="input"
                  placeholder="Short tagline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Mood
                </label>
                <input
                  type="text"
                  name="mood"
                  defaultValue={editingCompanion?.mood || ""}
                  className="input"
                  placeholder="e.g., Cheerful, Calm, Motivational"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Color Theme
                </label>
                <input
                  type="text"
                  name="color"
                  defaultValue={editingCompanion?.color || ""}
                  className="input"
                  placeholder="e.g., #FFB84D"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  System Prompt *
                </label>
                <textarea
                  name="systemPrompt"
                  defaultValue={editingCompanion?.systemPrompt || ""}
                  required
                  rows={8}
                  className="input font-mono text-sm"
                  placeholder="Detailed system prompt for AI training..."
                />
                <p className="text-xs text-charcoal-500 mt-1">
                  This defines how the companion behaves and responds
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Training Data (JSON)
                </label>
                <textarea
                  name="trainingData"
                  defaultValue={editingCompanion?.trainingData ? JSON.stringify(editingCompanion.trainingData, null, 2) : ""}
                  rows={6}
                  className="input font-mono text-sm"
                  placeholder='{"examples": [], "patterns": []}'
                />
                <p className="text-xs text-charcoal-500 mt-1">
                  Additional training data in JSON format
                </p>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPremium"
                    value="true"
                    defaultChecked={editingCompanion?.isPremium || false}
                    className="mr-2"
                  />
                  <span className="text-sm text-charcoal-700">Premium Companion</span>
                </label>

                {editingCompanion && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      value="true"
                      defaultChecked={editingCompanion?.isActive || false}
                      className="mr-2"
                    />
                    <span className="text-sm text-charcoal-700">Active</span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Saving..." : editingCompanion ? "Update Companion" : "Create Companion"}
              </button>
              {editingCompanion && (
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </Form>
        </div>

        {/* Companions List */}
        <div className="card">
          <h2 className="heading-md mb-6">All Companions</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal-200">
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Knowledge</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Chats</th>
                  <th className="text-left py-3 px-4 font-semibold text-charcoal-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {companions.map((companion) => (
                  <tr key={companion.id}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{companion.avatar}</span>
                        <div>
                          <div className="font-medium text-charcoal-900">{companion.name}</div>
                          <div className="text-sm text-charcoal-600">{companion.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        companion.isActive 
                          ? "bg-pastel-100 text-pastel-800" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {companion.isActive ? "Active" : "Inactive"}
                      </span>
                      {companion.isPremium && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-peach-100 text-peach-800">
                          Premium
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-charcoal-700">
                      {companion._count.knowledge} entries
                    </td>
                    <td className="py-4 px-4 text-charcoal-700">
                      {companion._count.chats} chats
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(companion.id)}
                          className="text-sm text-sunrise-600 hover:text-sunrise-700 font-medium"
                        >
                          Edit
                        </button>
                        <Link
                          to={`/admin/knowledge?companion=${companion.id}`}
                          className="text-sm text-sunrise-600 hover:text-sunrise-700 font-medium"
                        >
                          Knowledge
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


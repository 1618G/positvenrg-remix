import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
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

  const url = new URL(request.url);
  const companionFilter = url.searchParams.get("companion");

  // Get all companions for filter dropdown
  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, avatar: true },
  });

  // Get knowledge entries
  const where = companionFilter ? { companionId: companionFilter } : {};
  const knowledgeEntries = await db.companionKnowledge.findMany({
    where,
    include: {
      companion: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ knowledgeEntries, companions, user });
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

  // Create knowledge entry
  if (action === "create") {
    const companionId = formData.get("companionId") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const keywordsStr = formData.get("keywords") as string;

    if (!companionId || !title || !content || !category) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    let keywords = null;
    if (keywordsStr) {
      try {
        keywords = JSON.parse(keywordsStr);
      } catch (e) {
        // If not valid JSON, treat as comma-separated list
        keywords = keywordsStr.split(",").map(k => k.trim()).filter(k => k);
      }
    }

    try {
      await db.companionKnowledge.create({
        data: {
          companionId,
          title,
          content,
          category,
          keywords: keywords ? keywords : null,
          isActive: true,
        },
      });

      return json({ success: true, message: "Knowledge entry created successfully" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to create knowledge entry" }, { status: 400 });
    }
  }

  // Update knowledge entry
  if (action === "update") {
    const entryId = formData.get("entryId") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const keywordsStr = formData.get("keywords") as string;
    const isActive = formData.get("isActive") === "true";

    if (!entryId || !title || !content || !category) {
      return json({ error: "All required fields must be filled" }, { status: 400 });
    }

    let keywords = null;
    if (keywordsStr) {
      try {
        keywords = JSON.parse(keywordsStr);
      } catch (e) {
        keywords = keywordsStr.split(",").map(k => k.trim()).filter(k => k);
      }
    }

    try {
      await db.companionKnowledge.update({
        where: { id: entryId },
        data: {
          title,
          content,
          category,
          keywords: keywords ? keywords : null,
          isActive,
        },
      });

      return json({ success: true, message: "Knowledge entry updated successfully" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to update knowledge entry" }, { status: 400 });
    }
  }

  // Delete knowledge entry
  if (action === "delete") {
    const entryId = formData.get("entryId") as string;
    if (!entryId) {
      return json({ error: "Entry ID required" }, { status: 400 });
    }

    try {
      await db.companionKnowledge.delete({
        where: { id: entryId },
      });

      return json({ success: true, message: "Knowledge entry deleted" });
    } catch (error: any) {
      return json({ error: error.message || "Failed to delete knowledge entry" }, { status: 400 });
    }
  }

  // Bulk activate/deactivate
  if (action === "bulk-toggle") {
    const entryIds = formData.get("entryIds") as string;
    const isActive = formData.get("isActive") === "true";

    if (!entryIds) {
      return json({ error: "No entries selected" }, { status: 400 });
    }

    const ids = entryIds.split(",").filter(id => id);
    
    try {
      await db.companionKnowledge.updateMany({
        where: { id: { in: ids } },
        data: { isActive },
      });

      return json({ success: true, message: `${ids.length} entries updated` });
    } catch (error: any) {
      return json({ error: error.message || "Failed to update entries" }, { status: 400 });
    }
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminKnowledge() {
  const { knowledgeEntries, companions, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const companionFilter = searchParams.get("companion");

  const editingEntry = editingId ? knowledgeEntries.find(e => e.id === editingId) : null;

  const filteredEntries = companionFilter
    ? knowledgeEntries.filter(e => e.companionId === companionFilter)
    : knowledgeEntries;

  const categories = Array.from(new Set(knowledgeEntries.map(e => e.category))).sort();

  const toggleEntry = (id: string) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter(e => e !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  const toggleAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id));
    }
  };

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="heading-xl text-charcoal-900">Knowledge Base Management</h1>
            <p className="text-body text-charcoal-600 mt-2">Manage knowledge entries for companions</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
            <Link to="/admin/companions" className="btn-secondary">Companions</Link>
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

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-charcoal-700">
              Filter by Companion:
            </label>
            <select
              value={companionFilter || ""}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) {
                  params.set("companion", e.target.value);
                } else {
                  params.delete("companion");
                }
                setSearchParams(params);
              }}
              className="input"
            >
              <option value="">All Companions</option>
              {companions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatar} {c.name}
                </option>
              ))}
            </select>
            {selectedEntries.length > 0 && (
              <div className="ml-auto flex gap-2">
                <Form method="post">
                  <input type="hidden" name="action" value="bulk-toggle" />
                  <input type="hidden" name="entryIds" value={selectedEntries.join(",")} />
                  <input type="hidden" name="isActive" value="true" />
                  <button type="submit" className="btn-secondary text-sm">
                    Activate ({selectedEntries.length})
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="action" value="bulk-toggle" />
                  <input type="hidden" name="entryIds" value={selectedEntries.join(",")} />
                  <input type="hidden" name="isActive" value="false" />
                  <button type="submit" className="btn-secondary text-sm">
                    Deactivate ({selectedEntries.length})
                  </button>
                </Form>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        <div className="card mb-8">
          <h2 className="heading-md mb-6">
            {editingEntry ? "Edit Knowledge Entry" : "Create New Knowledge Entry"}
          </h2>
          
          <Form method="post" className="space-y-6">
            <input type="hidden" name="action" value={editingEntry ? "update" : "create"} />
            {editingEntry && <input type="hidden" name="entryId" value={editingEntry.id} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Companion *
                </label>
                <select
                  name="companionId"
                  defaultValue={editingEntry?.companionId || companionFilter || ""}
                  required
                  className="input"
                >
                  <option value="">Select a companion</option>
                  {companions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.avatar} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editingEntry?.category || ""}
                  required
                  className="input"
                  placeholder="e.g., breathing, grief, motivation"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingEntry?.title || ""}
                  required
                  className="input"
                  placeholder="Knowledge entry title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  defaultValue={editingEntry?.content || ""}
                  required
                  rows={8}
                  className="input"
                  placeholder="Detailed knowledge content..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Keywords (comma-separated or JSON array)
                </label>
                <input
                  type="text"
                  name="keywords"
                  defaultValue={
                    editingEntry?.keywords
                      ? typeof editingEntry.keywords === "string"
                        ? editingEntry.keywords
                        : JSON.stringify(editingEntry.keywords)
                      : ""
                  }
                  className="input"
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-charcoal-500 mt-1">
                  Used for knowledge search and matching
                </p>
              </div>

              {editingEntry && (
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      value="true"
                      defaultChecked={editingEntry?.isActive || false}
                      className="mr-2"
                    />
                    <span className="text-sm text-charcoal-700">Active</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Saving..." : editingEntry ? "Update Entry" : "Create Entry"}
              </button>
              {editingEntry && (
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

        {/* Knowledge Entries List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="heading-md">Knowledge Entries ({filteredEntries.length})</h2>
            {filteredEntries.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-sm text-sunrise-600 hover:text-sunrise-700 font-medium"
              >
                {selectedEntries.length === filteredEntries.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
          
          {filteredEntries.length === 0 ? (
            <p className="text-charcoal-600 text-center py-8">No knowledge entries found</p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-xl p-4 ${
                    entry.isActive ? "border-pastel-200 bg-white" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => toggleEntry(entry.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{entry.companion.avatar}</span>
                        <h3 className="font-semibold text-charcoal-900">{entry.title}</h3>
                        <span className="px-2 py-1 bg-pastel-100 text-pastel-800 text-xs rounded-full">
                          {entry.category}
                        </span>
                        {!entry.isActive && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-600 mb-2 line-clamp-2">
                        {entry.content}
                      </p>
                      {entry.keywords && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(typeof entry.keywords === "string"
                            ? [entry.keywords]
                            : Array.isArray(entry.keywords)
                            ? entry.keywords
                            : []
                          ).slice(0, 5).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-sunrise-50 text-sunrise-700 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setEditingId(entry.id)}
                          className="text-sm text-sunrise-600 hover:text-sunrise-700 font-medium"
                        >
                          Edit
                        </button>
                        <Form method="post" className="inline">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="entryId" value={entry.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm("Are you sure you want to delete this entry?")) {
                                e.preventDefault();
                              }
                            }}
                            className="text-sm text-peach-600 hover:text-peach-700 font-medium"
                          >
                            Delete
                          </button>
                        </Form>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}


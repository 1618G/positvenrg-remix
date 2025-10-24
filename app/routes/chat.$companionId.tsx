import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateCompanionResponse } from "~/lib/gemini.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // For now, allow access without authentication
  // TODO: Re-enable authentication later
  const user = null; // No user required for now

  const companion = await db.companion.findUnique({
    where: { id: params.companionId },
  });

  if (!companion) {
    throw new Response("Companion not found", { status: 404 });
  }

  // For demo purposes, create a simple chat without user association
  const chat = {
    id: "demo-chat",
    title: `Chat with ${companion.name}`,
    messages: [],
  };

  return json({ user, companion, chat });
}

export async function action({ request, params }: ActionFunctionArgs) {
  // For now, allow actions without authentication
  // TODO: Re-enable authentication later
  const user = null; // No user required for now

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

  // For demo purposes, generate a simple response without saving to database
  const aiResponse = await generateCompanionResponse(
    message,
    companion.id,
    []
  );

  return json({ 
    success: true, 
    userMessage: message,
    aiResponse: aiResponse 
  });
}

export default function Chat() {
  const { user, companion, chat } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actionData]);

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Chat Header */}
      <section className="py-8 bg-sunrise-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4 shadow-soft">
                <span className="text-3xl">{companion.avatar}</span>
              </div>
              <div>
                <h1 className="heading-lg text-charcoal-900 mb-2">{companion.name}</h1>
                <p className="text-body text-charcoal-700">{companion.description}</p>
                {companion.personality && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {companion.personality.split(',').slice(0, 3).map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/20 text-charcoal-800 text-sm rounded-full font-medium"
                      >
                        {trait.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link to="/dashboard" className="btn-ghost bg-white/20 text-charcoal-900 hover:bg-white/30">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Chat Interface */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card overflow-hidden">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-sunrise-50 scrollbar-thin scrollbar-thumb-sunrise-200 scrollbar-track-sunrise-100">
              {chat.messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-soft">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-sunrise-gradient rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm">{companion.avatar}</span>
                        </div>
                        <span className="font-semibold text-charcoal-900 text-sm">{companion.name}</span>
                      </div>
                      <p className="text-body text-charcoal-700 mb-2">
                        Hello! I'm {companion.name}, {companion.description?.toLowerCase() || "your AI companion"}. 
                        How are you feeling today?
                      </p>
                      <p className="text-xs text-charcoal-500">Just now</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display action data responses */}
              {actionData?.userMessage && actionData?.aiResponse && (
                <>
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md order-2">
                      <div className="bg-sunrise-gradient text-charcoal-900 rounded-2xl rounded-br-sm p-4 shadow-soft">
                        <p className="text-body mb-2">{actionData.userMessage}</p>
                        <p className="text-xs text-charcoal-700">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md order-1">
                      <div className="bg-white text-charcoal-700 rounded-2xl rounded-tl-sm p-4 shadow-soft">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-sunrise-gradient rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs">{companion.avatar}</span>
                          </div>
                          <span className="font-semibold text-charcoal-900 text-sm">{companion.name}</span>
                        </div>
                        <p className="text-body mb-2">{actionData.aiResponse}</p>
                        <p className="text-xs text-charcoal-500">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
              
              {isSubmitting && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-soft">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-sunrise-gradient rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs">{companion.avatar}</span>
                        </div>
                        <span className="font-semibold text-charcoal-900 text-sm">{companion.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-sunrise-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-sunrise-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-sunrise-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-charcoal-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-sunrise-100 p-6 bg-white">
              <Form method="post" className="flex gap-4">
                <input
                  type="text"
                  name="message"
                  placeholder="Type your message..."
                  required
                  className="input flex-1"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary px-6 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </div>
                  )}
                </button>
              </Form>
              
              {actionData?.error && (
                <div className="mt-4 p-3 bg-peach-50 border border-peach-200 rounded-lg">
                  <p className="text-sm text-peach-800">{actionData.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Conversation Starters */}
      <section className="py-8 bg-sunrise-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h3 className="heading-md mb-4">Need some inspiration?</h3>
            <p className="text-body">Try these conversation starters</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "How are you feeling today?",
              "I need some motivation",
              "Can you help me relax?",
              "I want to talk about my goals",
              "I'm feeling stressed",
              "Tell me something positive"
            ].map((starter, index) => (
              <button
                key={index}
                className="card text-left hover:shadow-warm transition-all duration-300 p-4"
                onClick={() => {
                  const input = document.querySelector('input[name="message"]') as HTMLInputElement;
                  if (input) {
                    input.value = starter;
                    input.focus();
                  }
                }}
              >
                <p className="text-body text-charcoal-700">{starter}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

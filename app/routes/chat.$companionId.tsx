import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actionData, isTyping]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate typing indicator
  useEffect(() => {
    if (isSubmitting) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  // Quick action handlers
  const handleQuickAction = (message: string) => {
    if (inputRef.current) {
      inputRef.current.value = message;
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-50">
      <Navigation />

      {/* Enhanced Companion Header */}
      <section className="py-8 bg-cosmic-duality relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-electric-500/20 via-teal-500/20 to-fire-500/20"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-cosmic border-4 border-white/50">
                  <span className="text-4xl">{companion.avatar}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-fire-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="heading-lg text-white mb-2 drop-shadow-lg">{companion.name}</h1>
                <p className="text-white/90 text-lg mb-3 drop-shadow-md">{companion.description}</p>
                <div className="flex flex-wrap gap-2">
                  {companion.personality?.split(',').map((trait, index) => (
                    <span key={index} className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full font-medium border border-white/30">
                      {trait.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/companions" className="btn-ghost bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30">
              ← Back to Companions
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Chat Interface */}
      <section className="py-8 bg-cosmic-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-cosmic border border-cosmic-200 overflow-hidden">
            {/* Messages Area with Enhanced Styling */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-cosmic-50 to-white">
              {/* Welcome Message */}
              {chat.messages.length === 0 && !actionData && (
                <div className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className="bg-gradient-to-br from-electric-50 to-teal-50 border border-electric-200 rounded-3xl rounded-tl-lg p-6 shadow-ethereal">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-electric-gradient rounded-full flex items-center justify-center mr-4 shadow-electric">
                          <span className="text-xl">{companion.avatar}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-cosmic-900 text-lg">{companion.name}</span>
                          <p className="text-cosmic-600 text-sm">Online now</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-cosmic-800 text-lg leading-relaxed">
                          Hello! I'm {companion.name}, {companion.description?.toLowerCase() || "your AI companion"}. 
                          How are you feeling today?
                        </p>
                        <div className="flex items-center space-x-2 text-cosmic-500 text-sm">
                          <div className="w-2 h-2 bg-fire-500 rounded-full animate-pulse"></div>
                          <span>Just now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display action data responses */}
              {actionData?.userMessage && actionData?.aiResponse && (
                <>
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-2xl order-2">
                      <div className="bg-cosmic-gradient text-white rounded-3xl rounded-br-lg p-6 shadow-cosmic">
                        <p className="text-lg leading-relaxed mb-2">{actionData.userMessage}</p>
                        <div className="flex items-center justify-end space-x-2 text-white/70 text-sm">
                          <span>You</span>
                          <span>•</span>
                          <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-2xl order-1">
                      <div className="bg-gradient-to-br from-electric-50 to-teal-50 border border-electric-200 rounded-3xl rounded-tl-lg p-6 shadow-ethereal">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-electric-gradient rounded-full flex items-center justify-center mr-3 shadow-electric">
                            <span className="text-sm">{companion.avatar}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-cosmic-900">{companion.name}</span>
                            <p className="text-cosmic-600 text-sm">AI Companion</p>
                          </div>
                        </div>
                        <p className="text-cosmic-800 text-lg leading-relaxed mb-3">{actionData.aiResponse}</p>
                        <div className="flex items-center space-x-2 text-cosmic-500 text-sm">
                          <div className="w-2 h-2 bg-fire-500 rounded-full animate-pulse"></div>
                          <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className="bg-gradient-to-br from-electric-50 to-teal-50 border border-electric-200 rounded-3xl rounded-tl-lg p-6 shadow-ethereal">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-electric-gradient rounded-full flex items-center justify-center mr-3 shadow-electric">
                          <span className="text-sm">{companion.avatar}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-cosmic-900">{companion.name}</span>
                          <p className="text-cosmic-600 text-sm">Typing...</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-electric-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-cosmic-600 text-sm ml-2">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="border-t border-cosmic-200 p-6 bg-white">
              <Form method="post" className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    name="message"
                    placeholder="Type your message..."
                    required
                    className="w-full px-6 py-4 border border-cosmic-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-electric-500 transition-all duration-300 text-lg"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSubmitting 
                          ? 'bg-cosmic-300 cursor-not-allowed' 
                          : 'bg-cosmic-gradient hover:shadow-cosmic hover:scale-110'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </Form>
              
              {actionData?.error && (
                <div className="mt-4 p-4 bg-passion-50 border border-passion-200 rounded-xl">
                  <p className="text-sm text-passion-800">{actionData.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Quick Actions */}
      <section className="py-8 bg-cosmic-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="heading-md mb-4 text-cosmic-900">Quick Start Conversations</h3>
            <p className="text-body text-cosmic-600">Try these conversation starters to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { text: "How are you feeling today?", icon: "😊", color: "electric" },
              { text: "I need some motivation", icon: "⚡", color: "fire" },
              { text: "Can you help me relax?", icon: "🧘‍♀️", color: "teal" },
              { text: "I want to talk about my goals", icon: "🎯", color: "golden" },
              { text: "I'm feeling stressed", icon: "😰", color: "passion" },
              { text: "Tell me something positive", icon: "☀️", color: "mystical" }
            ].map((starter, index) => (
              <button
                key={index}
                className={`card text-left hover:shadow-${starter.color} transition-all duration-300 p-6 group hover:scale-105`}
                onClick={() => handleQuickAction(starter.text)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-${starter.color}-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {starter.icon}
                  </div>
                  <div>
                    <p className="text-body text-cosmic-700 font-medium">{starter.text}</p>
                    <p className="text-sm text-cosmic-500 mt-1">Click to use</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateCompanionResponse } from "~/lib/gemini.server";

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
    <div className="h-screen flex flex-col bg-cosmic-50">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-cosmic-duality relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-electric-500/20 via-teal-500/20 to-fire-500/20"></div>
        <div className="relative px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              to="/companions" 
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-cosmic border-2 border-white/50">
                  <span className="text-2xl">{companion.avatar}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-fire-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">{companion.name}</h1>
                <p className="text-white/80 text-sm">{companion.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {companion.personality?.split(',').slice(0, 2).map((trait, index) => (
              <span key={index} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full border border-white/30">
                {trait.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Full Height Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-cosmic-50 to-white chat-scrollbar">
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

        {/* Fixed Input Area */}
        <div className="flex-shrink-0 border-t border-cosmic-200 p-6 bg-white">
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

          {/* Quick Actions */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {[
                "How are you feeling?",
                "I need motivation",
                "Help me relax",
                "Tell me something positive"
              ].map((starter, index) => (
                <button
                  key={index}
                  className="px-3 py-1 bg-cosmic-100 hover:bg-cosmic-200 text-cosmic-700 text-sm rounded-full transition-colors duration-200"
                  onClick={() => handleQuickAction(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
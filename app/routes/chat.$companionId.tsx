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
  const [messageInput, setMessageInput] = useState("");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actionData, isTyping]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear input after successful submission
  useEffect(() => {
    if (actionData?.success) {
      setMessageInput("");
    }
  }, [actionData]);

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
    setMessageInput(message);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              to="/companions" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{companion.avatar}</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{companion.name}</h1>
                <p className="text-sm text-gray-600">{companion.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {companion.personality?.split(',').slice(0, 2).map((trait, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {trait.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Full Height Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {/* Welcome Message */}
          {chat.messages.length === 0 && !actionData && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="bg-white rounded-2xl rounded-tl-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">{companion.avatar}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{companion.name}</span>
                      <p className="text-gray-500 text-sm">AI Companion</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-lg leading-relaxed">
                    Hello! I'm {companion.name}, {companion.description?.toLowerCase() || "your AI companion"}. 
                    How are you feeling today?
                  </p>
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Just now</span>
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
                <div className="max-w-3xl">
                  <div className="bg-blue-500 text-white rounded-2xl rounded-br-lg p-6 shadow-sm">
                    <p className="text-lg leading-relaxed mb-2">{actionData.userMessage}</p>
                    <div className="flex items-center justify-end space-x-2 text-blue-100 text-sm">
                      <span>You</span>
                      <span>•</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="bg-white rounded-2xl rounded-tl-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg">{companion.avatar}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{companion.name}</span>
                        <p className="text-gray-500 text-sm">AI Companion</p>
                      </div>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed mb-3">{actionData.aiResponse}</p>
                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
              <div className="max-w-3xl">
                <div className="bg-white rounded-2xl rounded-tl-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">{companion.avatar}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{companion.name}</span>
                      <p className="text-gray-500 text-sm">Typing...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-600 text-sm ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
          <Form method="post" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="message"
                  placeholder="Type your message..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg"
                  disabled={isSubmitting}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSubmitting 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
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
            
            {actionData?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{actionData.error}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {[
                "How are you feeling?",
                "I need motivation",
                "Help me relax",
                "Tell me something positive"
              ].map((starter, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200"
                  onClick={() => handleQuickAction(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
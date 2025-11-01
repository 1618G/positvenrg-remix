import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { useEffect, useRef, useState, useMemo } from "react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import { generateEnhancedCompanionResponse } from "~/lib/conversation-handler.server";
import { getConversationHistory } from "~/lib/memory.server";
import { checkInteractionLimit, consumeInteraction, estimateTokens, estimateCost } from "~/lib/subscription.server";
import { getOnboardingData } from "~/lib/onboarding.server";
import { 
  getClientIp, 
  canGuestUseConversation, 
  incrementGuestConversationCount, 
  getGuestRemainingConversations 
} from "~/lib/guest-tracking.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Get companion first (always needed)
  const companion = await db.companion.findUnique({
    where: { id: params.companionId },
  });

  if (!companion) {
    throw new Response("Companion not found", { status: 404 });
  }

  // Check authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  const session = token ? verifyUserSession(token) : null;
  const user = session ? await getUserById(session.userId) : null;

  // If authenticated, use user-based chat
  if (user) {
    // Check if there's an existing active chat
    let chat = await db.chat.findFirst({
      where: {
        userId: user.id,
        companionId: companion.id,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    // Create new chat if none exists
    if (!chat) {
      chat = await db.chat.create({
        data: {
          userId: user.id,
          companionId: companion.id,
          title: `Chat with ${companion.name}`,
          isActive: true,
        },
        include: {
          messages: true,
        },
      });
    }

    const onboardingData = await getOnboardingData(user.id);

    return json({ 
      user, 
      companion, 
      chat, 
      onboardingData,
      isGuest: false,
      guestRemaining: null,
    });
  }

  // Guest access - check IP-based usage
  const ipAddress = getClientIp(request);
  const canUse = await canGuestUseConversation(ipAddress);
  const guestRemaining = await getGuestRemainingConversations(ipAddress);

  // If guest has used all conversations, show signup prompt but still allow viewing
  return json({
    user: null,
    companion,
    chat: null, // Guests don't have persistent chats
    onboardingData: null,
    isGuest: true,
    guestRemaining,
    canUseGuest: canUse,
    ipAddress, // For tracking in action
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
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

  // Check authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  const session = token ? verifyUserSession(token) : null;
  const user = session ? await getUserById(session.userId) : null;

  // Authenticated user flow
  if (user) {
    const chatId = formData.get("chatId") as string;

    if (!chatId) {
      return json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Verify chat belongs to user
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
        companionId: companion.id,
      },
    });

    if (!chat) {
      return json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user has interactions available
    const interactionCheck = await checkInteractionLimit(user.id);
    
    if (!interactionCheck.allowed) {
      return json({ 
        error: interactionCheck.error || "You've reached your monthly interaction limit. Please upgrade your plan to continue chatting.",
        requiresUpgrade: true,
        remaining: interactionCheck.remaining,
        limit: interactionCheck.limit,
      }, { status: 402 });
    }

    try {
      const history = await getConversationHistory(chatId, 10);
      const chatHistory = history.map(msg => ({
        role: msg.role === "USER" ? "user" : "assistant" as "user" | "assistant",
        content: msg.content,
      }));

      const startTime = Date.now();
      const result = await generateEnhancedCompanionResponse(
        message,
        companion.id,
        user.id,
        chatId
      );
      const duration = Date.now() - startTime;

      // Estimate tokens for both input and output
      const inputTokens = estimateTokens(message.length);
      const responseTokens = estimateTokens(result.response.length);
      const totalTokens = inputTokens + responseTokens;
      const estimatedCostValue = estimateCost(totalTokens);

      // Consume one interaction
      const consumed = await consumeInteraction(user.id, {
        chatId,
        messageId: undefined, // Will be set after message creation
        modelUsed: "gemini-2.5-flash",
        tokensUsed: totalTokens,
        cost: estimatedCostValue,
      });

      if (!consumed) {
        return json({ 
          error: "Failed to process interaction. Please try again.",
        }, { status: 500 });
      }

      await db.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      return json({ 
        success: true,
        userMessage: message,
        aiResponse: result.response,
        crisisDetected: result.crisisDetected,
        crisisResources: result.crisisResources,
        tokensUsed: totalTokens,
        interactionsRemaining: interactionCheck.remaining,
        interactionsLimit: interactionCheck.limit,
      });
    } catch (error) {
      console.error("Error generating response:", error);
      return json({ 
        error: "Failed to generate response. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }
  }

  // Guest user flow - IP-based tracking
  const ipAddress = getClientIp(request);
  const canUse = await canGuestUseConversation(ipAddress);

  if (!canUse) {
    return json({ 
      error: `You've used your ${process.env.NODE_ENV === "development" ? "1000" : "10"} free conversations! Sign up to continue chatting with unlimited access.`,
      requiresSignup: true,
      guestRemaining: 0,
    }, { status: 402 });
  }

  try {
    // Get previous messages from request (passed from client)
    const previousMessagesJson = formData.get("previousMessages") as string;
    let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    if (previousMessagesJson) {
      try {
        const previousMessages = JSON.parse(previousMessagesJson);
        // Convert guest messages to chat history format
        chatHistory = previousMessages
          .filter((msg: any) => msg.role && msg.content)
          .map((msg: any) => ({
            role: msg.role === "USER" ? "user" : "assistant" as "user" | "assistant",
            content: msg.content,
          }));
        // Limit to last 10 messages for context
        chatHistory = chatHistory.slice(-10);
      } catch (e) {
        console.error("Error parsing previous messages:", e);
      }
    }
    
    // Use enhanced response generation with conversation context
    const { generateCompanionResponse } = await import("~/lib/gemini.server");
    const startTime = Date.now();
    
    let aiResponse: string;
    try {
      // Build conversation summary for context
      let conversationSummary: string | undefined;
      if (chatHistory.length > 0) {
        const recentTopics = chatHistory
          .slice(-6)
          .map(msg => msg.content.substring(0, 50))
          .join("; ");
        conversationSummary = `Recent conversation topics: ${recentTopics}`;
      }
      
      console.log("📨 Guest chat: Calling generateCompanionResponse", {
        messageLength: message.length,
        chatHistoryLength: chatHistory.length,
        companionId: companion.id,
        hasSummary: !!conversationSummary
      });
      
      aiResponse = await generateCompanionResponse(
        message,
        companion.id,
        chatHistory, // Pass conversation history
        conversationSummary
      );
      
      console.log("✅ Guest chat: Got AI response", {
        responseLength: aiResponse.length,
        preview: aiResponse.substring(0, 100)
      });
    } catch (aiError) {
      console.error("❌ Guest chat: Error generating AI response:", aiError);
      console.error("Error details:", aiError instanceof Error ? {
        message: aiError.message,
        stack: aiError.stack?.substring(0, 500),
        name: aiError.name
      } : aiError);
      // Fallback response if AI fails
      aiResponse = `I'm here to support you! I understand you said "${message}". How can I help you today?`;
    }
    
    const duration = Date.now() - startTime;

    // Increment guest usage count
    const guestUsage = await incrementGuestConversationCount(ipAddress);

    return json({ 
      success: true,
      userMessage: message,
      aiResponse: aiResponse,
      isGuest: true,
      guestRemaining: guestUsage.remaining,
      guestTotalUsed: guestUsage.totalUsed,
      requiresSignup: guestUsage.remaining === 0,
    });
  } catch (error) {
    console.error("Error in guest chat action:", error);
    return json({ 
      error: "Failed to process your message. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error",
      isGuest: true,
    }, { status: 500 });
  }
}

export default function Chat() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [guestMessages, setGuestMessages] = useState<Array<{role: string; content: string; id: string; timestamp: number}>>([]);

  const { user, companion, chat, onboardingData, isGuest, guestRemaining, canUseGuest } = loaderData;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [actionData, guestMessages, chat?.messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear input and add messages after successful submission
  useEffect(() => {
    // Only process guest messages
    if (actionData?.success && actionData.isGuest && actionData.userMessage && actionData.aiResponse) {
      const timestamp = Date.now();
      const userMsg = actionData.userMessage;
      const aiMsg = actionData.aiResponse;
      
      setGuestMessages(prev => {
        // More robust duplicate check - look at last few messages
        const recentMessages = prev.slice(-4); // Check last 4 messages (2 pairs)
        const userExists = recentMessages.some(msg => 
          msg.role === "USER" && msg.content === userMsg
        );
        const aiExists = recentMessages.some(msg => 
          msg.role === "ASSISTANT" && msg.content === aiMsg
        );
        
        // Only skip if BOTH the user and AI messages already exist in recent messages
        if (userExists && aiExists) {
          console.log("Skipping duplicate messages");
          return prev;
        }
        
        // Add the new message pair
        const newPair = [
          { 
            role: "USER" as const, 
            content: userMsg, 
            id: `guest-user-${timestamp}-${prev.length}`,
            timestamp 
          },
          { 
            role: "ASSISTANT" as const, 
            content: aiMsg, 
            id: `guest-ai-${timestamp}-${prev.length + 1}`,
            timestamp 
          },
        ];
        
        console.log("Adding new messages:", { userMsg: userMsg.substring(0, 30), aiMsg: aiMsg.substring(0, 30) });
        return [...prev, ...newPair];
      });
      
      // Clear input after a brief delay to ensure state update
      setTimeout(() => {
        setMessageInput("");
      }, 100);
    }
  }, [actionData?.success, actionData?.isGuest, actionData?.userMessage, actionData?.aiResponse]);

  // Typing indicator
  useEffect(() => {
    if (isSubmitting && !actionData) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [isSubmitting, actionData]);

  // Quick action handlers
  const handleQuickAction = (message: string) => {
    setMessageInput(message);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Determine messages to display with deduplication
  const displayMessages = useMemo(() => {
    if (user && chat) {
      // For authenticated users, use messages from chat (prefer persisted messages)
      // Only use actionData messages if we don't have chat messages
      const messages = chat.messages?.length > 0 ? chat.messages : (actionData?.messages || []);
      
      // Deduplicate by ID and content
      const seen = new Set<string>();
      return messages.filter((msg: any) => {
        const id = msg.id || `${msg.role}-${msg.content.substring(0, 50)}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    } else {
      // For guests, ONLY use guestMessages state (don't use actionData directly)
      // Deduplicate by ID and content
      const seen = new Set<string>();
      return guestMessages.filter((msg) => {
        const id = msg.id || `${msg.role}-${msg.content.substring(0, 50)}-${msg.timestamp}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }
  }, [user, chat?.messages, actionData?.messages, guestMessages]);

  // Check if signup is required
  const requiresSignup = isGuest && (
    actionData?.requiresSignup || 
    (guestRemaining !== null && guestRemaining === 0) ||
    !canUseGuest
  );

  const currentGuestRemaining = actionData?.guestRemaining ?? guestRemaining ?? 10;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              to={user ? "/dashboard" : "/"} 
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
          <div className="flex items-center space-x-4">
            {isGuest && currentGuestRemaining !== null && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{currentGuestRemaining}</span> free conversations remaining
              </div>
            )}
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
          {/* Show greeting if no messages yet */}
          {displayMessages.length === 0 && (
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
                    Hello{onboardingData?.communicationStyle === "direct" ? "" : " there"}! I'm {companion.name}, {companion.description?.toLowerCase() || "your AI companion"}. 
                    {isGuest ? (
                      <> Try me out! You have <strong>{currentGuestRemaining}</strong> free conversations to get started.</>
                    ) : onboardingData?.goals ? (
                      ` I'm here to help you with ${onboardingData.goals.substring(0, 50)}...`
                    ) : (
                      " How are you feeling today?"
                    )}
                  </p>
                  {isGuest && (
                    <p className="text-sm text-gray-600 mt-2">
                      Sign up for unlimited conversations and personalized support!
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Just now</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Display conversation messages */}
          {displayMessages.map((msg: any, index: number) => {
            // Create unique key to prevent duplicates
            const msgKey = msg.id || `msg-${msg.role}-${msg.content.substring(0, 20)}-${index}`;
            
            return (
            <div
              key={msgKey}
              className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-3xl">
                <div
                  className={`rounded-2xl p-6 shadow-sm ${
                    msg.role === "USER"
                      ? "bg-blue-500 text-white rounded-br-lg"
                      : "bg-white border border-gray-200 rounded-tl-lg"
                  }`}
                >
                  {msg.role !== "USER" && (
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg">{companion.avatar}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{companion.name}</span>
                        <p className="text-gray-500 text-sm">AI Companion</p>
                      </div>
                    </div>
                  )}
                  <div
                    className={`text-base leading-relaxed ${
                      msg.role === "USER" ? "text-white" : "text-gray-800"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.content.split('\n').map((line: string, i: number, arr: string[]) => {
                      // Simple markdown-like formatting: **bold**
                      const formatLine = (text: string) => {
                        const parts: JSX.Element[] = [];
                        let key = 0;
                        const regex = /\*\*(.*?)\*\*/g;
                        let lastIndex = 0;
                        let match;
                        
                        while ((match = regex.exec(text)) !== null) {
                          // Add text before the match
                          if (match.index > lastIndex) {
                            parts.push(
                              <span key={key++}>{text.substring(lastIndex, match.index)}</span>
                            );
                          }
                          // Add bold text
                          parts.push(
                            <strong key={key++} className={msg.role === "USER" ? "font-semibold" : "font-semibold text-gray-900"}>
                              {match[1]}
                            </strong>
                          );
                          lastIndex = regex.lastIndex;
                        }
                        // Add remaining text
                        if (lastIndex < text.length) {
                          parts.push(
                            <span key={key++}>{text.substring(lastIndex)}</span>
                          );
                        }
                        
                        return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
                      };
                      
                      return (
                        <p key={i} className={i < arr.length - 1 ? "mb-3" : ""}>
                          {formatLine(line)}
                        </p>
                      );
                    })}
                  </div>
                  <div
                    className={`flex items-center space-x-2 text-sm mt-3 ${
                      msg.role === "USER" ? "text-blue-100 justify-end" : "text-gray-500"
                    }`}
                  >
                    {msg.role !== "USER" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <span>
                      {msg.role === "USER" ? "You" : companion.name} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
          
          {/* Typing Indicator */}
          {isTyping && !actionData && (
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
          {/* Signup Prompt for Guests */}
          {requiresSignup && (
            <div className="mb-4 p-4 bg-gradient-to-r from-sunrise-500 to-pastel-500 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold mb-1">You've used your {process.env.NODE_ENV === "development" ? "1000" : "10"} free conversations!</p>
                  <p className="text-sm text-white/90">
                    Sign up now for unlimited conversations, personalized support, and access to all AI companions.
                  </p>
                </div>
                <Link 
                  to="/register" 
                  className="ml-4 px-6 py-2 bg-white text-sunrise-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade Prompt for Authenticated Users */}
          {actionData?.requiresUpgrade && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    You've reached your usage limit
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Upgrade your plan to continue chatting with {companion.name}
                  </p>
                </div>
                <Link to="/pricing" className="btn-primary text-sm whitespace-nowrap">
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}

          <Form 
            method="post" 
            className="space-y-4"
            onSubmit={(e) => {
              // Ensure form submits even if validation passes
              if (!messageInput.trim()) {
                e.preventDefault();
                return false;
              }
            }}
          >
            {user && chat && <input type="hidden" name="chatId" value={chat.id} />}
            {isGuest && (
              <input 
                type="hidden" 
                name="previousMessages" 
                value={JSON.stringify(guestMessages)} 
              />
            )}
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="message"
                  placeholder={isGuest ? "Try asking me something... (free trial)" : "Type your message..."}
                  required
                  minLength={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-lg"
                  disabled={isSubmitting || requiresSignup || actionData?.requiresUpgrade}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Allow Enter to submit
                    if (e.key === "Enter" && !e.shiftKey && messageInput.trim() && !isSubmitting) {
                      e.preventDefault();
                      const form = e.currentTarget.closest("form");
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || requiresSignup || actionData?.requiresUpgrade}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSubmitting || requiresSignup || actionData?.requiresUpgrade
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
                <p className="text-sm text-red-800 font-medium">{actionData.error}</p>
                {actionData.details && (
                  <p className="text-xs text-red-600 mt-1">{actionData.details}</p>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {!requiresSignup && (
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
                    disabled={isSubmitting || requiresSignup || actionData?.requiresUpgrade}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}

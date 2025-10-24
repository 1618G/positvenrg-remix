/**
 * API Client for PositiveNRG Remix App
 * 
 * This client provides a centralized way to handle API calls,
 * both internal (Remix routes) and external (third-party services).
 * 
 * Features:
 * - Type-safe API calls
 * - Error handling and retry logic
 * - Request/response logging
 * - Environment-based configuration
 * - Authentication token management
 */

import { aiLogger, perfLogger } from "./logger.server";

// API Configuration
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Request options
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// API Response wrapper
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  success: boolean;
  error?: string;
}

// External API endpoints
interface ExternalApis {
  gemini: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  // Future external services can be added here
  // stripe: { ... }
  // analytics: { ... }
  // notifications: { ... }
}

class ApiClient {
  private config: ApiConfig;
  private externalApis: ExternalApis;

  constructor() {
    this.config = {
      baseUrl: process.env.API_BASE_URL || 'http://localhost:8780',
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
    };

    this.externalApis = {
      gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      },
    };
  }

  /**
   * Make a generic HTTP request with retry logic
   */
  private async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retries,
    } = options;

    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    perfLogger.info({
      requestId,
      method,
      url,
      timestamp: new Date().toISOString(),
    }, 'API request initiated');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();
        const duration = Date.now() - startTime;

        perfLogger.info({
          requestId,
          method,
          url,
          status: response.status,
          duration,
          attempt: attempt + 1,
        }, 'API request completed');

        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          success: response.ok,
          error: response.ok ? undefined : responseData.error || response.statusText,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const isLastAttempt = attempt === retries;

        perfLogger.error({
          requestId,
          method,
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          attempt: attempt + 1,
          isLastAttempt,
        }, 'API request failed');

        if (isLastAttempt) {
          return {
            data: null,
            status: 0,
            statusText: 'Request failed',
            headers: {},
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      data: null,
      status: 0,
      statusText: 'Request failed',
      headers: {},
      success: false,
      error: 'Maximum retries exceeded',
    };
  }

  /**
   * Internal API calls (Remix routes)
   */
  async internal<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    return this.request<T>(url, options);
  }

  /**
   * External API calls (third-party services)
   */
  async external<T>(
    service: keyof ExternalApis,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const serviceConfig = this.externalApis[service];
    const url = `${serviceConfig.baseUrl}${endpoint}`;
    
    // Add service-specific headers
    const headers = {
      ...options.headers,
    };

    if (service === 'gemini') {
      headers['x-goog-api-key'] = serviceConfig.apiKey;
    }

    return this.request<T>(url, { ...options, headers });
  }

  /**
   * Gemini AI API calls
   */
  async generateGeminiResponse(
    message: string,
    companionPersonality?: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = companionPersonality 
        ? `You are a positive energy AI companion. Your personality: ${companionPersonality}. Respond in a warm, supportive, and encouraging way. Keep responses concise but meaningful.`
        : "You are a positive energy AI companion. Respond in a warm, supportive, and encouraging way. Keep responses concise but meaningful.";

      const messages = [
        { role: "user", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message }
      ];

      const response = await this.external('gemini', `/models/${this.externalApis.gemini.model}:generateContent`, {
        method: 'POST',
        body: {
          contents: [{
            parts: [{
              text: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate response');
      }

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No response generated from AI');
      }

      const duration = Date.now() - startTime;
      aiLogger.info({
        messageLength: message.length,
        responseLength: aiResponse.length,
        duration,
        companionPersonality: companionPersonality?.substring(0, 50),
      }, 'AI response generated successfully');

      return aiResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      aiLogger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        messageLength: message.length,
      }, 'AI response generation failed');

      throw error;
    }
  }

  /**
   * Health check for external services
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Check Gemini API
    try {
      const response = await this.external('gemini', '/models', { timeout: 5000 });
      results.gemini = response.success;
    } catch {
      results.gemini = false;
    }

    return results;
  }

  /**
   * Get API status and configuration
   */
  getStatus() {
    return {
      config: {
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
        retries: this.config.retries,
      },
      externalApis: {
        gemini: {
          baseUrl: this.externalApis.gemini.baseUrl,
          model: this.externalApis.gemini.model,
          hasApiKey: !!this.externalApis.gemini.apiKey,
        },
      },
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in other files
export type { ApiResponse, RequestOptions, ExternalApis };

# 🔌 API Integration Guide

## Overview

The PositiveNRG Remix app includes a comprehensive API client system that provides:

- **Centralized API Management**: Single point for all API calls
- **Type Safety**: Full TypeScript support with proper typing
- **Error Handling**: Automatic retry logic and error recovery
- **Logging**: Comprehensive request/response logging
- **Health Monitoring**: Service health checks and status monitoring

## 🏗️ Architecture

### API Client Structure

```
app/lib/
├── api.client.ts          # Main API client
├── gemini.server.ts       # AI integration (updated to use API client)
├── auth.server.ts         # Authentication services
├── db.server.ts          # Database services
└── logger.server.ts      # Logging system
```

### External Services

- **Google Gemini AI**: AI response generation
- **PostgreSQL**: Database operations
- **JWT**: Authentication tokens

## 🚀 Usage Examples

### Basic API Calls

```typescript
import { apiClient } from "~/lib/api.client";

// Internal API call (Remix routes)
const response = await apiClient.internal('/api/companions');

// External API call (third-party services)
const response = await apiClient.external('gemini', '/models');
```

### AI Integration

```typescript
// Generate AI response with companion personality
const aiResponse = await apiClient.generateGeminiResponse(
  "How are you feeling today?",
  "Energetic, optimistic, and always ready to help",
  [
    { role: "user", content: "I'm feeling stressed" },
    { role: "assistant", content: "I understand you're feeling stressed..." }
  ]
);
```

### Health Monitoring

```typescript
// Check all external services
const healthStatus = await apiClient.healthCheck();
// Returns: { gemini: true, database: true, ... }

// Get API configuration
const status = apiClient.getStatus();
```

## 📊 API Status Dashboard

Visit `/api-status` to see:

- ✅ **System Status**: Overall health
- 🔧 **API Configuration**: Service endpoints and settings
- 🏥 **Service Health**: Individual service status
- 🔐 **Environment Status**: Configuration validation

## 🔧 Configuration

### Environment Variables

```env
# API Configuration
API_BASE_URL=http://localhost:8780

# External Services
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-jwt-secret
```

### API Client Settings

```typescript
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8780',
  timeout: 30000,        // 30 seconds
  retries: 3,           // Retry failed requests
  retryDelay: 1000,     // 1 second between retries
};
```

## 🛡️ Error Handling

### Automatic Retry Logic

- **Retries**: Up to 3 attempts for failed requests
- **Backoff**: Exponential backoff between retries
- **Timeout**: 30-second timeout per request
- **Fallback**: Graceful degradation when services are unavailable

### Error Types

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  success: boolean;
  error?: string;
}
```

## 📈 Logging & Monitoring

### Request Logging

All API calls are automatically logged with:

- **Request ID**: Unique identifier for tracking
- **Method & URL**: HTTP method and endpoint
- **Duration**: Response time in milliseconds
- **Status**: Success/failure status
- **Retry Attempts**: Number of retries used

### Performance Metrics

```typescript
// AI response timing
aiLogger.info({
  messageLength: message.length,
  responseLength: aiResponse.length,
  duration: responseTime,
  companionPersonality: personality,
}, 'AI response generated successfully');
```

## 🔄 Future Extensions

The API client is designed to easily support additional services:

### Payment Integration

```typescript
// Future Stripe integration
const payment = await apiClient.external('stripe', '/payment_intents', {
  method: 'POST',
  body: { amount: 2000, currency: 'usd' }
});
```

### Analytics Integration

```typescript
// Future analytics tracking
const analytics = await apiClient.external('analytics', '/events', {
  method: 'POST',
  body: { event: 'user_login', userId: '123' }
});
```

### Notification Services

```typescript
// Future push notifications
const notification = await apiClient.external('notifications', '/send', {
  method: 'POST',
  body: { userId: '123', message: 'New message from companion' }
});
```

## 🧪 Testing

### Health Check Endpoint

```bash
# Check API status
curl https://your-app.onrender.com/api-status

# Test AI integration
curl -X POST https://your-app.onrender.com/ai-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Local Development

```bash
# Start development server
pnpm dev

# Test API client
curl http://localhost:8780/api-status
```

## 📚 API Routes

### Internal Routes

- `/api-status` - API health and configuration
- `/ai-test` - AI integration testing
- `/db-test` - Database connection testing
- `/auth-test` - Authentication testing

### External Integrations

- **Gemini AI**: `https://generativelanguage.googleapis.com/v1beta`
- **Database**: PostgreSQL via Prisma
- **Authentication**: JWT tokens

## 🔒 Security

### API Key Management

- Environment variables for sensitive data
- No hardcoded credentials
- Secure token storage and transmission

### Request Validation

- Input sanitization
- Type checking
- Rate limiting (future enhancement)

## 📋 Best Practices

1. **Always use the API client** for external calls
2. **Handle errors gracefully** with fallback responses
3. **Monitor performance** with logging
4. **Test health endpoints** regularly
5. **Keep API keys secure** in environment variables

## 🚀 Deployment

The API client is production-ready and includes:

- ✅ **Error Recovery**: Automatic retry logic
- ✅ **Performance Monitoring**: Request timing and logging
- ✅ **Health Checks**: Service availability monitoring
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Scalability**: Designed for future service additions

---

*This API integration system provides a solid foundation for the PositiveNRG platform and can easily be extended to support additional services as the platform grows.*

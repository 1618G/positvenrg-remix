# Guest Access Feature - IP-Based Free Trial

## Overview
Users can now try the platform with **10 free conversations** before requiring signup. This is tracked by IP address to allow users to experience the service without registration.

## Implementation Details

### Database Schema
- Added `GuestUsage` model to track IP-based usage
- Fields: `ipAddress`, `conversationCount`, `lastUsedAt`
- Unique constraint on `ipAddress` to prevent duplicate entries

### Key Features

1. **IP Tracking**
   - Extracts IP from `x-forwarded-for` or `x-real-ip` headers
   - Falls back gracefully if headers unavailable
   - Stores in database for persistence

2. **Guest Access Flow**
   - Users can access `/chat/:companionId` without authentication
   - Each conversation increments the IP-based counter
   - After 10 conversations, shows signup prompt
   - Messages are not persisted for guests (in-memory only)

3. **User Experience**
   - Header shows remaining free conversations
   - Clear messaging about trial limit
   - Prominent signup prompt when limit reached
   - Seamless transition to authenticated experience after signup

### Code Structure

**New Files:**
- `app/lib/guest-tracking.server.ts` - IP tracking and conversation limit management

**Updated Files:**
- `app/routes/chat.$companionId.tsx` - Supports both guest and authenticated access
- `app/routes/companions._index.tsx` - Updated to show "Try Free" messaging

### API Functions

```typescript
// Get client IP from request
getClientIp(request: Request): string

// Check if guest can use another conversation
canGuestUseConversation(ipAddress: string): Promise<boolean>

// Get remaining conversations
getGuestRemainingConversations(ipAddress: string): Promise<number>

// Increment conversation count
incrementGuestConversationCount(ipAddress: string): Promise<{remaining, totalUsed}>
```

### Limits & Configuration

- **Free Conversations:** 10 per IP address
- **Reset Policy:** Manual only (for admin/testing)
- **Tracking:** Persistent in database
- **Cost:** Minimal (~$0.0015 per conversation with Gemini Flash)

### Testing

1. **Test Guest Access:**
   - Visit `/chat/:companionId` without logging in
   - Send 10 messages
   - Verify counter decreases in header
   - On 11th message, verify signup prompt appears

2. **Test IP Tracking:**
   - Use different IP addresses (VPN/proxy)
   - Verify each gets separate 10-conversation limit
   - Check database for `guest_usage` entries

3. **Test Transition:**
   - Use 5 conversations as guest
   - Sign up and login
   - Verify authenticated experience works
   - Verify guest usage doesn't interfere

### Security Considerations

1. **IP Spoofing:** IP addresses can be spoofed, but this is acceptable for a free trial
2. **VPN Abuse:** Users can use VPNs to get more free conversations - acceptable for trial period
3. **Rate Limiting:** Consider adding rate limiting per IP for abuse prevention
4. **Data Privacy:** Guest conversations are not stored long-term (in-memory only)

### Future Enhancements

1. **Cookie-based Tracking:** Add cookie fallback for IP detection issues
2. **Rate Limiting:** Prevent rapid-fire conversations from same IP
3. **Analytics:** Track conversion rate from guest to signup
4. **Resetting:** Admin interface to reset guest usage for legitimate users
5. **Email Capture:** Optional email capture after 5 conversations

### Business Impact

- **Conversion Funnel:** Lower barrier to entry increases signups
- **Cost:** ~$0.015 per guest (10 conversations) - very affordable
- **User Experience:** Users can evaluate before committing
- **Trust Building:** No credit card required for trial

---

**Status:** ✅ Implemented and ready for testing




# Local Development Checklist

## ✅ Completed Features (Ready for Testing)

### 1. User Registration & Onboarding ✅
- User registration with email/password
- Multi-step onboarding questionnaire (5 steps)
- Onboarding data stored in user profile
- Automatic redirect to onboarding for new users

**Test:** 
1. Register a new account at `/register`
2. Complete onboarding flow
3. Verify data saved in profile

### 2. User Profile & Dashboard ✅
- User profile page (`/profile`) with editable fields
- Enhanced dashboard with subscription/token info
- Usage statistics display
- Recent conversations display

**Test:**
1. Login and check dashboard shows subscription info
2. Visit `/profile` and update profile information
3. Verify onboarding data displays correctly

### 3. Chat System ✅
- **Authentication Required** - Chat now requires login
- **Message Persistence** - All messages stored in database
- **Conversation History** - Loads previous messages
- **Memory Integration** - Uses conversation summaries and context
- **Onboarding Personalization** - Responses tailored to user preferences

**Test:**
1. Login and start a chat with any companion
2. Send several messages
3. Refresh page - messages should persist
4. Start new chat - should create new conversation
5. Return to old chat - should see previous messages

### 4. Token Usage & Paywall ✅
- Token estimation based on message length
- Usage tracking in database
- Paywall enforcement - blocks when tokens exhausted
- Upgrade prompts when limit reached
- Cost estimation per conversation

**Test:**
1. Use up free tokens (10 tokens = ~2-3 conversations)
2. Try to send message when tokens exhausted
3. Verify upgrade prompt appears
4. Check dashboard shows remaining tokens

### 5. Personalized Responses ✅
- Communication style from onboarding
- Response length preferences
- Formality level
- Trigger avoidance
- Goals and needs integration

**Test:**
1. Complete onboarding with specific preferences
2. Chat with companion
3. Observe responses match your preferences
4. Try different communication styles in onboarding

## 🧪 Testing Commands

### Database Operations
```bash
# Generate Prisma Client (if schema changes)
npx prisma generate

# Push schema changes (development only)
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

### Development Server
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔍 Testing Scenarios

### Scenario 1: New User Flow
1. Register new account → Redirected to onboarding
2. Complete onboarding (all 5 steps)
3. Redirected to dashboard
4. Start first chat → Personalized greeting
5. Send messages → Token usage tracked
6. Check profile → Verify onboarding data saved

### Scenario 2: Returning User Flow
1. Login → Redirected to dashboard (or onboarding if incomplete)
2. View recent conversations
3. Continue existing chat → Messages load from database
4. Send new message → Uses conversation context

### Scenario 3: Token Limit Flow
1. Start with 10 free tokens
2. Send 2-3 messages (uses ~3-5 tokens each)
3. When tokens exhausted → Upgrade prompt appears
4. Cannot send more messages until upgrade

### Scenario 4: Personalization Flow
1. Complete onboarding with:
   - Communication: "direct"
   - Response length: "brief"
   - Formality: "professional"
2. Chat with companion → Responses should be direct, brief, professional
3. Update onboarding → Responses should change

## 🐛 Common Issues & Fixes

### Issue: Prisma Client not found
**Fix:** Run `npx prisma generate`

### Issue: Database connection error
**Fix:** Check `.env` file has correct `DATABASE_URL`

### Issue: Import errors with Prisma enums
**Fix:** Use `Prisma.SubscriptionPlan` instead of direct import (already fixed)

### Issue: Messages not persisting
**Fix:** 
1. Check database connection
2. Verify user is authenticated
3. Check chatId is being passed correctly

### Issue: Token count not updating
**Fix:**
1. Check subscription was created for user
2. Verify `consumeTokens` is being called
3. Check database for `usage_logs` entries

## 📊 Database Schema Verification

Verify these tables exist:
- ✅ `users` (with new fields: bio, location, onboardingCompleted, onboardingData)
- ✅ `subscriptions`
- ✅ `usage_logs`
- ✅ `chats`
- ✅ `messages`
- ✅ `companion_knowledge`
- ✅ `conversation_summaries`
- ✅ `user_preferences`

## 🚀 Next Steps for Production

1. **Stripe Integration** - Add payment processing
2. **Admin Knowledge Base** - Create CRUD interface
3. **Email Notifications** - Low token warnings, etc.
4. **Analytics** - Track usage patterns
5. **Testing** - Write unit/integration tests

## 🎯 Key Features Working Locally

- ✅ User registration & authentication
- ✅ Onboarding flow with data persistence
- ✅ User profiles with preferences
- ✅ Chat with authentication & persistence
- ✅ Token usage tracking & paywall
- ✅ Personalized AI responses
- ✅ Conversation memory & context
- ✅ Dashboard with stats & subscription info

## 💡 Tips for Local Testing

1. **Use Prisma Studio** to inspect database:
   ```bash
   npx prisma studio
   ```
   - View users, chats, messages, subscriptions
   - Verify onboarding data structure
   - Check token usage logs

2. **Test Token Consumption**:
   - Free tier starts with 10 tokens
   - Each conversation uses ~3-8 tokens
   - Monitor in dashboard or database

3. **Test Personalization**:
   - Complete onboarding with different preferences
   - Compare responses between users
   - Verify triggers are avoided

4. **Test Memory**:
   - Have long conversation (10+ messages)
   - Check conversation summaries are generated
   - Verify context is used in responses

---

**Ready for local testing!** All core features are implemented and should work. Test thoroughly before pushing to production.




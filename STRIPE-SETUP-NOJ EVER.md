# Stripe Setup - nojever Project ✅

## Account Information
- **Account ID**: `acct_1SOU19CSlJd8KoqS`
- **Project Name**: `nojever`
- **Organization**: `sliceof@zza.group`
- **Mode**: Test (Sandbox)

## API Keys

Add these to your `.env` file:

```bash
# Stripe Test Mode Keys (nojever project)
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs for Subscription Plans
STRIPE_PRICE_ID_STARTER=price_1SOU8eCSlJd8KoqS5hBOXcX4
STRIPE_PRICE_ID_PROFESSIONAL=price_1SOU8gCSlJd8KoqSD3d25zuf
STRIPE_PRICE_ID_PREMIUM=price_1SOU8iCSlJd8KoqSErMEmPUf

# Stripe Webhook Secret (get from: stripe listen --forward-to localhost:8780/api/webhooks/stripe -p nojever)
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Products Created

### 1. Starter Plan (`starter-plan`)
- **Price**: £10/month (1,000 pence)
- **Price ID**: `price_1SOU8eCSlJd8KoqS5hBOXcX4`
- **Interactions**: 1,000/month

### 2. Professional Plan (`professional-plan`)
- **Price**: £20/month (2,000 pence)
- **Price ID**: `price_1SOU8gCSlJd8KoqSD3d25zuf`
- **Interactions**: 2,500/month

### 3. Premium Plan (`premium-plan`)
- **Price**: £50/month (5,000 pence)
- **Price ID**: `price_1SOU8iCSlJd8KoqSErMEmPUf`
- **Interactions**: Unlimited

## Webhook Setup

### For Local Development

Start webhook forwarding:

```bash
stripe listen --forward-to localhost:8780/api/webhooks/stripe -p nojever
```

This will output a webhook signing secret like `whsec_...`. Add it to your `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Production

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret to your production `.env`

## Testing

### Test Card Numbers

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC

### Verify Setup

```bash
# List products
stripe products list -p nojever

# List prices
stripe prices list -p nojever

# Test webhook (in another terminal)
stripe trigger checkout.session.completed -p nojever
```

## Next Steps

1. ✅ Add all keys above to your `.env` file
2. ✅ Start webhook listener: `stripe listen --forward-to localhost:8780/api/webhooks/stripe -p nojever`
3. ✅ Copy webhook secret to `.env`
4. ✅ Restart dev server: `pnpm dev`
5. ✅ Test checkout at `/pricing`

## Key Expiry

**Note**: The API key expires on **2026-01-30** (90 days). You'll need to re-authenticate at that time.


# Stripe Setup Complete ✅

## Test Mode Credentials

Your Stripe sandbox/test mode is configured. Use these values in your `.env` file:

```bash
# Stripe Test Mode Keys (from stripe config)
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs for Subscription Plans
STRIPE_PRICE_ID_STARTER=price_1SOTzmFAbkIt42u7YZfIh4c7
STRIPE_PRICE_ID_PROFESSIONAL=price_1SOTznFAbkIt42u7Ki69p02f
STRIPE_PRICE_ID_PREMIUM=price_1SOTzqFAbkIt42u7zbrMM9Su
```

## Products Created

1. **Starter Plan** (`starter-plan`)
   - Price: £10/month (1,000 pence)
   - Price ID: `price_1SOTzmFAbkIt42u7YZfIh4c7`
   - Interactions: 1,000/month

2. **Professional Plan** (`professional-plan`)
   - Price: £20/month (2,000 pence)
   - Price ID: `price_1SOTznFAbkIt42u7Ki69p02f`
   - Interactions: 2,500/month

3. **Premium Plan** (`premium-plan`)
   - Price: £50/month (5,000 pence)
   - Price ID: `price_1SOTzqFAbkIt42u7zbrMM9Su`
   - Interactions: Unlimited

## Webhook Setup

### For Local Development

Forward Stripe webhooks to your local server:

```bash
stripe listen --forward-to localhost:8780/api/webhooks/stripe
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

## Testing Checkout

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC

## Next Steps

1. Add all the keys above to your `.env` file
2. Start your webhook listener: `stripe listen --forward-to localhost:8780/api/webhooks/stripe`
3. Copy the webhook secret to `.env`
4. Restart your dev server: `pnpm dev`
5. Test the checkout flow at `/pricing`

## Verify Setup

```bash
# List products
stripe products list

# List prices
stripe prices list

# Test webhook (in another terminal)
stripe trigger checkout.session.completed
```


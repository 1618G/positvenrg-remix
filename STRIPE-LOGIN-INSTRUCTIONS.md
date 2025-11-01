# Stripe CLI Login Instructions

## Login to Your Account

Run this command in your terminal:

```bash
stripe login --project-name nojever
```

## During Login:

1. **Browser will open** - Authorize the Stripe CLI
2. **Select Account**: Choose `acct_1SOU19CSlJd8KoqS`
3. **Select Organization**: Choose `sliceof@zza.group`
4. **Choose Mode**: Select **Test Mode** (sandbox)

## After Login:

Once logged in, create the subscription products:

```bash
# Create products
stripe products create --name "Starter Plan" --description "£10/month - 1,000 interactions" --id starter-plan
stripe products create --name "Professional Plan" --description "£20/month - 2,500 interactions" --id professional-plan
stripe products create --name "Premium Plan" --description "£50/month - Unlimited interactions" --id premium-plan

# Create prices
stripe prices create --product starter-plan --currency gbp --unit-amount 1000 --recurring.interval month
stripe prices create --product professional-plan --currency gbp --unit-amount 2000 --recurring.interval month
stripe prices create --product premium-plan --currency gbp --unit-amount 5000 --recurring.interval month
```

## Verify Config:

```bash
stripe config --list -p nojever
```

This will show your API keys for the nojever project.


-- Add missing interaction columns to subscriptions table if they don't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS "interactionsAllowed" INTEGER,
ADD COLUMN IF NOT EXISTS "interactionsUsed" INTEGER NOT NULL DEFAULT 0;


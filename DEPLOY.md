# Shorewatch Deployment Guide

## Step 1: Push to GitHub

Create a new private repo and push:

```bash
cd shorewatch
git init
git add .
git commit -m "Shorewatch Phase 1"
git remote add origin https://github.com/coralcare/shorewatch.git
git push -u origin main
```

## Step 2: Create Vercel Project

1. Go to vercel.com/new
2. Import the shorewatch repo from GitHub
3. Framework: Next.js (auto-detected)
4. Deploy (it will fail until env vars are set, that is fine)

## Step 3: Add Vercel KV

1. In your Vercel project, go to Storage tab
2. Click "Create Database" and pick KV (Redis)
3. Name it "shorewatch-kv"
4. Link it to the project. This auto-populates: KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN

## Step 4: Set Up Meta Developer App

This is the longest step. You need a Meta app to receive Instagram/Facebook webhooks.

1. Go to developers.facebook.com/apps and create a new app
2. App type: Business
3. Add the "Instagram Graph API" and "Webhooks" products
4. In Webhooks settings:
   - Object: Instagram
   - Callback URL: https://shorewatch.joincoralcare.com/api/v1/webhooks/meta
   - Verify token: (make one up, then set it as META_WEBHOOK_VERIFY_TOKEN in Vercel)
   - Subscribe to: comments, messages
5. In Instagram Graph API:
   - Connect both @joincoralcare and @growwithcoral business accounts
   - Generate long-lived access tokens for each
6. Note your App ID and App Secret

## Step 5: Get Anthropic API Key

1. Go to console.anthropic.com
2. Create an API key for Shorewatch
3. Set as ANTHROPIC_API_KEY

## Step 6: Slack Webhook

1. Go to api.slack.com/apps
2. Create a new app (or use existing Coral Care app)
3. Add Incoming Webhooks
4. Create a webhook for #shorewatch channel
5. Set as SLACK_WEBHOOK_URL

## Step 7: Configure All Environment Variables

In Vercel project settings, add these env vars:

```
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_verify_token
IG_PARENT_ID=joincoralcare
IG_PARENT_TOKEN=your_joincoralcare_ig_token
IG_PROVIDER_ID=growwithcoral
IG_PROVIDER_TOKEN=your_growwithcoral_ig_token
ANTHROPIC_API_KEY=sk-ant-your_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
NEXT_PUBLIC_APP_URL=https://shorewatch.joincoralcare.com
SETUP_SECRET=a_random_string_for_initial_admin_setup
```

KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN are auto-set by Vercel KV linkage.

## Step 8: Deploy

Push any commit or click "Redeploy" in Vercel. The build should pass.

## Step 9: Create Your Admin Account

Since this is invite-only auth, you need to bootstrap the first user. SSH into or use the Vercel CLI to run this one-time setup:

```bash
# Use the Vercel KV CLI or a one-time API route
# The app includes a SETUP_SECRET env var for this purpose

curl -X POST https://shorewatch.joincoralcare.com/api/v1/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "setupSecret": "your_SETUP_SECRET_value",
    "email": "jen@joincoralcare.com",
    "password": "your_secure_password",
    "name": "Jen Wirt"
  }'
```

Note: You will need to create the /api/v1/auth/setup route for initial bootstrap, or seed the KV database directly through the Vercel dashboard.

## Step 10: Custom Domain (Optional)

1. In Vercel project settings, go to Domains
2. Add shorewatch.joincoralcare.com
3. Add the CNAME record in your DNS (Webflow DNS or wherever joincoralcare.com is managed)

## What Works in Phase 1

- Login and session auth
- Team management and invites
- Unified inbox (Parent/Provider tabs)
- Thread management (read, flag, assign)
- AI draft generation (Claude)
- Draft editing and publishing to Instagram/Facebook
- Moderation classification
- Activity logging
- Slack alerts for flagged content

## What Comes Next (Phase 2+)

- Buffer API integration (content calendar, post analytics)
- HubSpot contact lookup in inbox
- Content brief queue in the UI
- Boost intelligence dashboard
- Market pre-warm scoring
- Analytics views

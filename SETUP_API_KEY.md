# Setting Up Your OpenAI API Key

## Quick Setup Guide

Follow these steps to configure your OpenAI API key for the AI feedback feature:

### Step 1: Get Your OpenAI API Key

If you don't already have one:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. Store it securely - you won't be able to see it again

### Step 2: Configure in Supabase Dashboard

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to your project: `wlocfudzuilpgsvseadn.supabase.co`
3. Click on **Edge Functions** in the left sidebar
4. Click **Manage secrets** button
5. Click **New secret** or **Add secret**
6. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI API key (starts with `sk-`)
7. Click **Save** or **Add secret**

### Step 3: Deploy the Edge Function

After adding the secret, you need to deploy (or redeploy) the Edge Function:

#### Option A: Using Supabase Dashboard
1. Stay in the **Edge Functions** section
2. Find `generate-pitch-feedback` function
3. Click **Deploy** or **Redeploy**

#### Option B: Using Supabase CLI (if installed)
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref wlocfudzuilpgsvseadn

# Deploy the function
supabase functions deploy generate-pitch-feedback
```

### Step 4: Verify It Works

1. Open your Pitch Arena application
2. Submit a test pitch
3. Wait for AI analysis to complete (10-30 seconds)
4. Check that you receive:
   - Strengths (3 items)
   - Weaknesses (3 items)
   - Recommendations (2-3 items)
   - Overall score (1-10)

### Troubleshooting

#### Still getting "API key not configured" error?

1. **Wait a moment**: After adding the secret, wait 1-2 minutes for it to propagate
2. **Redeploy**: Make sure you redeployed the Edge Function after adding the secret
3. **Check spelling**: Ensure the secret name is exactly `OPENAI_API_KEY` (case-sensitive)
4. **Verify key**: Test your OpenAI API key at https://platform.openai.com/playground

#### Getting "authentication failed" error?

1. **Check credits**: Verify you have credits in your OpenAI account
2. **Key validity**: Make sure your API key is active and not revoked
3. **Regenerate**: Try creating a new API key and updating the secret

#### Check Edge Function Logs

To see detailed error messages:

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click on `generate-pitch-feedback`
4. Click **Logs** tab
5. Look for error messages with pitch IDs

### Security Notes

- Never commit your OpenAI API key to version control
- Never share your API key publicly
- Regularly rotate your API keys
- Monitor your OpenAI usage to avoid unexpected charges
- Set up billing alerts in your OpenAI account

### Cost Estimates

The AI feedback feature uses GPT-4o which costs approximately:
- $0.01-0.03 per pitch analysis
- Typical usage: 300-500 tokens per request
- Monthly cost depends on pitch volume

Set up usage limits in your OpenAI dashboard to control costs.

## Need Help?

If you're still having issues:
1. Check the main [Deployment Guide](./DEPLOYMENT.md)
2. Review Edge Function logs in Supabase Dashboard
3. Verify your OpenAI account status and credits

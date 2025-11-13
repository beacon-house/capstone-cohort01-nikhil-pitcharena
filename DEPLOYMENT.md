# Pitch Arena Deployment Guide

## Prerequisites

Before deploying this application, ensure you have:

1. A Supabase account and project set up
2. An OpenAI API key with access to GPT-4o
3. Supabase CLI installed (optional, but recommended)

## Required Configuration

### 1. OpenAI API Key Setup

The application requires an OpenAI API key to generate AI-powered feedback on pitch submissions. Without this key, the AI feedback feature will not work.

#### Option A: Using Supabase Dashboard (Recommended)

1. Navigate to your Supabase project dashboard
2. Go to **Edge Functions** section
3. Click on **Manage secrets**
4. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-`)
5. Click **Save**

#### Option B: Using Supabase CLI

```bash
# Navigate to your project directory
cd /path/to/pitch-arena

# Set the OpenAI API key secret
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Deploy Edge Functions

After setting up the OpenAI API key, deploy the Edge Function:

```bash
# Deploy the generate-pitch-feedback function
supabase functions deploy generate-pitch-feedback
```

### 3. Verify Deployment

To verify the deployment is successful:

1. Submit a test pitch through the application
2. Check that AI feedback generation completes without errors
3. Review the Edge Function logs in Supabase Dashboard under **Edge Functions > Logs**

## Environment Variables

The following environment variables are required in your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These are automatically provided by Supabase when you create a project.

## Database Migrations

Ensure all migrations are applied:

```bash
# Apply all pending migrations
supabase db push
```

## Edge Function Environment Variables

The Edge Function automatically has access to:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations
- `OPENAI_API_KEY` - Your OpenAI API key (must be manually configured)

## Troubleshooting

### AI Feedback Generation Fails

**Symptom**: Pitches show "AI Analysis Failed" with error message about missing API key

**Solution**:
1. Verify the `OPENAI_API_KEY` secret is set in Supabase
2. Redeploy the Edge Function after setting the secret
3. Try submitting a new pitch or retry from the dashboard

**Check logs**:
```bash
supabase functions logs generate-pitch-feedback
```

### Invalid OpenAI API Key

**Symptom**: AI feedback fails with authentication error

**Solution**:
1. Verify your OpenAI API key is valid and active
2. Check you have sufficient credits in your OpenAI account
3. Ensure the key has access to GPT-4o model
4. Update the secret in Supabase and redeploy

### Rate Limiting

**Symptom**: AI feedback fails with rate limit error

**Solution**:
1. Check your OpenAI API rate limits
2. Consider upgrading your OpenAI plan
3. Users can retry after a few moments

## Production Checklist

Before going to production:

- [ ] OpenAI API key configured in Supabase secrets
- [ ] Edge Function deployed successfully
- [ ] All database migrations applied
- [ ] Test pitch submission with AI feedback generation
- [ ] Review Edge Function logs for any errors
- [ ] Set up monitoring for Edge Function failures
- [ ] Configure OpenAI API usage alerts
- [ ] Test retry functionality for failed AI feedback

## Support

For issues related to:
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **OpenAI API**: Check [OpenAI Documentation](https://platform.openai.com/docs)
- **Edge Functions**: Check [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)

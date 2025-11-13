# Pitch Arena

A platform for entrepreneurs to submit and get feedback on their startup pitches, featuring AI-powered analysis and community voting.

## Features

- **Multi-step Pitch Submission**: Guided form for creating comprehensive elevator pitches
- **AI-Powered Feedback**: Real-time pitch analysis using GPT-4o with detailed strengths, weaknesses, and recommendations
- **Community Voting**: Swipeable card interface for reviewing and voting on pitches
- **Leaderboard**: Top-ranked pitches based on community engagement
- **Entrepreneur Dashboard**: Track pitch performance with metrics and analytics

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env` and configure:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Configure OpenAI API Key** (Required for AI feedback):

   The AI feedback feature requires an OpenAI API key. Follow the [Deployment Guide](./DEPLOYMENT.md) to configure it in Supabase Edge Functions.

### Development

```bash
npm run dev
```

### Building

```bash
npm run build
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions, including:
- Setting up OpenAI API key in Supabase
- Deploying Edge Functions
- Database migrations
- Troubleshooting guide

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT-4o for pitch analysis
- **Auth**: Supabase Auth (Email/Password)

## Important Notes

- AI feedback generation requires a valid OpenAI API key configured in Supabase
- Without the API key, pitch submissions will work but AI analysis will fail
- See the [Deployment Guide](./DEPLOYMENT.md) for setup instructions

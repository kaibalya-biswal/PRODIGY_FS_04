# Environment Setup Guide

## Error Resolution
The error "Failed to construct 'URL': Invalid URL" occurs because the Supabase environment variables are not set.

## Quick Fix
Create a `.env` file in the root directory with your Supabase credentials:

```bash
# Create .env file in the root directory
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Steps to Get Your Supabase Credentials:

1. **Go to your Supabase project dashboard**
2. **Navigate to Settings > API**
3. **Copy the following values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Example .env file:
```
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ5NjAwMCwiZXhwIjoxOTUzMDcyMDAwfQ.example
```

## After creating the .env file:
1. Save the file
2. Restart your development server: `npm start`
3. The error should be resolved

## If you don't have a Supabase project yet:
1. Go to https://supabase.com
2. Create a new project
3. Follow the database setup instructions in README.md
4. Get your credentials from Settings > API 
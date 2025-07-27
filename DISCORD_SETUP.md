# Discord Schedule Updater Setup Guide

This guide explains how to set up automatic schedule updates from Discord using Cloudflare Workers.

## Prerequisites

1. **GitHub Repository** - Your code should be in a GitHub repository
2. **Cloudflare Account** - Free tier is sufficient
3. **Discord Server** - Where you'll send schedule update commands

## Setup Steps

### 1. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name like "Schedule Updater"
4. Select scopes: `repo` (full repository access)
5. Save the token securely - you'll need it for Cloudflare

### 2. Deploy Cloudflare Worker

1. Sign up/login to [Cloudflare](https://cloudflare.com)
2. Go to Workers & Pages → Create application → Create Worker
3. Name it something like "discord-schedule-updater"
4. Replace the default code with the content from `cloudflare-worker.js`
5. Click "Save and Deploy"

### 3. Configure Environment Variables

In your Cloudflare Worker dashboard:

1. Go to Settings → Variables
2. Add these environment variables:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `REPO_OWNER`: Your GitHub username (e.g., "ErielCruz")
   - `REPO_NAME`: Your repository name (e.g., "julia-schedule")

### 4. Set Up Discord Webhook

#### Option A: Simple Webhook (Recommended)
1. In your Discord server, go to Server Settings → Integrations → Webhooks
2. Create a new webhook for your schedule channel
3. Copy the webhook URL
4. Test by sending a POST request to your webhook URL with:
   ```json
   {
     "content": "!schedule Monday 8/5 - STREAM"
   }
   ```

#### Option B: Discord Bot (More Advanced)
If you want more control, create a Discord bot that listens for messages and forwards them to your Cloudflare Worker.

### 5. Connect Discord to Cloudflare Worker

You'll need to modify the Discord webhook to forward messages to your Cloudflare Worker. Here are two approaches:

#### Simple Approach: Manual Forwarding
Create a simple bot or use a webhook service that forwards Discord messages to your Worker URL.

#### Advanced Approach: Discord Bot
Create a Discord bot that:
1. Listens for messages starting with `!schedule`
2. Makes HTTP requests to your Cloudflare Worker

## Usage

Once set up, you can update your schedule from Discord by sending messages like:

```
!schedule Monday 8/5 - STREAM
!schedule Tuesday 8/6 - OFF
!schedule Wednesday 8/7 - COSPLAY STREAM
```

## Command Format

```
!schedule [Day] [Date] - [Activity]
```

Examples:
- `!schedule Monday 8/5 - STREAM`
- `!schedule Tuesday 8/6 - OFF`
- `!schedule Wednesday 8/7 - IRL DRESS TO IMPRESS`

## How It Works

1. You send a `!schedule` command in Discord
2. Discord webhook/bot forwards the message to Cloudflare Worker
3. Worker parses the command and updates `schedule.md` in GitHub
4. Your website automatically shows the updated schedule (since it reads from the same file)

## Testing

1. Deploy your website to GitHub Pages or similar
2. Send a schedule command in Discord
3. Check that the `schedule.md` file in GitHub gets updated
4. Verify your website shows the new schedule

## Troubleshooting

- Check Cloudflare Worker logs for errors
- Verify GitHub token has correct permissions
- Ensure Discord webhook is pointing to correct Worker URL
- Test the Worker directly by sending POST requests with schedule commands

## Security Notes

- Keep your GitHub token secure
- Consider adding authentication to your Worker endpoint
- Limit Discord webhook access to trusted users only

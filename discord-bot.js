// Simple Discord bot to forward schedule commands to Cloudflare Worker
// Install: npm install discord.js
// Usage: node discord-bot.js

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Configuration
const DISCORD_TOKEN = 'YOUR_DISCORD_BOT_TOKEN'; // Get from Discord Developer Portal
const CLOUDFLARE_WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL'; // Your deployed worker URL
const SCHEDULE_CHANNEL_ID = 'YOUR_CHANNEL_ID'; // ID of the channel to monitor

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process messages from the designated channel
  if (message.channel.id !== SCHEDULE_CHANNEL_ID) return;
  
  // Only process messages that start with !schedule
  if (!message.content.toLowerCase().startsWith('!schedule')) return;
  
  console.log(`Processing schedule command: ${message.content}`);
  
  try {
    // Forward the message to Cloudflare Worker
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
        },
        channel_id: message.channel.id,
      }),
    });
    
    const result = await response.text();
    
    if (response.ok) {
      // React with checkmark to indicate success
      await message.react('✅');
      console.log(`Schedule updated successfully: ${result}`);
    } else {
      // React with X to indicate failure
      await message.react('❌');
      console.error(`Failed to update schedule: ${result}`);
      
      // Optionally send error message
      await message.reply(`Error updating schedule: ${result}`);
    }
    
  } catch (error) {
    console.error('Error forwarding to Cloudflare Worker:', error);
    await message.react('❌');
    await message.reply('Error processing schedule update. Please try again.');
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(DISCORD_TOKEN).catch(console.error);

// Cloudflare Worker to handle Discord webhook and update GitHub repository
export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      
      // Verify this is a Discord webhook (basic verification)
      if (!body.content && !body.embeds) {
        return new Response('Invalid Discord webhook', { status: 400 });
      }

      // Extract message content
      const message = body.content || '';
      
      // Check if message starts with schedule command
      if (!message.toLowerCase().startsWith('!schedule')) {
        return new Response('Not a schedule command', { status: 200 });
      }

      // Parse the schedule command
      // Format: !schedule Day Date - Activity
      // Example: !schedule Monday 8/5 - STREAM
      const scheduleRegex = /!schedule\s+(\w+)\s+(\d{1,2}\/\d{1,2})\s*-\s*(.+)/i;
      const match = message.match(scheduleRegex);
      
      if (!match) {
        return new Response('Invalid schedule format. Use: !schedule Day Date - Activity', { status: 400 });
      }

      const [, day, date, activity] = match;
      
      // Update the schedule in GitHub
      const result = await updateScheduleInGitHub(day, date, activity, env);
      
      if (result.success) {
        return new Response(`Schedule updated: ${day} ${date} - ${activity}`, { status: 200 });
      } else {
        return new Response(`Failed to update schedule: ${result.error}`, { status: 500 });
      }
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};

async function updateScheduleInGitHub(day, date, activity, env) {
  try {
    // GitHub API configuration
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO_OWNER = env.REPO_OWNER || 'ErielCruz';
    const REPO_NAME = env.REPO_NAME || 'julia-schedule';
    const FILE_PATH = 'schedule.md';
    
    // Get current file content
    const getFileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getResponse = await fetch(getFileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Schedule-Updater'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get file: ${getResponse.status}`);
    }
    
    const fileData = await getResponse.json();
    const currentContent = atob(fileData.content);
    
    // Update the schedule content
    const updatedContent = updateScheduleContent(currentContent, day, date, activity);
    
    // Update file in GitHub
    const updateResponse = await fetch(getFileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Schedule-Updater',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update schedule: ${day} ${date} - ${activity}`,
        content: btoa(updatedContent),
        sha: fileData.sha
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update file: ${updateResponse.status}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('GitHub update error:', error);
    return { success: false, error: error.message };
  }
}

function updateScheduleContent(currentContent, day, date, activity) {
  const lines = currentContent.split('\n');
  let updated = false;
  
  // Look for existing entry for this day/date
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a heading that matches our day and date
    if (line.startsWith('###') && 
        line.toLowerCase().includes(day.toLowerCase()) && 
        line.includes(date)) {
      // Update the next line (activity)
      if (i + 1 < lines.length) {
        lines[i + 1] = activity.toUpperCase();
      } else {
        lines.push(activity.toUpperCase());
      }
      updated = true;
      break;
    }
  }
  
  // If no existing entry found, add new one
  if (!updated) {
    lines.push('');
    lines.push(`### ${day} ${date}`);
    lines.push(activity.toUpperCase());
  }
  
  return lines.join('\n');
}

// Fetch schedule.md and render as Markdown
async function fetchScheduleMarkdown() {
  try {
    const res = await fetch('schedule.md');
    if (!res.ok) {
      throw new Error('HTTP error ' + res.status);
    }
    const md = await res.text();
    renderScheduleMarkdown(md);
  } catch (e) {
    document.getElementById('schedule-list').innerHTML = '<p>Could not load schedule.<br>' + e + '</p>';
    console.error('Schedule fetch error:', e);
  }
}

function renderScheduleMarkdown(md) {
  const list = document.getElementById('schedule-list');
  // Parse markdown into tokens
  const tokens = marked.lexer(md);
  let html = '';
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading' && tokens[i].depth === 3) {
      // Find the next paragraph after the heading
      let title = marked.parser([tokens[i]]);
      let text = '';
      if (tokens[i+1] && tokens[i+1].type === 'paragraph') {
        text = marked.parser([tokens[i+1]]);
        i++; // Skip the paragraph token
      }
      html += `<div class="schedule-card">${title}${text}</div>`;
    }
  }
  list.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', fetchScheduleMarkdown);
// Embed latest YouTube Short

function embedLatestYouTubeShorts() {
  const container = document.getElementById('youtube-embeds');
  // Replace with actual latest Shorts video IDs
  const shortIds = [
    'zXL0Gf45Hso', // Most recent
    'SEDh1MhtqvA', // Second most recent
    'f6wasikmjLM'  // Third most recent
  ];
  container.innerHTML = shortIds.map(id => `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <iframe width="350" height="622" style="border-radius:12px;" src="https://www.youtube.com/embed/${id}?autoplay=0&mute=0" title="YouTube Short" frameborder="0" allowfullscreen></iframe>
    </div>
  `).join('');
  container.innerHTML += `<p style="width:100%;text-align:center;margin-top:1rem;"><a href="https://www.youtube.com/@JuliakinsMMA/shorts" target="_blank" style="color:#fff;">See all Shorts</a></p>`;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchScheduleMarkdown();
  embedLatestYouTubeShorts();
  initCustomVideoPlayer();
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

// Custom video player functionality
function initCustomVideoPlayer() {
  const overlay = document.getElementById('videoOverlay');
  const video = document.getElementById('lulVideo');
  
  overlay.addEventListener('click', () => {
    // Hide the overlay
    overlay.style.display = 'none';
    // Show and play the video
    video.style.display = 'block';
    video.play();
  });
  
  // Optional: Reset to overlay when video ends
  video.addEventListener('ended', () => {
    video.style.display = 'none';
    overlay.style.display = 'flex';
  });
}

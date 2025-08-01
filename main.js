// Fetch schedule.md and render as Markdown
async function fetchScheduleMarkdown() {
  const scheduleElement = document.getElementById('schedule-list');
  
  try {
    // Show loading state
    scheduleElement.innerHTML = '<div class="loading">Loading schedule...</div>';
    
    const res = await fetch('schedule.md');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    const md = await res.text();
    renderScheduleMarkdown(md);
  } catch (e) {
    console.error('Schedule fetch error:', e);
    scheduleElement.innerHTML = `
      <div class="error-message">
        <p>Could not load schedule.</p>
        <p class="error-details">${e.message}</p>
        <button onclick="fetchScheduleMarkdown()" class="retry-button">Try Again</button>
      </div>
    `;
  }
}

function renderScheduleMarkdown(md) {
  const list = document.getElementById('schedule-list');
  
  try {
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
    
    if (html.trim() === '') {
      html = '<div class="no-schedule">No schedule items found.</div>';
    }
    
    list.innerHTML = html;
  } catch (error) {
    console.error('Error rendering schedule markdown:', error);
    list.innerHTML = `
      <div class="error-message">
        <p>Error rendering schedule.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Embed latest YouTube Short
async function embedLatestYouTubeShorts() {
  const container = document.getElementById('youtube-embeds');
  
  try {
    // Show loading state
    container.innerHTML = '<div class="loading">Loading latest videos...</div>';
    
    // Fetch YouTube shorts from simple text file
    const response = await fetch('youtube-shorts.txt');
    if (!response.ok) {
      throw new Error(`Failed to load YouTube shorts: ${response.status}`);
    }
    const text = await response.text();
    const shortIds = text.trim().split('\n').filter(id => id.trim() !== '');
    
    const embedsHtml = shortIds.map(id => `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <iframe 
          width="350" 
          height="622" 
          style="border-radius:12px;" 
          src="https://www.youtube.com/embed/${id}?autoplay=0&mute=0&rel=0&modestbranding=1" 
          title="YouTube Short" 
          frameborder="0" 
          allowfullscreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation">
        </iframe>
      </div>
    `).join('');
    
    container.innerHTML = embedsHtml + `
      <p style="width:100%;text-align:center;margin-top:1rem;">
        <a href="https://www.youtube.com/@JuliakinsMMA/shorts" target="_blank" rel="noopener noreferrer" style="color:#fff;">
          See all Shorts
        </a>
      </p>
    `;
    
    // Add error handling for iframes
    const iframes = container.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
      iframe.addEventListener('error', () => {
        console.warn(`Failed to load YouTube embed ${shortIds[index]}`);
        iframe.style.display = 'none';
      });
    });
    
  } catch (error) {
    console.error('Error embedding YouTube shorts:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>Could not load latest videos.</p>
        <p><a href="https://www.youtube.com/@JuliakinsMMA/shorts" target="_blank" rel="noopener noreferrer" style="color:#fff;">Visit YouTube channel</a></p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    fetchScheduleMarkdown();
    await embedLatestYouTubeShorts();
    initCustomVideoPlayer();
    initTimeCounter();
    // initDiggingGameLink(); // Disabled - using HTML onclick instead
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  } catch (error) {
    console.error('Error initializing page:', error);
  }
});

// Custom video player functionality
function initCustomVideoPlayer() {
  const overlay = document.getElementById('videoOverlay');
  const video = document.getElementById('lulVideo');
  
  if (!overlay || !video) {
    console.warn('Video player elements not found');
    return;
  }
  
  overlay.addEventListener('click', () => {
    try {
      // Hide the overlay
      overlay.style.display = 'none';
      // Show and play the video
      video.style.display = 'block';
      
      // Handle play promise for better browser compatibility
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Video play failed:', error);
          // Show overlay again if play fails
          overlay.style.display = 'flex';
          video.style.display = 'none';
        });
      }
    } catch (error) {
      console.error('Error playing video:', error);
    }
  });
  
  // Reset to overlay when video ends
  video.addEventListener('ended', () => {
    video.style.display = 'none';
    overlay.style.display = 'flex';
  });
  
  // Handle video errors
  video.addEventListener('error', (e) => {
    console.error('Video error:', e);
    overlay.querySelector('.play-text').textContent = 'Video unavailable';
  });
}

// Time counter functionality
function initTimeCounter() {
  // Set the start date: December 12, 2024 at 14:29:00
  const startDate = new Date('2024-12-12T14:29:00');
  
  function updateCounter() {
    try {
      const now = new Date();
      const timeDiff = now.getTime() - startDate.getTime();
      
      // Calculate days, hours, minutes, and seconds
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      // Update the display
      const daysElement = document.getElementById('days');
      const hoursElement = document.getElementById('hours');
      const minutesElement = document.getElementById('minutes');
      const secondsElement = document.getElementById('seconds');
      
      if (daysElement && hoursElement && minutesElement && secondsElement) {
        daysElement.textContent = days;
        hoursElement.textContent = hours;
        minutesElement.textContent = minutes;
        secondsElement.textContent = seconds;
      }
    } catch (error) {
      console.error('Error updating time counter:', error);
    }
  }
  
  // Update immediately
  updateCounter();
  
  // Update every second (1000 milliseconds)
  setInterval(updateCounter, 1000);
}

// Initialize digging game link
/* function initDiggingGameLink() {
  const peepoDig = document.querySelector('.peepo-dig-gif');
  
  if (!peepoDig) {
    console.warn('PeepoDig gif not found');
    return;
  }
  
  // Make it clickable
  peepoDig.style.cursor = 'pointer';
  peepoDig.title = 'Click to play the hole digging game!';
  
  // Add click handler
  peepoDig.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to the digging game in the same tab
    window.location.href = 'digging-game.html';
  });
  
  // Add hover effect
  peepoDig.addEventListener('mouseenter', () => {
    peepoDig.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #9146ff)';
    peepoDig.style.transform = 'scale(1.1)';
  });
  
  peepoDig.addEventListener('mouseleave', () => {
    peepoDig.style.filter = '';
    peepoDig.style.transform = '';
  });
} */

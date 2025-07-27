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
  list.innerHTML = marked.parse(md);
}

document.addEventListener('DOMContentLoaded', fetchScheduleMarkdown);

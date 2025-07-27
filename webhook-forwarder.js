// Alternative: Simple webhook forwarder (no Discord bot required)
// This can be deployed as another Cloudflare Worker to act as a bridge

export default {
  async fetch(request, env) {
    // Handle CORS for testing
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      
      // This receives Discord webhook data and forwards to main worker
      console.log('Received webhook:', body);
      
      // Forward to main schedule updater worker
      const response = await fetch(env.SCHEDULE_UPDATER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const result = await response.text();
      
      return new Response(result, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
      
    } catch (error) {
      console.error('Webhook forwarder error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};

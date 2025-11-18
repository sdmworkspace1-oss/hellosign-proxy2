// File: /api/hellosign.js (Versi FINAL - Wajib 'await')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
  if (!GAS_WEB_APP_URL) {
    console.error('[FATAL] GAS_WEB_APP_URL is not set.');
    return res.status(500).send('Server configuration error.');
  }

  let body;
  let rawDataString;

  try {
    // 1. Baca body
    if (req.body && req.body.json) {
      rawDataString = req.body.json;
      body = JSON.parse(rawDataString);
    } else {
      body = req.body;
      rawDataString = JSON.stringify(body);
    }

    // 2. Handle 'callback_test'
    if (body.event && body.event.event_type === 'callback_test') {
      const challenge = body.event.event_data.challenge;
      console.log(`[INFO] Handling callback_test. Responding with challenge: ${challenge}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    const eventHash = body.event ? body.event.event_hash : 'unknown';
    console.log(`[INFO] Received event hash: ${eventHash}.`);

    // 3. [PENTING] Kita WAJIB 'await' fetch call ini.
    console.log(`[INFO] Forwarding to GAS... (awaiting response)`);
    
    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawDataString,
      });
      
      if (!response.ok) {
        const gasError = await response.text();
        console.error(`[ERROR_GAS] GAS responded with status: ${response.status}. Body: ${gasError}`);
        return res.status(502).send(`GAS Error (Status ${response.status}): ${gasError}`);
      }
      
      console.log(`[INFO_SUCCESS] GAS accepted the event (hash: ${eventHash}). Status: ${response.status}`);
      
    } catch (err) {
      console.error(`[ERROR_FETCH] Failed to forward event to GAS: ${err.message}`);
      return res.status(502).send(`Fetch Error: ${err.message}`);
    }

    // 4. Jika semua berhasil, baru kita balas ke Klien
    console.log(`[INFO] Responding 'Hello API Event Received' to client.`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('Hello API Event Received');

  } catch (error) {
    console.error(`[FATAL] Error in Vercel proxy handler: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
}

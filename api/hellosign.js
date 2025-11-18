// File: /api/hellosign.js (Versi Final - Fire-and-Forget)

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
      rawDataString = req.body.json; // Dari Dropbox Sign
      body = JSON.parse(rawDataString);
    } else {
      body = req.body; // Dari tes Postman/PowerShell
      rawDataString = JSON.stringify(body);
    }

    // 2. Handle 'callback_test'
    if (body.event && body.event.event_type === 'callback_test') {
      const challenge = body.event.event_data.challenge;
      console.log(`[INFO] Handling callback_test. Responding with challenge: ${challenge}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    // 3. Catat event yang masuk
    const eventType = body.event ? body.event.event_type : 'unknown';
    const eventHash = body.event ? body.event.event_hash : 'unknown';
    console.log(`[INFO] Received event type: ${eventType}, hash: ${eventHash}.`);

    // 4. [PENTING] Forward ke GAS (Fire and Forget)
    // Kita *tidak* menggunakan 'await' di sini.
    fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawDataString,
    })
    .then(response => {
      if (!response.ok) {
        console.error(`[ERROR_GAS] GAS responded with status: ${response.status}`);
      } else {
        console.log(`[INFO] GAS accepted the event (hash: ${eventHash}).`);
      }
    })
    .catch(err => {
      console.error(`[ERROR_FETCH] Failed to forward event (hash: ${eventHash}) to GAS: ${err.message}`);
    });

    // 5. Langsung Balas Cepat ke Klien (Dropbox Sign / PowerShell)
    console.log(`[SUCCESS] Responding 'Hello API Event Received' for hash: ${eventHash}.`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('Hello API Event Received');

  } catch (error) {
    console.error(`[FATAL] Error in Vercel proxy handler: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
}

// File: /api/hellosign.js (Versi dengan logging lebih baik)

export default async function handler(req, res) {
  // 1. Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Ambil URL GAS dari Environment Variables
  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
  if (!GAS_WEB_APP_URL) {
    console.error('[FATAL] GAS_WEB_APP_URL environment variable is not set.');
    return res.status(500).send('Server configuration error.');
  }

  let body;
  let rawDataString;

  try {
    // 3. Baca body (Dropbox Sign mengirim 'json=...' ATAU application/json)
    if (req.body && req.body.json) {
      rawDataString = req.body.json; // Ini adalah string: '{"event": ...}'
      body = JSON.parse(rawDataString);
    } else {
      // Fallback jika dikirim sebagai application/json murni
      // (Seperti yang akan kita lakukan di tes Postman/curl)
      body = req.body;
      rawDataString = JSON.stringify(body);
    }

    // 4. Handle 'callback_test'
    if (body.event && body.event.event_type === 'callback_test') {
      const challenge = body.event.event_data.challenge;
      console.log(`[INFO] Handling callback_test. Responding with challenge: ${challenge}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    // 5. [LOGGING BARU] Catat event yang masuk
    const eventType = body.event ? body.event.event_type : 'unknown';
    const eventHash = body.event ? body.event.event_hash : 'unknown';
    console.log(`[INFO] Received event type: ${eventType}, hash: ${eventHash}.`);

    // 6. Forward ke GAS (Fire and Forget)
    fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawDataString,
    })
    .then(response => {
      // Log ini terjadi *setelah* balasan dikirim ke Dropbox
      if (!response.ok) {
        console.error(`[ERROR_GAS] GAS responded with status: ${response.status}`);
      } else {
        console.log(`[INFO] GAS accepted the event (hash: ${eventHash}).`);
      }
    })
    .catch(err => {
      // Log ini terjadi jika Vercel bahkan tidak bisa *menghubungi* GAS
      console.error(`[ERROR_FETCH] Failed to forward event (hash: ${eventHash}) to GAS: ${err.message}`);
    });

    // 7. Balas Cepat ke Dropbox Sign
    console.log(`[SUCCESS] Responding 'Hello API Event Received' to Dropbox Sign for hash: ${eventHash}.`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('Hello API Event Received');

  } catch (error) {
    console.error(`[FATAL] Error in Vercel proxy handler: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
}

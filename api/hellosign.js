// File: /api/hellosign.js (Versi FINAL v3 - Perbaikan 'callback_test')
import { formidable } from 'formidable';

// 1. NONAKTIFKAN body parser default Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

// 2. Handler utama
export default async function handler(req, res) {
  // Cek URL GAS (tetap sama)
  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
  if (!GAS_WEB_APP_URL) {
    console.error('[FATAL] GAS_WEB_APP_URL is not set.');
    return res.status(500).send('Server configuration error.');
  }

  let body;
  let rawDataString;

  try {
    // --- [LOGIKA PARSING (SUDAH BENAR)] ---
    console.log('[INFO] Menerima request. Parsing dengan formidable (multipart/form-data)...');
    const form = formidable(); 
    const [fields, files] = await form.parse(req);

    if (!fields.json || !fields.json[0]) {
      throw new Error('Multipart/form-data diterima tapi field "json" tidak ditemukan.');
    }

    rawDataString = fields.json[0];
    body = JSON.parse(rawDataString);
    
    console.log('[INFO] Berhasil mem-parsing JSON dari field "json".');
    // --- [AKHIR LOGIKA PARSING] ---


    // 3. Handle 'callback_test' [DENGAN PERBAIKAN]
    if (body.event && body.event.event_type === 'callback_test') {
      
      // [PERBAIKAN DI SINI] Cek apakah 'event_data' dan 'challenge' ada
      if (body.event.event_data && body.event.event_data.challenge) {
        const challenge = body.event.event_data.challenge;
        console.log(`[INFO] Handling callback_test. Responding with challenge: ${challenge}`);
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(challenge);
      } else {
        // Ini terjadi jika tombol "Test" mengirim payload 'callback_test' yang tidak lengkap
        console.warn(`[WARN] 'callback_test' diterima tapi 'event_data.challenge' tidak ditemukan. Payload: ${rawDataString}`);
        // Kita tetap balas 'OK' agar HelloSign senang (walaupun secara teknis ini gagal)
        return res.status(200).send('Hello API Event Received (Test payload incomplete, ignored)');
      }
    }

    // --- Sisa kode (tetap sama) ---
    const eventHash = body.event ? body.event.event_hash : 'unknown';
    console.log(`[INFO] Received event hash: ${eventHash}.`);

    // 4. 'await' fetch call (tetap sama)
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

    // 5. Balas ke Klien (tetap sama)
    console.log(`[INFO] Responding 'Hello API Event Received' to client.`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('Hello API Event Received');

  } catch (error) {
    console.error(`[FATAL] Error in Vercel proxy handler: ${error.message}`);
    console.error(error.stack); 
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
}

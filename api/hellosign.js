// File: /api/hellosign.js (Versi FINAL v2 - dengan 'formidable')
import { formidable } from 'formidable';

// 1. [BARU] NONAKTIFKAN body parser default Vercel
// Ini penting agar 'formidable' bisa membaca stream-nya
export const config = {
  api: {
    bodyParser: false,
  },
};

// 2. Handler utama (tetap 'await')
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
    // --- [LOGIKA PARSING BARU] ---
    console.log('[INFO] Menerima request. Parsing dengan formidable (multipart/form-data)...');
    
    // Inisialisasi 'formidable'
    const form = formidable(); 
    
    // 'form.parse' akan membaca request (req)
    // dan mengembalikan 'fields' (data teks) dan 'files' (file)
    const [fields, files] = await form.parse(req);

    // HelloSign mengirim JSON sebagai field teks bernama "json"
    if (!fields.json || !fields.json[0]) {
      throw new Error('Multipart/form-data diterima tapi field "json" tidak ditemukan.');
    }

    // Ambil string JSON dari field "json"
    rawDataString = fields.json[0];
    body = JSON.parse(rawDataString);
    
    console.log('[INFO] Berhasil mem-parsing JSON dari field "json".');
    // --- [AKHIR LOGIKA PARSING BARU] ---


    // 3. Handle 'callback_test' (Logika ini sekarang akan berhasil)
    if (body.event && body.event.event_type === 'callback_test') {
      const challenge = body.event.event_data.challenge;
      console.log(`[INFO] Handling callback_test. Responding with challenge: ${challenge}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    const eventHash = body.event ? body.event.event_hash : 'unknown';
    console.log(`[INFO] Received event hash: ${eventHash}.`);

    // 4. [PENTING] Kita WAJIB 'await' fetch call ini.
    console.log(`[INFO] Forwarding to GAS... (awaiting response)`);
    
    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawDataString, // Kirim string JSON mentah ke GAS
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

    // 5. Jika semua berhasil, baru kita balas ke Klien
    console.log(`[INFO] Responding 'Hello API Event Received' to client.`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('Hello API Event Received');

  } catch (error) {
    console.error(`[FATAL] Error in Vercel proxy handler: ${error.message}`);
    console.error(error.stack); // Cetak stack trace untuk debug
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
}

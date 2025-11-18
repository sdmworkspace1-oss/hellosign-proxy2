// File: /api/hellosign.js (DIAGNOSTIC V2 - "CATCH-ALL")
// TUJUAN: Mencatat (log) format data yang dikirim HelloSign

export default async function handler(req, res) {
  try {
    // 1. Log semua yang kita bisa
    console.log('[DIAGNOSTIC_V2] Menerima request...');
    console.log(`[DIAGNOSTIC_V2] Method: ${req.method}`);
    
    // 2. Log HEADERS (terutama 'content-type')
    // Ini akan memberi tahu kita format datanya
    console.log(`[DIAGNOSTIC_V2] Headers: ${JSON.stringify(req.headers, null, 2)}`);
    
    // 3. Log BODY
    // Ini akan memberi tahu kita isi datanya
    console.log(`[DIAGNOSTIC_V2] Body (raw parsed): ${JSON.stringify(req.body, null, 2)}`);

  } catch (e) {
    console.error(`[DIAGNOSTIC_V2] CRITICAL ERROR saat logging: ${e.message}`);
  }
  
  // 4. SELALU balas OK
  // Ini untuk memuaskan HelloSign dan mencegah 'retry'
  // Kita sengaja mengabaikan 'challenge' untuk tes ini
  res.status(200).send('Diagnostic V2 OK. Cek Log Vercel.');
}

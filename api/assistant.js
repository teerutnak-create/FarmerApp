const PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
];

const SYSTEM = `คุณคือ "ผู้ช่วยเกษตรอัจฉริยะ" ในแอปบันทึกกิจกรรมของกลุ่มวิสาหกิจชุมชน ต.ผักไหม จ.บุรีรัมย์
- ตอบเป็นภาษาไทย ภาษาง่ายๆ ประโยคสั้น อ่านง่าย เป็นข้อๆ เหมาะกับเกษตรกร
- ไม่ต้องใส่เครื่องหมายดอกจัน ** หรือสัญลักษณ์ Markdown ที่อ่านยาก
- เชี่ยวชาญเรื่องข้าวหอมมะลิ 105 การทำนา ปุ๋ยหมัก น้ำหมักชีวภาพ การจัดการน้ำ ความชื้นข้าวเปลือก มาตรฐาน GAP
- ถ้าเป็นเรื่องโรคพืช/ศัตรูพืชที่ไม่แน่ใจ หรือเรื่องสารเคมี ให้แนะนำปรึกษาเจ้าหน้าที่เกษตรอำเภอ
- ห้ามแต่งตัวเลขหรือข้อมูลที่ไม่มั่นใจ ถ้าไม่รู้ให้บอกตรงๆ
- ใช้ข้อมูลของเกษตรกรด้านล่างประกอบคำตอบเมื่อเกี่ยวข้อง

ข้อมูลของเกษตรกรคนนี้:
`;

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function getAvailableFlashModels(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return PREFERRED_MODELS;
    const data = await res.json();
    const valid = (data.models || [])
      .filter((m) => {
        const name = m.name.toLowerCase();
        return (
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          name.includes('flash') &&
          !name.includes('tts') &&
          !name.includes('image') &&
          !name.includes('audio') &&
          !name.includes('robotics') &&
          !name.includes('computer')
        );
      })
      .map((m) => m.name.replace('models/', ''));

    if (valid.length === 0) return PREFERRED_MODELS;

    return [
      ...PREFERRED_MODELS.filter((p) => valid.includes(p)),
      ...valid.filter((v) => !PREFERRED_MODELS.includes(v)),
    ];
  } catch {
    return PREFERRED_MODELS;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).send('ยังไม่ได้ตั้งค่า GEMINI_API_KEY บน Vercel');
  }

  const { messages = [], context = '' } = req.body || {};

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const contents = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const modelsToTry = await getAvailableFlashModels(API_KEY);

    let data = null;
    let usedModel = '';
    let lastErrorDetail = '';

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      let ok = false;

      // ปิด thinkingBudget สำหรับตระกูล 2.5 เพื่อให้ได้คำตอบเต็มโควตาและเร็วที่สุด
      const genConfig = { maxOutputTokens: 4096 };
      if (model.includes('2.5')) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      const payload = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM + String(context).slice(0, 3000) }] },
        contents,
        generationConfig: genConfig,
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        let r;
        try {
          r = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': API_KEY,
            },
            body: payload,
            signal: AbortSignal.timeout(25000),
          });
        } catch (fetchErr) {
          lastErrorDetail = `Timeout/Network (${model}): ${fetchErr.message}`;
          break;
        }

        if (r.ok) {
          data = await r.json();
          ok = true;
          break;
        }

        const status = r.status;
        const errText = await r.text();
        lastErrorDetail = `HTTP ${status} (${model}): ${errText.slice(0, 200)}`;
        console.error('Gemini error:', lastErrorDetail);

        if (status === 403) {
          return res.status(500).send(`API Key มีปัญหา: ${lastErrorDetail}`);
        }
        if (status === 404 || status === 400) break;
        await sleep(1000);
      }

      if (ok && data) {
        usedModel = model;
        break;
      }
    }

    if (!usedModel || !data) {
      return res.status(503).send(`ไม่สามารถเชื่อมต่อ AI ได้ (${lastErrorDetail})`);
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const replyText = parts.map((p) => p.text || '').join('').trim();

    return res.status(200).send(replyText || 'ขออภัย ไม่สามารถสร้างคำตอบได้ในขณะนี้');
  } catch (e) {
    console.error(e);
    return res.status(500).send('เกิดข้อผิดพลาด: ' + e.message);
  }
}
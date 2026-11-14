import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const API_KEY = process.env.GEMINI_API_KEY;

// รายชื่อโมเดลที่จะลองตามลำดับ (เปลี่ยนได้ด้วยตัวแปร GEMINI_MODELS คั่นด้วยคอมมา)
const MODELS = (
  process.env.GEMINI_MODELS ||
  process.env.GEMINI_MODEL ||
  'gemini-3.8-flash,gemini-3.8-flash-lite,gemini-3.6-flash,gemini-3.5-flash-lite'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const SYSTEM = `คุณคือ "ผู้ช่วยเกษตรอัจฉริยะ" ในแอปบันทึกกิจกรรมของกลุ่มวิสาหกิจชุมชน ต.ผักไหม จ.บุรีรัมย์
- ตอบเป็นภาษาไทย ภาษาง่ายๆ ประโยคสั้น เหมาะกับเกษตรกร
- เชี่ยวชาญเรื่องข้าวหอมมะลิ 105 การทำนา ปุ๋ยหมัก น้ำหมักชีวภาพ การจัดการน้ำ ความชื้นข้าวเปลือก มาตรฐาน GAP
- ถ้าเป็นเรื่องโรคพืช/ศัตรูพืชที่ไม่แน่ใจ หรือเรื่องสารเคมี ให้แนะนำปรึกษาเจ้าหน้าที่เกษตรอำเภอ
- ห้ามแต่งตัวเลขหรือข้อมูลที่ไม่มั่นใจ ถ้าไม่รู้ให้บอกตรงๆ
- ใช้ข้อมูลของเกษตรกรด้านล่างประกอบคำตอบเมื่อเกี่ยวข้อง

ข้อมูลของเกษตรกรคนนี้:
`;

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

app.post('/api/assistant', async (req, res) => {
  const { messages = [], context = '' } = req.body;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  if (!API_KEY) {
    console.error('ยังไม่ได้ตั้ง GEMINI_API_KEY');
    return res.status(500).send('server not configured');
  }

  try {
    const contents = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM + String(context).slice(0, 3000) }] },
      contents,
      generationConfig: { maxOutputTokens: 800 },
    });

    let r = null;
    let usedModel = '';

    // ลองทีละโมเดล: ถ้า 503 (คนใช้เยอะ) / 429 (โควตา) / 404 (ไม่มีโมเดลนี้) ให้ข้ามไปตัวถัดไป
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      let ok = false;

      for (let attempt = 0; attempt < 2; attempt++) {
        r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': API_KEY,
          },
          body: payload,
        });

        if (r.ok) {
          ok = true;
          break;
        }

        const status = r.status;
        const errText = await r.text();
        console.error(`Gemini error ${status} (${model}):`, errText.slice(0, 300));

        // ผิดแบบที่ลองซ้ำไม่ช่วย (เช่น key ผิด) ให้หยุดเลย
        if (![503, 429, 404].includes(status)) {
          return res.status(500).send('เกิดข้อผิดพลาด');
        }
        if (status === 404) break; // ไม่มีโมเดลนี้ ข้ามไปตัวถัดไปทันที
        await sleep(1200);
      }

      if (ok) {
        usedModel = model;
        break;
      }
    }

    if (!usedModel) {
      return res.status(503).send('ผู้ช่วยกำลังมีคนใช้งานมาก ลองใหม่อีกครั้งสักครู่นะครับ');
    }

    console.log(`ตอบด้วยโมเดล: ${usedModel}`);

    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of r.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          const parts = JSON.parse(json).candidates?.[0]?.content?.parts || [];
          for (const p of parts) if (p.text) res.write(p.text);
        } catch {}
      }
    }
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).send('เกิดข้อผิดพลาด');
    else res.end();
  }
});

app.get('/health', (_, res) => res.send('ok'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on :${PORT} (models: ${MODELS.join(', ')})`));
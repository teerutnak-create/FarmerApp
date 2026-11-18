import { createClient } from '@supabase/supabase-js';

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 2 * 60 * 1000;

export async function getSensorContext() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return '';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('device_id, plot_id, moisture, recorded_at')
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    return '\n\nข้อมูลความชื้น ESP32: ไม่พบค่าที่บันทึกใน 24 ชั่วโมงล่าสุด ห้ามคาดเดาค่าปัจจุบัน';
  }

  const readingsByLocation = new Map();
  for (const reading of data) {
    const moisture = Number(reading.moisture);
    if (!Number.isFinite(moisture)) continue;

    const location = reading.plot_id || `อุปกรณ์ ${reading.device_id}`;
    if (!readingsByLocation.has(location)) {
      readingsByLocation.set(location, { latest: reading, values: [] });
    }
    readingsByLocation.get(location).values.push(moisture);
  }

  const summaries = [];
  for (const [location, group] of readingsByLocation) {
    const values = group.values;
    const latestTime = new Date(group.latest.recorded_at);
    const isStale = Date.now() - latestTime.getTime() > STALE_AFTER_MS;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const latestAt = latestTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    summaries.push(
      `- ${location}: ล่าสุด ${Number(group.latest.moisture).toFixed(1)}% เวลา ${latestAt}` +
        `${isStale ? ' (ข้อมูลเก่ากว่า 2 นาที อาจไม่ใช่ค่าปัจจุบัน)' : ''}; ` +
        `ย้อนหลัง 24 ชม. เฉลี่ย ${average.toFixed(1)}%, ต่ำสุด ${Math.min(...values).toFixed(1)}%, ` +
        `สูงสุด ${Math.max(...values).toFixed(1)}%, จำนวน ${values.length} ค่า`
    );
  }

  if (summaries.length === 0) {
    return '\n\nข้อมูลความชื้น ESP32: ข้อมูลที่ได้รับไม่ใช่ตัวเลขที่ใช้ได้ ห้ามคาดเดาค่าปัจจุบัน';
  }

  return `\n\nข้อมูลความชื้นจาก ESP32 (24 ชั่วโมงล่าสุด):\n${summaries.join('\n')}\nใช้ค่าล่าสุดเมื่อตอบคำถาม และแจ้งเมื่อข้อมูลเก่า ห้ามแต่งค่าที่ไม่มีในข้อมูล`;
}

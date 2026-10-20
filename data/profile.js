export const CROPS = ['ข้าวหอมมะลิ', 'ถั่วเหลือง'];
export const SEED_SOURCES = ['เก็บเอง', 'ศูนย์เมล็ดพันธุ์', 'ซื้อ'];
export const SOILS = ['ดินร่วน', 'ดินเหนียว', 'ดินทราย'];
export const CHEM_HISTORY = ['ไม่เคยใช้สารเคมี', 'เคยใช้ (หยุดแล้ว)', 'ยังใช้อยู่'];
export const FACILITIES = ['มีบ่อน้ำ', 'มีโซลาร์'];

export const STANDARDS = [
  'GAP',
  'Organic Thailand',
  'อินทรีย์สากล',
  'Fairtrade',
  'ปรับเปลี่ยนปีที่ 1 (T1)',
  'ปรับเปลี่ยนปีที่ 2 (T2)',
];
// มาตรฐานที่มีใบรับรองและวันหมดอายุ
export const CERT_STANDARDS = ['GAP', 'Organic Thailand', 'อินทรีย์สากล', 'Fairtrade'];

// เป้าผลผลิตข้าว (กก./ไร่) จากสรุปของ Gemini ควรตรวจกับทีมส่งเสริมอีกครั้ง
export const RICE_TARGET = { min: 350, max: 450 };
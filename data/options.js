// ตัวเลือกต่างๆ ในฟอร์ม (แก้ข้อความที่นี่ได้เลย)
export const PLOTS = ['แปลงหลังบ้าน', 'แปลงริมคลอง', 'แปลงหน้าหมู่บ้าน'];

export const ACTIVITIES = [
  { key: 'เตรียมดิน', icon: '🚜' },
  { key: 'ปลูก', icon: '🌱' },
  { key: 'ใส่ปุ๋ย', icon: '🧺' },
  { key: 'กำจัดวัชพืช', icon: '🌿' },
  { key: 'ให้น้ำ', icon: '💧' },
  { key: 'เก็บเกี่ยว', icon: '🌾' },
];

export const INPUTS = [
  { key: 'ปุ๋ยหมัก', unit: 'กระสอบ' },
  { key: 'แหนแดง', unit: 'กก.' },
  { key: 'น้ำหมักชีวภาพ', unit: 'ลิตร', selfMade: true },
  { key: 'ปอเทือง/ปุ๋ยพืชสด', unit: 'กก.' },
];

export const SOURCES = ['ทำเอง', 'ธนาคารปุ๋ยหมัก', 'ซื้อ'];
export const WATER = ['บ่อ', 'ธนาคารน้ำใต้ดิน', 'โซลาร์', 'น้ำฝน'];
export const WATER_LEVEL = ['ต่ำ', 'กลาง', 'สูง'];
export const PESTS = ['ไม่พบ', 'พบแมลง', 'พบโรค'];
export const LABOR = ['ทำเองในครอบครัว', 'จ้างแรงงาน', 'แทรกเตอร์', 'โดรน'];
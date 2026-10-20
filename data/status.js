// ตัดสินสถานะไฟจราจรของเกษตรกรแต่ละคนจากบันทึก
// หมายเหตุ: เกณฑ์ต่างๆ (3/7 วัน, ความชื้น 15%, เตือนใบรับรอง 6 เดือน, เป้าข้าว 350-450)
// เป็นค่าตั้งต้นสำหรับเดโม ก่อนใช้จริงต้องตรวจกับเอกสารมาตรฐานและทีมส่งเสริม
import { RICE_TARGET } from './profile';

export const COLORS = {
  green: '#16a34a',
  orange: '#f59e0b',
  red: '#dc2626',
  gray: '#9ca3af',
};

const DAY = 24 * 3600 * 1000;

// เอารายการล่าสุดของแต่ละแปลง (logs ต้องเรียงใหม่สุดก่อน)
function latestPerPlot(logs, type) {
  const seen = {};
  const out = [];
  for (const l of logs) {
    if (l.type === type && !seen[l.plot]) {
      seen[l.plot] = true;
      out.push(l);
    }
  }
  return out;
}

export function farmerStatus(farmerLogs, now = Date.now()) {
  // 1) บันทึกล่าสุด
  let record = { color: 'gray', text: 'ยังไม่มีบันทึก' };
  if (farmerLogs.length > 0) {
    const days = Math.floor((now - new Date(farmerLogs[0].time).getTime()) / DAY);
    const when = days <= 0 ? 'วันนี้' : days + ' วันที่แล้ว';
    if (days <= 3) record = { color: 'green', text: 'บันทึกล่าสุด: ' + when };
    else if (days <= 7) record = { color: 'orange', text: 'บันทึกล่าสุด: ' + when };
    else record = { color: 'red', text: 'ขาดบันทึก (' + when + ')' };
  }

  // 2) ความชื้นล่าสุด
  let moisture = { color: 'gray', text: 'ยังไม่วัดความชื้น' };
  const m = farmerLogs.find((l) => l.type === 'วัดความชื้น');
  if (m) {
    moisture =
      m.moisture <= 15
        ? { color: 'green', text: 'ความชื้น ' + m.moisture + '% (ผ่าน)' }
        : { color: 'red', text: 'ความชื้น ' + m.moisture + '% (เกิน 15%)' };
  }

  // 3) น้ำหมักที่ยังไม่แจ้ง ICS
  const pending = farmerLogs.filter((l) => l.icsPending).length;
  const ics =
    pending > 0
      ? { color: 'orange', text: 'ยังไม่แจ้ง ICS ' + pending + ' รายการ' }
      : { color: 'green', text: 'ไม่มีเรื่องค้าง ICS' };

  // 4) รูปแปลง
  const photos = farmerLogs.filter((l) => l.photoUri);
  let photo = { color: 'gray', text: 'ยังไม่มีรูปแปลง' };
  if (photos.length > 0) {
    photo = photos.some((l) => l.lat !== null && l.lat !== undefined)
      ? { color: 'green', text: 'มีรูปพร้อมพิกัด ' + photos.length + ' รูป' }
      : { color: 'orange', text: 'มีรูปแต่ไม่มีพิกัด' };
  }

  // 5) ใบรับรอง (ดูแปลงที่ใกล้หมดอายุที่สุด)
  let cert = { color: 'gray', text: 'ยังไม่กรอกข้อมูลแปลง' };
  const plots = latestPerPlot(farmerLogs, 'ข้อมูลแปลง');
  if (plots.length > 0) {
    const withCert = plots.filter((p) => p.certExpiry);
    if (withCert.length === 0) {
      cert = { color: 'gray', text: 'ยังไม่มีใบรับรอง' };
    } else {
      const soonest = withCert.reduce((a, b) =>
        new Date(a.certExpiry) < new Date(b.certExpiry) ? a : b
      );
      const months = Math.round((new Date(soonest.certExpiry).getTime() - now) / (30 * DAY));
      if (months < 0) {
        cert = { color: 'red', text: 'ใบรับรองหมดอายุแล้ว (' + soonest.plot + ')' };
      } else if (months <= 6) {
        cert = {
          color: 'orange',
          text: 'ใบรับรองหมดใน ~' + months + ' เดือน (' + soonest.plot + ') ต้องยื่นต่อ',
        };
      } else {
        cert = { color: 'green', text: 'ใบรับรองเหลือ ~' + months + ' เดือน' };
      }
    }
  }

  // 6) ผลผลิต (เทียบเป้าเฉพาะข้าว)
  let yieldLine = { color: 'gray', text: 'ยังไม่บันทึกผลผลิต' };
  const ys = latestPerPlot(farmerLogs, 'ผลผลิต');
  if (ys.length > 0) {
    const low = ys.find((y) => y.crop === 'ข้าวหอมมะลิ' && y.kgPerRai < RICE_TARGET.min);
    yieldLine = low
      ? {
          color: 'orange',
          text: 'ผลผลิตข้าว ' + low.kgPerRai + ' กก./ไร่ ต่ำกว่าเป้า ' + RICE_TARGET.min + '-' + RICE_TARGET.max,
        }
      : { color: 'green', text: 'บันทึกผลผลิตแล้ว ' + ys.length + ' แปลง' };
  }

  const lines = [record, moisture, ics, photo, cert, yieldLine];

  // สถานะรวม: แดง > ส้ม > เขียว (ถ้าไม่มีบันทึกเลย = เทา)
  const colors = lines.map((x) => x.color);
  let overall = 'green';
  if (record.color === 'gray') overall = 'gray';
  else if (colors.includes('red')) overall = 'red';
  else if (colors.includes('orange')) overall = 'orange';

  return { lines, overall };
}
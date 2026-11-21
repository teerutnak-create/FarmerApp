// api/trace.js
const TESTER_10_DAYS_LOGS = [
  {
    date: '20 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ตรวจเช็กความชื้นก่อนเก็บเกี่ยว',
    activityNote: 'เมล็ดข้าวสุกเหลืองสม่ำเสมอเกิน 85% พร้อมเก็บเกี่ยวตามมาตรฐาน GAP',
    input: 'งดใช้ปุ๋ยและสารทุกชนิด (ระยะปลอดภัยก่อนเก็บเกี่ยว)',
    selfMade: 'ไม่ได้ทำ',
    water: 'ระบายน้ำออกจากแปลงแห้งสนิทแล้ว',
    worker: 'แรงงานในครัวเรือน (2 คน)',
    moisture: 14.5,
  },
  {
    date: '19 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ตรวจแปลงและสุ่มตรวจโรคพืชด้วย AI',
    activityNote: 'ไม่พบอาการโรคไหม้และโรคใบจุดสีน้ำตาล ต้นข้าวสมบูรณ์แข็งแรง',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'แปลงแห้งพร้อมเกี่ยว',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 15.2,
  },
  {
    date: '18 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'จัดเตรียมลานตากและกระสอบสะอาด',
    activityNote: 'ทำความสะอาดผ้าใบและภาชนะบรรจุตามข้อกำหนด GAP หมวดที่ 5',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'ไม่ได้ทำ',
    worker: 'แรงงานในครัวเรือน (2 คน)',
    moisture: 16.0,
  },
  {
    date: '17 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ตรวจระดับน้ำและระบายน้ำออกจากแปลง',
    activityNote: 'เปิดคันนาระบายน้ำออกเพื่อให้พื้นดินแห้งก่อนนำรถเกี่ยวลง',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'ระบายน้ำออกสู่คลองไส้ไก่',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 22.4,
  },
  {
    date: '16 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ถอนวัชพืชและข้าวปนรอบคันนา',
    activityNote: 'กำจัดหญ้าข้าวนกและตัดข้าวพันธุ์ปนเพื่อรักษาคุณภาพเมล็ดพันธุ์',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'น้ำในแปลงระดับต่ำ (2 ซม.)',
    worker: 'แรงงานในครัวเรือน (3 คน)',
    moisture: 48.0,
  },
  {
    date: '15 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ฉีดพ่นน้ำหมักชีวภาพบำรุงรวง',
    activityNote: 'ฉีดพ่นช่วงเช้าตอนแดดอ่อน ช่วยให้เมล็ดเต่งและน้ำหนักดี',
    input: 'ไม่ได้ทำ',
    selfMade: 'น้ำหมักชีวภาพสูตรหน่อกล้วย + ฮอร์โมนไข่ (อัตรา 20 ซีซี/น้ำ 20 ลิตร)',
    water: 'น้ำจากสระน้ำในไร่นา',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 62.5,
  },
  {
    date: '14 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'สำรวจแมลงศัตรูพืช (เพลี้ยกระโดดสีน้ำตาล)',
    activityNote: 'เดินสุ่มตรวจ 5 จุดทั่วแปลง พบแมลงศัตรูธรรมชาติ (แมงมุม) ไม่พบการระบาด',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'น้ำขังระดับปกติ (5 ซม.)',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 65.0,
  },
  {
    date: '13 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ตรวจเช็กความสะอาดแหล่งน้ำและโรงเก็บ',
    activityNote: 'ตรวจสอบแหล่งน้ำชลประทาน ไม่มีคราบน้ำมันหรือสารปนเปื้อน',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'คลองชลประทาน ต.ผักไหม',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 67.8,
  },
  {
    date: '12 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'ใส่ปุ๋ยอินทรีย์เสริมระยะข้าวตั้งท้อง',
    activityNote: 'หว่านปุ๋ยอินทรีย์อัดเม็ดบางๆ บริเวณที่ต้นข้าวสีอ่อน',
    input: 'ปุ๋ยอินทรีย์อัดเม็ด (15 กก./ไร่)',
    selfMade: 'ไม่ได้ทำ',
    water: 'น้ำขังระดับปกติ (5 ซม.)',
    worker: 'แรงงานในครัวเรือน (2 คน)',
    moisture: 69.2,
  },
  {
    date: '11 พ.ย. 2569',
    plot: 'แปลง A1 (ข้าวหอมมะลิ 105)',
    activity: 'วัดความชื้นดินและบันทึกสภาพอากาศ',
    activityNote: 'อากาศแจ่มใส ลมพัดเบา ความชื้นดินเหมาะสมต่อการสร้างเมล็ด',
    input: 'ไม่ได้ทำ',
    selfMade: 'ไม่ได้ทำ',
    water: 'น้ำจากสระน้ำในไร่นา',
    worker: 'แรงงานในครัวเรือน (1 คน)',
    moisture: 70.1,
  },
];

const GAP_STANDARDS = [
  '1. แหล่งน้ำสะอาด ไร้สารปนเปื้อน',
  '2. พื้นที่ปลูกไม่มีประวัติสารพิษตกค้าง',
  '3. วัตถุอันตรายจัดเก็บมิดชิด',
  '4. จัดการคุณภาพก่อนการเก็บเกี่ยว',
  '5. ภาชนะบรรจุและสถานที่พักสะอาด',
];

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function handler(req, res) {
  const {
    mode = 'cert',
    lot = 'PKM-20261120-089-A1',
    farmer = 'ป้าเทสเตอร์',
    farmerId = 'FRM-TESTER-01',
    passed = '5',
    total = '5',
    days = '10',
  } = req.query;

  const safeLot = escapeHtml(lot);
  const safeFarmer = escapeHtml(farmer);
  const safeFarmerId = escapeHtml(farmerId);
  const safePassed = escapeHtml(passed);
  const safeTotal = escapeHtml(total);
  const safeDays = escapeHtml(days);

  const today = new Date();
  const issueDate = today.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const expireDate = nextYear.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const baseQuery = `lot=${encodeURIComponent(lot)}&farmer=${encodeURIComponent(farmer)}&farmerId=${encodeURIComponent(farmerId)}&passed=${encodeURIComponent(passed)}&total=${encodeURIComponent(total)}&days=${encodeURIComponent(days)}`;
  const certLink = `/api/trace?mode=cert&${baseQuery}`;
  const logsLink = `/api/trace?mode=logs&${baseQuery}`;

  const isCert = mode === 'cert';

  const certBody = `
    <div class="cert-card">
      <div class="cert-ribbon">✓ ผ่านการรับรองมาตรฐาน GAP</div>
      <div class="cert-emblem">🌾</div>
      <div class="cert-org">กลุ่มวิสาหกิจชุมชน ต.ผักไหม จ.บุรีรัมย์</div>
      <h1 class="cert-title">ใบรับรองการปฏิบัติทางการเกษตรที่ดี (GAP)</h1>
      <p class="cert-sub">เอกสารรับรองฉบับนี้แสดงว่าแปลงเพาะปลูกได้บันทึกกิจกรรมครบถ้วนและผ่านเกณฑ์การตรวจประเมิน</p>

      <div class="farmer-highlight">
        <div class="label">ชื่อเกษตรกรผู้ได้รับการรับรอง</div>
        <div class="name">คุณ${safeFarmer}</div>
        <div class="meta">รหัสเกษตรกร: ${safeFarmerId} · พันธุ์ข้าวหอมมะลิ 105</div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">รหัสล็อตสินค้า (Lot ID)</div>
          <div class="info-val green">${safeLot}</div>
        </div>
        <div class="info-box">
          <div class="info-label">ผลการตรวจประเมิน</div>
          <div class="info-val">ผ่าน ${safePassed}/${safeTotal} หมวด · บันทึกครบ ${safeDays} วัน</div>
        </div>
        <div class="info-box">
          <div class="info-label">วันที่ออกใบรับรอง</div>
          <div class="info-val">${issueDate}</div>
        </div>
        <div class="info-box">
          <div class="info-label">วันหมดอายุรับรอง</div>
          <div class="info-val">${expireDate}</div>
        </div>
      </div>

      <div class="section-title">รายการมาตรฐาน GAP ที่ผ่านการตรวจประเมิน</div>
      <ul class="gap-list">
        ${GAP_STANDARDS.map((item) => `<li><span class="check">✓</span><span>${item}</span></li>`).join('')}
      </ul>

      <div class="auditor-box">
        <div>
          <div class="info-label">ผู้ตรวจประเมินและอนุมัติ</div>
          <div class="info-val">เจ้าหน้าที่สมศรี (OFF-2026-0089)</div>
          <div class="auditor-role">Senior GAP Auditor · ระบบตรวจสอบย้อนกลับแปลงใจ</div>
        </div>
        <div class="stamp">VERIFIED<br/>GAP 2569</div>
      </div>

      <a class="cta-btn" href="${logsLink}">📅 ดูประวัติการบันทึกประจำวันย้อนหลัง (${TESTER_10_DAYS_LOGS.length} วัน) →</a>
    </div>
  `;

  const logsBody = `
    <div class="logs-header">
      <div class="pill-badge">📅 ระบบตรวจสอบย้อนกลับ (Traceability)</div>
      <h1>ประวัติการบันทึกประจำวัน</h1>
      <p>เกษตรกร: <strong>คุณ${safeFarmer}</strong> (${safeFarmerId})</p>
      <p class="lot-line">Lot ID: ${safeLot} · บันทึกต่อเนื่อง ${TESTER_10_DAYS_LOGS.length} วัน</p>
    </div>

    <div class="toolbar">
      <span class="toolbar-hint">แตะที่วันที่เพื่อดูรายละเอียดกิจกรรม</span>
      <button type="button" class="toggle-all-btn" onclick="toggleAll()">กางทั้งหมด</button>
    </div>

    <div class="log-list">
      ${TESTER_10_DAYS_LOGS.map(
        (log, idx) => `
        <details class="log-item" ${idx === 0 ? 'open' : ''}>
          <summary class="log-summary">
            <div class="date-badge">
              <span class="day-num">วันที่ ${TESTER_10_DAYS_LOGS.length - idx}</span>
              <span class="date-text">${escapeHtml(log.date)}</span>
            </div>
            <div class="summary-main">
              <div class="act-title">${escapeHtml(log.activity)}</div>
              <div class="act-meta">${escapeHtml(log.plot)} · ความชื้น ${log.moisture}%</div>
            </div>
            <div class="chevron">▾</div>
          </summary>
          <div class="log-detail">
            <div class="row"><span>แปลงที่ทำ</span><strong>${escapeHtml(log.plot)}</strong></div>
            <div class="row"><span>รายละเอียด</span><strong>${escapeHtml(log.activityNote)}</strong></div>
            <div class="row"><span>ปุ๋ย/ปัจจัยที่ใช้</span><strong>${escapeHtml(log.input)}</strong></div>
            <div class="row"><span>น้ำหมักชีวภาพ</span><strong>${escapeHtml(log.selfMade)}</strong></div>
            <div class="row"><span>แหล่งน้ำ/การจัดการน้ำ</span><strong>${escapeHtml(log.water)}</strong></div>
            <div class="row"><span>แรงงาน</span><strong>${escapeHtml(log.worker)}</strong></div>
            <div class="row"><span>ค่าความชื้นที่วัดได้</span><strong class="green">${log.moisture}%</strong></div>
          </div>
        </details>
      `
      ).join('')}
    </div>

    <a class="cta-btn outline" href="${certLink}">🏅 ดูใบรับรองมาตรฐาน GAP ของล็อตนี้ →</a>

    <script>
      let allOpen = false;
      function toggleAll() {
        allOpen = !allOpen;
        document.querySelectorAll('details.log-item').forEach((el) => {
          el.open = allOpen;
        });
        document.querySelector('.toggle-all-btn').textContent = allOpen ? 'ย่อทั้งหมด' : 'กางทั้งหมด';
      }
    </script>
  `;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isCert ? `ใบรับรอง GAP - คุณ${safeFarmer}` : `ประวัติการบันทึก - คุณ${safeFarmer}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f4f9f5;
      color: #0f172a;
      padding: 16px 14px 40px;
      line-height: 1.55;
    }
    .container { max-width: 540px; margin: 0 auto; }
    .cert-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 22px 18px;
      border: 2px solid #bbf7d0;
      box-shadow: 0 10px 28px rgba(20, 83, 45, 0.08);
      text-align: center;
    }
    .cert-ribbon {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    .cert-emblem { font-size: 40px; margin-bottom: 4px; }
    .cert-org { font-size: 12px; color: #166534; font-weight: 600; }
    .cert-title { font-size: 19px; color: #14532d; font-weight: 700; margin-top: 4px; }
    .cert-sub { font-size: 12px; color: #64748b; margin-top: 6px; }
    .farmer-highlight {
      margin: 16px 0;
      background: linear-gradient(135deg, #15803d, #16a34a);
      color: #ffffff;
      border-radius: 18px;
      padding: 16px;
    }
    .farmer-highlight .label { font-size: 11px; opacity: 0.85; }
    .farmer-highlight .name { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .farmer-highlight .meta { font-size: 12px; color: #dcfce7; margin-top: 4px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: left;
      margin-bottom: 16px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 12px;
    }
    .info-label { font-size: 11px; color: #64748b; }
    .info-val { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; word-break: break-word; }
    .green { color: #15803d !important; }
    .section-title {
      text-align: left;
      font-size: 13px;
      font-weight: 700;
      color: #14532d;
      margin-bottom: 8px;
    }
    .gap-list {
      list-style: none;
      text-align: left;
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      border-radius: 16px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .gap-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: #1e293b; }
    .gap-list .check {
      flex-shrink: 0;
      width: 20px; height: 20px;
      border-radius: 999px;
      background: #16a34a; color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700;
    }
    .auditor-box {
      display: flex; justify-content: space-between; align-items: center;
      text-align: left;
      background: #f8fafc;
      border: 1px dashed #86efac;
      border-radius: 14px;
      padding: 12px;
      margin-bottom: 16px;
      gap: 10px;
    }
    .auditor-role { font-size: 11px; color: #64748b; }
    .stamp {
      flex-shrink: 0;
      border: 2px solid #15803d;
      color: #15803d;
      font-size: 10px; font-weight: 700;
      padding: 6px 8px;
      border-radius: 10px;
      text-align: center;
      transform: rotate(-6deg);
    }
    .cta-btn {
      display: block;
      width: 100%;
      text-align: center;
      text-decoration: none;
      background: #16a34a;
      color: #ffffff;
      font-weight: 600;
      font-size: 13.5px;
      padding: 13px 16px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .cta-btn.outline {
      background: #ffffff;
      color: #15803d;
      border: 1.5px solid #16a34a;
      margin-top: 18px;
    }
    .logs-header {
      background: linear-gradient(135deg, #15803d, #16a34a);
      color: #ffffff;
      border-radius: 22px;
      padding: 20px 18px;
      margin-bottom: 14px;
    }
    .pill-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      font-size: 11px; font-weight: 600;
      padding: 4px 12px; border-radius: 999px;
      margin-bottom: 8px;
    }
    .logs-header h1 { font-size: 20px; font-weight: 700; }
    .logs-header p { font-size: 13px; color: #dcfce7; margin-top: 4px; }
    .lot-line { font-size: 11.5px !important; opacity: 0.9; }
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 10px; padding: 0 4px;
    }
    .toolbar-hint { font-size: 12px; color: #64748b; }
    .toggle-all-btn {
      background: #dcfce7; color: #15803d; border: none;
      font-family: inherit; font-size: 12px; font-weight: 600;
      padding: 6px 12px; border-radius: 999px; cursor: pointer;
    }
    .log-list { display: flex; flex-direction: column; gap: 10px; }
    .log-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 3px 10px rgba(20, 83, 45, 0.04);
    }
    .log-summary {
      list-style: none;
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      cursor: pointer;
    }
    .log-summary::-webkit-details-marker { display: none; }
    .date-badge {
      flex-shrink: 0;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 6px 8px;
      text-align: center;
      min-width: 82px;
    }
    .day-num { display: block; font-size: 10px; color: #16a34a; font-weight: 700; }
    .date-text { display: block; font-size: 11.5px; color: #14532d; font-weight: 600; }
    .summary-main { flex: 1; min-width: 0; }
    .act-title { font-size: 13.5px; font-weight: 600; color: #0f172a; }
    .act-meta { font-size: 11.5px; color: #64748b; margin-top: 2px; }
    .chevron { color: #16a34a; font-size: 16px; transition: transform 0.2s; }
    details[open] .chevron { transform: rotate(180deg); }
    .log-detail {
      border-top: 1px solid #f1f5f9;
      background: #fafffb;
      padding: 12px 14px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .row {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 12.5px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px;
    }
    .row:last-child { border-bottom: none; padding-bottom: 0; }
    .row span { color: #64748b; flex-shrink: 0; }
    .row strong { color: #1e293b; text-align: right; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    ${isCert ? certBody : logsBody}
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
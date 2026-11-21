const CACHE_DURATION_MS = 5 * 60 * 1000;
const REFERENCE_LOCATION = { latitude: 14.8743, longitude: 103.8397 };

let cachedAt = 0;
let cachedContext = '';

const WEATHER_CODES = {
  0: 'ท้องฟ้าแจ่มใส',
  1: 'ท้องฟ้าโปร่งเป็นส่วนใหญ่',
  2: 'มีเมฆบางส่วน',
  3: 'มีเมฆมาก',
  45: 'มีหมอก',
  48: 'มีหมอกน้ำค้างแข็ง',
  51: 'มีฝนปรอยเล็กน้อย',
  53: 'มีฝนปรอยปานกลาง',
  55: 'มีฝนปรอยหนาแน่น',
  56: 'มีฝนละอองเยือกแข็งเล็กน้อย',
  57: 'มีฝนละอองเยือกแข็งหนาแน่น',
  61: 'ฝนตกเล็กน้อย',
  63: 'ฝนตกปานกลาง',
  65: 'ฝนตกหนัก',
  66: 'ฝนเยือกแข็งเล็กน้อย',
  67: 'ฝนเยือกแข็งหนัก',
  71: 'หิมะตกเล็กน้อย',
  73: 'หิมะตกปานกลาง',
  75: 'หิมะตกหนัก',
  77: 'มีเกล็ดหิมะ',
  80: 'มีฝนตกเป็นช่วงเล็กน้อย',
  81: 'มีฝนตกเป็นช่วงปานกลาง',
  82: 'มีฝนตกเป็นช่วงหนัก',
  85: 'มีหิมะตกเป็นช่วงเล็กน้อย',
  86: 'มีหิมะตกเป็นช่วงหนัก',
  95: 'มีพายุฝนฟ้าคะนอง',
  96: 'มีพายุฝนฟ้าคะนองและลูกเห็บเล็กน้อย',
  99: 'มีพายุฝนฟ้าคะนองและลูกเห็บหนัก',
};

const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined || value === '') return 'ไม่มีข้อมูล';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : 'ไม่มีข้อมูล';
};

const formatTime = (value) => (typeof value === 'string' ? value.slice(11, 16) : 'ไม่มีข้อมูล');

const formatDate = (value) => {
  if (typeof value !== 'string') return 'ไม่ทราบวัน';
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
};

const getWeatherDescription = (code) => (
  code === null || code === undefined || code === ''
    ? 'ไม่มีข้อมูลสภาพฟ้า'
    : WEATHER_CODES[Number(code)] || 'ไม่มีข้อมูลสภาพฟ้า'
);

function createWeatherContext(data) {
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};
  const currentHour = String(current.time || '').slice(0, 13);
  const hourlyIndex = Array.isArray(hourly.time)
    ? hourly.time.findIndex((time) => time.startsWith(currentHour))
    : -1;
  const hourlyValue = (key) => (
    hourlyIndex >= 0 && Array.isArray(hourly[key]) ? hourly[key][hourlyIndex] : undefined
  );
  const currentWeather = [
    `อุณหภูมิ ${formatNumber(current.temperature_2m)} °C`,
    `รู้สึกเหมือน ${formatNumber(current.apparent_temperature)} °C`,
    getWeatherDescription(current.weather_code),
    `ฝนขณะนี้ ${formatNumber(current.rain)} มม.`,
    `โอกาสฝนชั่วโมงนี้ ${formatNumber(hourlyValue('precipitation_probability'), 0)}%`,
    `เมฆปกคลุม ${formatNumber(current.cloud_cover, 0)}%`,
    `ลม ${formatNumber(current.wind_speed_10m)} กม./ชม.`,
    `ทิศทางลม ${formatNumber(current.wind_direction_10m, 0)} องศา`,
    `ลมกระโชก ${formatNumber(current.wind_gusts_10m)} กม./ชม.`,
    `แสงแดด ${formatNumber(hourlyValue('shortwave_radiation'), 0)} วัตต์/ตร.ม.`,
    `ช่วงเวลา${Number(current.is_day) === 1 ? 'กลางวัน' : 'กลางคืน'}`,
  ].join('; ');

  const dailyForecasts = (Array.isArray(daily.time) ? daily.time : []).map((date, index) => {
    const min = daily.temperature_2m_min?.[index];
    const max = daily.temperature_2m_max?.[index];
    const sunshineHours = Number(daily.sunshine_duration?.[index]);
    const sunshine = Number.isFinite(sunshineHours)
      ? `${(sunshineHours / 3600).toFixed(1)} ชม.`
      : 'ไม่มีข้อมูล';

    return `- ${formatDate(date)}: ${getWeatherDescription(daily.weather_code?.[index])}, ` +
      `${formatNumber(min)} ถึง ${formatNumber(max)} °C, ` +
      `โอกาสฝนสูงสุด ${formatNumber(daily.precipitation_probability_max?.[index], 0)}%, ` +
      `ฝนสะสม ${formatNumber(daily.precipitation_sum?.[index])} มม., ` +
      `แดด ${sunshine}, UV สูงสุด ${formatNumber(daily.uv_index_max?.[index])}, ` +
      `พระอาทิตย์ขึ้น ${formatTime(daily.sunrise?.[index])} และตก ${formatTime(daily.sunset?.[index])}`;
  });

  const forecastTime = typeof current.time === 'string'
    ? `${formatDate(current.time.slice(0, 10))} ${current.time.slice(11, 16)} น.`
    : 'ไม่ระบุเวลา';

  return `\n\nข้อมูลพยากรณ์อากาศจาก Open-Meteo สำหรับจุดอ้างอิงส่วนกลางของแอป (ไม่ใช่พิกัดเฉพาะแปลง; เวลาอ้างอิง ${forecastTime}):\n` +
    `ขณะนี้: ${currentWeather}\n` +
    `พยากรณ์รายวัน:\n${dailyForecasts.join('\n')}\n` +
    'ใช้ข้อมูลนี้เมื่อตอบเรื่องอุณหภูมิ สภาพฟ้า ฝน ลม แสงแดด และ UV เท่านั้น ค่าความชื้น/ความชื้นดินให้อ้างอิงจากเซนเซอร์ ESP32 ที่แนบมาเท่านั้น ห้ามใช้หรือคาดเดาความชื้นจากข้อมูลอากาศ';
}

export async function getWeatherContext(signal) {
  if (cachedContext && Date.now() - cachedAt < CACHE_DURATION_MS) {
    return cachedContext;
  }

  const params = new URLSearchParams({
    latitude: String(REFERENCE_LOCATION.latitude),
    longitude: String(REFERENCE_LOCATION.longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'is_day',
      'rain',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: 'shortwave_radiation,precipitation_probability',
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'sunshine_duration',
      'uv_index_max',
      'sunrise',
      'sunset',
      'weather_code',
    ].join(','),
    timezone: 'Asia/Bangkok',
    forecast_days: '3',
  });
  const timeoutSignal = AbortSignal.timeout(8000);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: requestSignal,
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.current || !data.daily) {
    throw new Error('Open-Meteo response is missing current or daily weather');
  }

  cachedContext = createWeatherContext(data);
  cachedAt = Date.now();
  return cachedContext;
}

import { Alert, Platform } from 'react-native';

// แจ้งเตือนที่ใช้ได้ทั้งเว็บและมือถือ
export function notify(title, message, onOk) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    if (onOk) onOk();
  } else {
    Alert.alert(
      title,
      message,
      onOk ? [{ text: 'ตกลง', onPress: onOk }] : undefined
    );
  }
}

// 🟢 ฟังก์ชันดึงค่าความชื้นแบบ Real-time (มี Mock Data สำรองป้องกัน Error)
export async function fetchLiveMoisture() {
  try {
    // หากต้องการต่อ API จริง ให้ปลดคอมเมนต์บรรทัดด้านล่างนี้
    /*
    const response = await fetch('https://your-actual-api.com/api/sensor/moisture');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.moisture;
    */

    // 🟢 จำลองค่าความชื้นสุ่มระหว่าง 13.0 - 15.0 % สำหรับทดสอบหน้าจอ
    const mockMoisture = (13 + Math.random() * 2).toFixed(1);
    return mockMoisture;
  } catch (error) {
    console.error('Error fetching live moisture:', error);
    return null;
  }
}
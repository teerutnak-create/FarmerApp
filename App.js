import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
// ถ้ามีหน้าของเจ้าหน้าที่ ให้เปิดบรรทัดนี้ (แก้ชื่อไฟล์ให้ตรง)
// import OfficerScreen from './screens/OfficerScreen';

// key ที่ใช้จำการล็อกอินเท่านั้น
// ห้ามใส่ 'registered_users' เพราะเป็นที่เก็บบัญชีที่สมัครไว้ จะหายหมด
const SESSION_KEYS = ['user', 'token', 'session', 'currentUser'];

export default function App() {
  const [user, setUser] = useState(null); // null = แสดงหน้า sign in
  const [logs, setLogs] = useState([]);
  const [ready, setReady] = useState(false);
  const appState = useRef(AppState.currentState);

  // ล้าง session ทั้งใน storage และ state แล้วกลับหน้า sign in
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(SESSION_KEYS);
    } catch (e) {
      console.warn('clear session failed', e);
    }
    setLogs([]);
    setUser(null);
  }, []);

  // เปิดแอปครั้งใหม่: ล้าง session เก่าทิ้งเสมอ แล้วค่อยแสดงหน้าจอ
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.multiRemove(SESSION_KEYS);
      } catch (e) {
        console.warn('clear session on start failed', e);
      }
      setReady(true);
    })();
  }, []);

  // ออกจากแอป (ไปพื้นหลัง/สลับแอป/ปิดแอป) = ล็อกเอ้าต์อัตโนมัติ
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active';
      appState.current = nextState;
      if (wasActive && nextState === 'background') {
        clearSession();
      }
    });
    return () => sub.remove();
  }, [clearSession]);

  // เรียกจาก LoginScreen เมื่อ sign in / sign up สำเร็จ (ไม่เก็บลง storage)
  const handleLogin = (loggedInUser) => setUser(loggedInUser);

  // เรียกจากปุ่มออกจากระบบ
  const handleLogout = () => clearSession();

  // บันทึกกิจกรรม
  const handleLog = (type, data = {}) => {
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        type,
        time: new Date().toISOString(),
        user: user?.id,
        ...data,
      },
      ...prev,
    ]);
  };

  if (!ready) return null;

  // ยังไม่ล็อกอิน -> หน้า sign in
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ถ้ามีหน้าเจ้าหน้าที่ ให้เปิดบล็อกนี้
  // if (user.role === 'officer') {
  //   return <OfficerScreen user={user} logs={logs} onLogout={handleLogout} />;
  // }

  return (
    <FarmerScreen
      user={user}
      logs={logs}
      onLog={handleLog}
      onLogout={handleLogout}
    />
  );
}
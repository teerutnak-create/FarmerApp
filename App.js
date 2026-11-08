import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
import OfficerScreen from './screens/OfficerScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // ตัวแปร State กลางที่เก็บข้อมูลของ "ทุกคน" เอาไว้
  const [logs, setLogs] = useState([]);

  // 🟢 [เพิ่มใหม่] ดึงข้อมูลเริ่มต้นจาก localStorage และเพิ่มระบบ Sync ข้อมูล Real-time ข้ามหน้าต่าง/Tab
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const savedLogs = window.localStorage.getItem('app_logs');
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        }
      } catch (e) {
        console.warn('Load local storage error:', e);
      }

      const handleStorageChange = (e) => {
        if (e.key === 'app_logs' && e.newValue) {
          try {
            setLogs(JSON.parse(e.newValue));
          } catch (err) {
            console.warn('Sync storage error:', err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // 🟢 [เพิ่มใหม่] ฟังก์ชันช่วยบันทึกข้อมูลและส่งสัญญาณซิงค์ไปยัง Tab อื่นๆ
  const saveLogsAndSync = (newLogs) => {
    setLogs(newLogs);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('app_logs', JSON.stringify(newLogs));
      } catch (e) {
        console.warn('Save local storage error:', e);
      }
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 1. ฟังก์ชันให้ "เกษตรกร" บันทึกข้อมูลตัวเอง
  const handleLog = (type, data) => {
    const category = (type === 'วัดความชื้น' || data.moisture !== undefined) ? 'SENSOR' : 'ACTIVITY';
    
    const newLog = { 
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      category,
      type, 
      ...data, 
      time: new Date().toISOString(),
      farmerId: currentUser.id
    };
    saveLogsAndSync([newLog, ...logs]);
  };

  // 2. ฟังก์ชันให้ "เจ้าหน้าที่" บันทึกข้อมูลแทนเกษตรกร
  const handleSaveLogForFarmer = (farmerId, farmerName, type, data) => {
    const category = (type === 'วัดความชื้น' || data.moisture !== undefined) ? 'SENSOR' : 'ACTIVITY';

    const newLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category,
      type,
      ...data,
      time: new Date().toISOString(),
      farmerId: farmerId,
      recordedBy: currentUser.id
    };
    saveLogsAndSync([newLog, ...logs]);
  };

  // 3. เพิ่มฟังก์ชันอัปเดต/แก้ไขข้อมูลที่มีอยู่เดิม
  const handleUpdateLog = (logId, updatedData) => {
    const updatedLogs = logs.map((log) => {
      if (log.id === logId) {
        return {
          ...log,
          ...updatedData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.id,
        };
      }
      return log;
    });
    saveLogsAndSync(updatedLogs);
  };

  // ฟังก์ชันล้างข้อมูลทั้งหมด
  const handleClearLogs = () => {
    saveLogsAndSync([]);
  };

  // 4. ฟังก์ชันลบข้อมูลประจำวันทั้งรายการ
  const handleDeleteLog = (logId) => {
    const updatedLogs = logs.filter(log => log.id !== logId);
    saveLogsAndSync(updatedLogs);
  };

  // 🟢 5. เพิ่มฟังก์ชันเลือกลบเฉพาะกิจกรรมย่อยที่ไม่ต้องการ
  const handleDeleteActivityField = (logId, fieldKey) => {
    const updatedLogs = logs.map((log) => {
      if (log.id === logId) {
        const updatedLog = { ...log };
        delete updatedLog[fieldKey];
        return updatedLog;
      }
      return log;
    });
    saveLogsAndSync(updatedLogs);
  };

  // 🟢 [เพิ่มใหม่] ฟังก์ชันสำหรับกดปุ่ม Refresh / Sync ด้วยตัวเอง
  const handleRefreshLogs = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const savedLogs = window.localStorage.getItem('app_logs');
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        }
      } catch (e) {
        console.warn('Manual refresh error:', e);
      }
    }
  };

  // 🔵 [เพิ่มใหม่] ระบบ Sync เสริมแบบ Real-time ข้ามหน้าต่าง (ไม่แก้ฟังก์ชันเดิม)
  const lastSyncedRef = React.useRef(JSON.stringify([]));
  const syncChannelRef = React.useRef(null);

  // ดึงข้อมูลล่าสุดจาก localStorage มาใส่ state (ถ้ามีการเปลี่ยนแปลงจริง)
  const pullLogsFromStorage = React.useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('app_logs');
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      const normalized = JSON.stringify(parsed);
      if (normalized === lastSyncedRef.current) return; // ไม่มีอะไรเปลี่ยน
      lastSyncedRef.current = normalized;
      setLogs(parsed);
    } catch (e) {
      console.warn('Pull sync error:', e);
    }
  }, []);

  // ตั้งตัวรับสัญญาณ: BroadcastChannel + focus + polling สำรอง
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('app_logs_sync');
      syncChannelRef.current = channel;
      channel.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'LOGS_UPDATED') {
          pullLogsFromStorage();
        }
      };
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') pullLogsFromStorage();
    };
    window.addEventListener('focus', pullLogsFromStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    const timer = setInterval(pullLogsFromStorage, 2000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', pullLogsFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channel) channel.close();
      syncChannelRef.current = null;
    };
  }, [pullLogsFromStorage]);

  // เมื่อ logs เปลี่ยน (ไม่ว่าใครบันทึก/แก้/ลบ) ให้แจ้งหน้าต่างอื่นทันที
  useEffect(() => {
    const json = JSON.stringify(logs);
    if (json === lastSyncedRef.current) return; // มาจากการ sync เข้า ไม่ต้องส่งต่อ (กันวนลูป)
    lastSyncedRef.current = json;
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type: 'LOGS_UPDATED' });
    }
  }, [logs]);

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    // ฝั่งเจ้าหน้าที่ (Officer)
    if (currentUser.role === 'officer' || currentUser.type === 'officer') {
      return (
        <OfficerScreen
          user={currentUser}
          logs={logs}
          onLogout={handleLogout}
          onSaveLogForFarmer={handleSaveLogForFarmer}
          onUpdateLog={handleUpdateLog}
          onClear={handleClearLogs}
          onDeleteLog={handleDeleteLog}
          onDeleteActivityField={handleDeleteActivityField}
          onRefresh={handleRefreshLogs}
        />
      );
    }

    // ฝั่งเกษตรกร (Farmer)
    return (
      <FarmerScreen
        user={currentUser}
        logs={logs}
        onLog={handleLog}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
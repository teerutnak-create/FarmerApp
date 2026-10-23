import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
import OfficerScreen from './screens/OfficerScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // ตัวแปร State กลางที่เก็บข้อมูลของ "ทุกคน" เอาไว้
  const [logs, setLogs] = useState([]);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 🟢 1. ฟังก์ชันให้ "เกษตรกร" บันทึกข้อมูลตัวเอง
  const handleLog = (type, data) => {
    const newLog = { 
      id: Date.now().toString(), 
      type, 
      ...data, 
      time: new Date().toISOString(),
      farmerId: currentUser.id // <--- จุดสำคัญ: ประทับตรารหัสเกษตรกรลงไป
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // 🟢 2. ฟังก์ชันให้ "เจ้าหน้าที่" บันทึกข้อมูลแทนเกษตรกร
  const handleSaveLogForFarmer = (farmerId, farmerName, type, data) => {
    const newLog = {
      id: Date.now().toString(),
      type,
      ...data,
      time: new Date().toISOString(),
      farmerId: farmerId, // <--- ประทับตรารหัสเกษตรกรเป้าหมาย
      recordedBy: currentUser.id // บอกว่าเจ้าหน้าที่คนไหนเป็นคนจดให้
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // ฟังก์ชันล้างข้อมูลทั้งหมด (เผื่อไว้ใช้ตอนเทสต์)
  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDeleteLog = (logId) => {
    setLogs((prev) => prev.filter(log => log.id !== logId));
  }

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    // ฝั่งเจ้าหน้าที่ (Officer)
    if (currentUser.role === 'officer' || currentUser.type === 'officer') {
      return (
        <OfficerScreen
          user={currentUser}
          logs={logs} // โยนสมุดจดเล่มกลางให้เจ้าหน้าที่ดู
          onLogout={handleLogout}
          onSaveLogForFarmer={handleSaveLogForFarmer} // โยนปากกาให้เจ้าหน้าที่จดแทน
          onClear={handleClearLogs}
        />
      );
    }

    // ฝั่งเกษตรกร (Farmer)
    return (
      <FarmerScreen
        user={currentUser}
        logs={logs} // โยนสมุดจดเล่มกลางให้เกษตรกรดู
        onLog={handleLog} // โยนปากกาให้เกษตรกรจดข้อมูลตัวเอง
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
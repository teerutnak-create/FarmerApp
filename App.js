import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
import OfficerScreen from './screens/OfficerScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);

  // ฟังก์ชัน Login ที่แยก Role ชัดเจน
  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLog = (type, data) => {
    const newLog = { id: Date.now().toString(), type, ...data, time: new Date().toISOString() };
    setLogs((prev) => [newLog, ...prev]);
  };

  // 🟢 เงื่อนไขการ Render แยกหน้าตามบทบาท (Role) ของผู้ใช้งาน
  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    // หากบทบาทเป็น officer ให้แสดงหน้า OfficerScreen เท่านั้น
    if (currentUser.role === 'officer' || currentUser.type === 'officer') {
      return (
        <OfficerScreen
          user={currentUser}
          logs={logs}
          onLogout={handleLogout}
        />
      );
    }

    // ผู้ใช้งานทั่วไป / เกษตรกร
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
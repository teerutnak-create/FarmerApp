import { supabase } from './supabase';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
import OfficerScreen from './screens/OfficerScreen';
import { USERS as DEFAULT_USERS } from './data/users';

const USER_KEY = 'session_user';
const REGISTERED_USERS_KEY = 'registered_users';

export default function App() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState(DEFAULT_USERS);
  const [ready, setReady] = useState(false);

  // 1. ดึงข้อมูลบันทึกทั้งหมดจาก Supabase
  const fetchSupabaseLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Supabase Notice:', error.message);
      } else if (data) {
        // แปลงรูปแบบข้อมูลจาก Supabase ให้เข้ากับหน้าจอเดิม
        const mappedLogs = data.map((item) => ({
          id: item.id?.toString(),
          type: item.type,
          time: item.created_at || item.time,
          farmerId: item.farmer_id,
          farmer: item.farmer_name,
          ...item.extra_data,
        }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.log('Fetch catch:', e);
    }
  };

  // 2. โหลดข้อมูลผู้ใช้ และตั้งค่า Realtime Listener
  const loadData = async () => {
    try {
      const u = await AsyncStorage.getItem(USER_KEY);
      const customUsers = await AsyncStorage.getItem(REGISTERED_USERS_KEY);

      const parsedCustomUsers = customUsers ? JSON.parse(customUsers) : [];
      setAllUsers([...DEFAULT_USERS, ...parsedCustomUsers]);

      if (u) setUser(JSON.parse(u));

      // ดึงข้อมูลจาก Supabase
      await fetchSupabaseLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    loadData();

    // เปิดใช้งาน Realtime ติดตามการเปลี่ยนแปลงตาราง farm_logs
    const channel = supabase
      .channel('public:farm_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farm_logs' }, () => {
        fetchSupabaseLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const login = async (u) => {
    setUser(u);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    await loadData();
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  };

  // 3. เพิ่มบันทึกกิจกรรมลงใน Supabase
  const addLog = async (type, extra = {}) => {
    if (!user) return;

    const newLogData = {
      type,
      farmer_id: user.id,
      farmer_name: user.name,
      extra_data: extra,
    };

    try {
      const { error } = await supabase.from('farm_logs').insert([newLogData]);
      if (error) {
        console.log('Error inserting log:', error.message);
      } else {
        fetchSupabaseLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. บันทึกข้อมูลให้เกษตรกร (กรณีเจ้าหน้าที่เป็นคนลงบันทึกให้)
  const addLogForFarmer = async (farmerId, farmerName, type, extra = {}) => {
    const newLogData = {
      type,
      farmer_id: farmerId,
      farmer_name: farmerName,
      extra_data: extra,
    };

    try {
      const { error } = await supabase.from('farm_logs').insert([newLogData]);
      if (error) {
        console.log('Error inserting log for farmer:', error.message);
      } else {
        fetchSupabaseLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. ล้างข้อมูลใน Supabase
  const clearLogs = async () => {
    try {
      const { error } = await supabase.from('farm_logs').delete().neq('id', 0);
      if (error) console.log('Error clearing logs:', error.message);
      else setLogs([]);
    } catch (e) {
      console.error(e);
    }
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f8e9' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginTop: 12 }}>
          กำลังเชื่อมต่อระบบกลาง...
        </Text>
      </View>
    );
  }

  if (!user) return <LoginScreen onLogin={login} />;

  // หน้าสำหรับเกษตรกร
  if (user.role === 'farmer') {
    return (
      <FarmerScreen
        user={user}
        logs={logs.filter((l) => l.farmerId === user.id)}
        onLog={addLog}
        onLogout={logout}
      />
    );
  }

  // หน้าสำหรับเจ้าหน้าที่
  return (
    <OfficerScreen
      user={user}
      logs={logs}
      allUsers={allUsers}
      onClear={clearLogs}
      onLogout={logout}
      onRefresh={fetchSupabaseLogs}
      onSaveLogForFarmer={addLogForFarmer}
    />
  );
}
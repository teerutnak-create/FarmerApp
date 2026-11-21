import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, StyleSheet, Text, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import LoginScreen from './screens/LoginScreen';
import FarmerScreen from './screens/FarmerScreen';
import { initLargeTextMode } from './utils/largeTextMode';
import OfficerScreen from './screens/OfficerScreen';
import { FARMER_LOCATIONS_KEY, hasValidGpsCoordinates } from './utils/farmerMapData';
import { listGroupFarmers } from './services/authService';
import { restoreLocalSession, signOutLocal } from './services/localAuthService';
import {
  createLogId,
  enqueueLogDelete,
  enqueueLogUpsert,
  flushPendingLogs,
  loadLogs,
  saveLogsCache,
} from './services/syncService';
import { supabase } from './supabase';

const persistFarmerLocation = async (farmerId, data, fallbackTime) => {
  const storedLocations = await AsyncStorage.getItem(FARMER_LOCATIONS_KEY);
  const locations = storedLocations ? JSON.parse(storedLocations) : {};
  if (!locations || typeof locations !== 'object' || Array.isArray(locations)) {
    throw new Error('Stored farmer locations must be an object');
  }

  const capturedAt = data.photoTime || fallbackTime;
  const previousTime = Date.parse(locations[farmerId]?.capturedAt) || 0;
  const capturedTime = Date.parse(capturedAt) || 0;
  if (previousTime > capturedTime) return;

  locations[farmerId] = {
    lat: data.lat,
    lng: data.lng,
    accuracy: data.accuracy,
    plot: data.plot,
    capturedAt,
  };
  await AsyncStorage.setItem(FARMER_LOCATIONS_KEY, JSON.stringify(locations));
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const isDemoUser = currentUser?.isDemo === true;

  useEffect(() => {
    initLargeTextMode();
  }, []);

  // Restore the locally stored session before deciding which role-specific screen to render.
  useEffect(() => {
    let active = true;
    restoreLocalSession()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch((error) => {
        console.error('Restoring local session failed:', error);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    if (isDemoUser) return undefined;

    let active = true;
    const refreshLogs = async () => {
      const result = await loadLogs(currentUser.id);
      if (!active) return;
      setLogs(result.logs);
      setSyncStatus(result.status);
      if (result.error) console.warn('Refreshing farm logs failed:', result.error);
    };

    const syncAndRefresh = async () => {
      const result = await flushPendingLogs(currentUser.id);
      if (active) setSyncStatus(result.status);
      await refreshLogs();
    };

    syncAndRefresh().catch((error) => {
      console.error('Initializing farm log sync failed:', error);
      if (active) setSyncStatus('error');
    });

    const networkSubscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncAndRefresh().catch((error) => {
          console.error('Resuming farm log sync failed:', error);
          if (active) setSyncStatus('error');
        });
      } else if (active) {
        setSyncStatus('offline');
      }
    });

    const realtimeChannel = supabase
      .channel(`farm-logs-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'farm_logs',
      }, () => {
        refreshLogs().catch((error) => console.error('Realtime log refresh failed:', error));
      })
      .subscribe((status) => {
        if (active && status === 'CHANNEL_ERROR') setSyncStatus('error');
      });

    return () => {
      active = false;
      networkSubscription.remove();
      supabase.removeChannel(realtimeChannel);
    };
  }, [currentUser, isDemoUser]);

  useEffect(() => {
    if (!currentUser || isDemoUser || currentUser.role !== 'officer') return undefined;

    let active = true;
    listGroupFarmers(currentUser.id)
      .then((farmers) => {
        if (active) setAllUsers(farmers);
      })
      .catch((error) => console.error('Loading group farmer profiles failed:', error));

    return () => {
      active = false;
    };
  }, [currentUser, isDemoUser]);

  // Keep the legacy local list only for development demo accounts.
  useEffect(() => {
    if (!isDemoUser || Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const pullDemoLogs = () => {
      try {
        const saved = window.localStorage.getItem('app_logs');
        if (saved) setLogs(JSON.parse(saved));
      } catch (error) {
        console.warn('Loading demo logs failed:', error);
      }
    };
    const handleStorageChange = (event) => {
      if (event.key === 'app_logs' && event.newValue) pullDemoLogs();
    };
    pullDemoLogs();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser?.id, isDemoUser]);

  const saveLogsAndSync = (newLogs, changedLog = null, action = 'upsert') => {
    setLogs(newLogs);

    if (currentUser?.isDemo) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('app_logs', JSON.stringify(newLogs));
        } catch (error) {
          console.error('Saving demo logs failed:', error);
        }
      }
      return;
    }
    if (!currentUser?.id) return;

    const persist = async () => {
      await saveLogsCache(currentUser.id, newLogs);
      if (changedLog && action === 'upsert') await enqueueLogUpsert(currentUser.id, changedLog);
      if (changedLog && action === 'delete') await enqueueLogDelete(currentUser.id, changedLog);
      const result = await flushPendingLogs(currentUser.id);
      setSyncStatus(result.status);
      if (result.error) console.warn('Farm log sync is queued for retry:', result.error);
    };
    persist().catch((error) => {
      console.error('Saving farm logs locally failed:', error);
      setSyncStatus('error');
    });
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setAllUsers([]);
    setSyncStatus(userData.isDemo ? 'synced' : 'pending');
  };

  const handleLogout = async () => {
    try {
      await signOutLocal();
      setCurrentUser(null);
      setLogs([]);
      setAllUsers([]);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Local sign out failed:', error);
      Alert.alert('ออกจากระบบไม่สำเร็จ', 'กรุณาลองอีกครั้ง');
    }
  };

  // 1. ฟังก์ชันให้ "เกษตรกร" บันทึกข้อมูลตัวเอง
  const handleLog = (type, data) => {
    const category = (type === 'วัดความชื้น' || data.moisture !== undefined) ? 'SENSOR' : 'ACTIVITY';
    
    const newLog = { 
      id: createLogId(),
      category,
      type, 
      ...data, 
      time: new Date().toISOString(),
      farmerId: currentUser.id
    };
    saveLogsAndSync([newLog, ...logs], newLog);

    if (type === 'ถ่ายรูปแปลง' && hasValidGpsCoordinates(data?.lat, data?.lng)) {
      persistFarmerLocation(currentUser.id, data, newLog.time).catch((error) => {
        console.error('Saving farmer GPS location failed:', error);
      });
    }
  };

  // 2. ฟังก์ชันให้ "เจ้าหน้าที่" บันทึกข้อมูลแทนเกษตรกร
  const handleSaveLogForFarmer = (farmerId, farmerName, type, data) => {
    const category = (type === 'วัดความชื้น' || data.moisture !== undefined) ? 'SENSOR' : 'ACTIVITY';

    const newLog = {
      id: createLogId(),
      category,
      type,
      ...data,
      time: new Date().toISOString(),
      farmerId: farmerId,
      recordedBy: currentUser.id
    };
    saveLogsAndSync([newLog, ...logs], newLog);
  };

  // 3. เพิ่มฟังก์ชันอัปเดต/แก้ไขข้อมูลที่มีอยู่เดิม
  const handleUpdateLog = (logId, updatedData) => {
    let changedLog = null;
    const updatedLogs = logs.map((log) => {
      if (log.id === logId) {
        changedLog = {
          ...log,
          ...updatedData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.id,
        };
        return changedLog;
      }
      return log;
    });
    saveLogsAndSync(updatedLogs, changedLog);
  };

  // ฟังก์ชันล้างข้อมูลทั้งหมด
  const handleClearLogs = () => {
    const removedIds = logs.map((log) => log.id);
    saveLogsAndSync([]);
    if (!currentUser?.isDemo && currentUser?.id) {
      const persistDeletes = async () => {
        for (const logId of removedIds) await enqueueLogDelete(currentUser.id, logId);
        const result = await flushPendingLogs(currentUser.id);
        setSyncStatus(result.status);
      };
      persistDeletes().catch((error) => {
        console.error('Queueing log deletion failed:', error);
        setSyncStatus('error');
      });
    }
  };

  // 4. ฟังก์ชันลบข้อมูลประจำวันทั้งรายการ
  const handleDeleteLog = (logId) => {
    const updatedLogs = logs.filter(log => log.id !== logId);
    saveLogsAndSync(updatedLogs, logId, 'delete');
  };

  // 🟢 5. เพิ่มฟังก์ชันเลือกลบเฉพาะกิจกรรมย่อยที่ไม่ต้องการ
  const handleDeleteActivityField = (logId, fieldKey) => {
    let changedLog = null;
    const updatedLogs = logs.map((log) => {
      if (log.id === logId) {
        changedLog = { ...log };
        delete changedLog[fieldKey];
        changedLog.updatedAt = new Date().toISOString();
        return changedLog;
      }
      return log;
    });
    saveLogsAndSync(updatedLogs, changedLog);
  };

  // 🟢 [เพิ่มใหม่] ฟังก์ชันสำหรับกดปุ่ม Refresh / Sync ด้วยตัวเอง
  const handleRefreshLogs = () => {
    if (currentUser?.isDemo && Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const savedLogs = window.localStorage.getItem('app_logs');
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        }
      } catch (error) {
        console.warn('Manual demo log refresh failed:', error);
      }
      return;
    }
    if (!currentUser?.id || currentUser.isDemo) return;
    const refresh = async () => {
      const syncResult = await flushPendingLogs(currentUser.id);
      const result = await loadLogs(currentUser.id);
      if (syncResult.error) setSyncStatus(syncResult.status);
      else setSyncStatus(result.status);
      setLogs(result.logs);
    };
    refresh().catch((error) => {
      console.error('Manual farm log refresh failed:', error);
      setSyncStatus('error');
    });
  };

  // Legacy cross-tab sync is restricted to development demo data.
  const lastSyncedRef = React.useRef(JSON.stringify([]));
  const syncChannelRef = React.useRef(null);

  const pullLogsFromStorage = React.useCallback(() => {
    if (!isDemoUser || Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('app_logs');
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      const normalized = JSON.stringify(parsed);
      if (normalized === lastSyncedRef.current) return; // ไม่มีอะไรเปลี่ยน
      lastSyncedRef.current = normalized;
      setLogs(parsed);
    } catch (e) {
      console.warn('Pull demo log sync error:', e);
    }
  }, [isDemoUser]);

  useEffect(() => {
    if (!isDemoUser || Platform.OS !== 'web' || typeof window === 'undefined') return;

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
  }, [isDemoUser, pullLogsFromStorage]);

  useEffect(() => {
    if (!isDemoUser) return;
    const json = JSON.stringify(logs);
    if (json === lastSyncedRef.current) return; // มาจากการ sync เข้า ไม่ต้องส่งต่อ (กันวนลูป)
    lastSyncedRef.current = json;
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type: 'LOGS_UPDATED' });
    }
  }, [isDemoUser, logs]);

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
          allUsers={allUsers}
          syncStatus={syncStatus}
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
        syncStatus={syncStatus}
        onLog={handleLog}
        onLogout={handleLogout}
      />
    );
  };

  if (!authReady) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>กำลังตรวจสอบบัญชีในเครื่อง...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
      {currentUser && !currentUser.isDemo && (
        <View style={[styles.syncIndicator, syncStatus === 'synced' ? styles.syncSuccess : styles.syncPending]}>
          <Text style={styles.syncText}>
            {syncStatus === 'synced' ? 'ซิงก์แล้ว' :
              syncStatus === 'offline' ? 'ออฟไลน์ - รอซิงก์' :
                syncStatus === 'error' ? 'ซิงก์ไม่สำเร็จ - ข้อมูลอยู่ในเครื่อง' :
                  'กำลังรอซิงก์'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#52645a',
  },
  syncIndicator: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  syncSuccess: {
    backgroundColor: '#e8f5e9',
  },
  syncPending: {
    backgroundColor: '#fff8e1',
  },
  syncText: {
    color: '#52645a',
    fontSize: 12,
  },
});
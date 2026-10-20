import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLiveMoisture } from '../utils/notify';
import { s } from '../styles';
import DailyLogScreen from './DailyLogScreen';
import PhotoScreen from './PhotoScreen';
import PlotInfoScreen from './PlotInfoScreen';
import YieldScreen from './YieldScreen';
import { USERS as DEFAULT_USERS } from '../data/users';

const HARVEST = 'เกี่ยวข้าวเสร็จแล้ว';
const DRY_HOURS = 24;

const SESSION_KEYS = ['user', 'token', 'session', 'currentUser'];

const pad = (n) => String(n).padStart(2, '0');
const formatTime = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return (
    pad(Math.floor(total / 3600)) +
    ':' +
    pad(Math.floor((total % 3600) / 60)) +
    ':' +
    pad(total % 60)
  );
};

const calculateAge = (dobString, defaultAge) => {
  if (defaultAge) return defaultAge;
  if (!dobString) return null;
  const parts = dobString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const yearBE = parseInt(parts[2], 10);
  const yearAD = yearBE - 543;

  const birthDate = new Date(yearAD, month, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age > 0 ? age : 0;
};

export default function FarmerScreen({ user, logs, onLog, onLogout }) {
  const [recordMode, setRecordMode] = useState('daily');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoList = [
    { id: 1, title: 'วิดีโอสอนบันทึกกิจกรรมประจำวัน', duration: '02:15 นาที', icon: '📝', desc: 'สอนขั้นตอนการกรอกข้อมูลการใส่ปุ๋ย ให้น้ำ และการดูแลพืช' },
    { id: 2, title: 'วิดีโอสอนถ่ายรูปแปลงนาและแนบ GPS', duration: '01:45 นาที', icon: '📷', desc: 'วิธีเปิดกล้องถ่ายภาพแปลงนาพร้อมปักพิกัด GPS อัตโนมัติ' },
    { id: 3, title: 'วิดีโอสอนวัดและจดบันทึกค่าความชื้น', duration: '01:30 นาที', icon: '💧', desc: 'การใช้งานเครื่องวัดความชื้นและการกรอกค่าลงระบบ' },
    { id: 4, title: 'วิดีโอสอนวางแผนการปลูกและสรุปรายปี', duration: '03:10 นาที', icon: '🌾', desc: 'การใช้งานปฏิทินวางแผนพืชรายปีด้วยเสียงและลงสรุปผลผลิต' },
  ];
  const [activeVideo, setActiveVideo] = useState(videoList[0]);

  const [selectedMonth, setSelectedMonth] = useState('พฤศจิกายน');
  const [cropName, setCropName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [cropPlans, setCropPlans] = useState([
    { id: '1', month: 'พฤศจิกายน', crop: 'ข้าวหอมมะลิ 105 (ข้าวนาปี)' },
    { id: '2', month: 'มกราคม', crop: 'ถั่วพร้า / ปุ๋ยพืชสดปรับปรุงดิน' },
  ]);

  const monthsList = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const [moisture, setMoisture] = useState('');
  const [isLiveMoisture, setIsLiveMoisture] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState('home');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 🟢 Effect ดึงค่าความชื้นแบบ Real-time ทุก 3 วินาที
  useEffect(() => {
    let interval;
    if (isLiveMoisture) {
      fetchLiveMoisture().then((val) => {
        if (val !== null) setMoisture(String(val));
      });

      interval = setInterval(async () => {
        const liveValue = await fetchLiveMoisture();
        if (liveValue !== null) {
          setMoisture(String(liveValue));
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isLiveMoisture]);

  const back = () => setPage('home');

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(SESSION_KEYS);
    } catch (e) {
      console.warn('clear session failed', e);
    }
    setShowProfileModal(false);
    setIsSidebarOpen(true);
    setRecordMode('daily');
    setPage('home');
    if (onLogout) onLogout();
  };

  if (page === 'form') return <DailyLogScreen onSave={onLog} onClose={back} />;
  if (page === 'photo') return <PhotoScreen onSave={onLog} onClose={back} />;
  if (page === 'plot') return <PlotInfoScreen onSave={onLog} onClose={back} />;
  if (page === 'yield') return <YieldScreen user={user} onSave={onLog} onClose={back} />;

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    setIsPlaying(true);
  };

  const saveMoisture = () => {
    const v = parseFloat(moisture);
    if (isNaN(v)) return;
    onLog('วัดความชื้น', { moisture: v });
    setMoisture('');
    Alert.alert('บันทึกแล้ว ✅', 'ความชื้น ' + v + '%');
  };

  const handleVoiceRecordAnnual = () => {
    setIsListening(true);
    setTimeout(() => {
      const sampleVoiceInputs = [
        'ปลูกข้าวโพดหลังนา',
        'เตรียมแปลงปลูกถั่วเหลือง',
        'หว่านข้าวหอมมะลิกข 15',
        'ปลูกผักบุ้งจีนเพิ่มรายได้',
      ];
      const randomText = sampleVoiceInputs[Math.floor(Math.random() * sampleVoiceInputs.length)];
      setCropName(randomText);
      setIsListening(false);
      Alert.alert('ถอดข้อความเสียงสำเร็จ 🎙️', `รับค่าเสียงพูด: "${randomText}"`);
    }, 2500);
  };

  const handleAddCropPlan = () => {
    if (!cropName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาระบุชื่อพืชที่จะปลูกหรือกดปุ่มพูดด้วยเสียง');
      return;
    }
    const newPlan = {
      id: Date.now().toString(),
      month: selectedMonth,
      crop: cropName.trim(),
    };
    setCropPlans([...cropPlans, newPlan]);
    onLog('วางแผนการปลูกพืช', { month: selectedMonth, crop: cropName.trim() });
    setCropName('');
    Alert.alert('บันทึกแผนงานสำเร็จ ✅', `เพิ่มแผนปลูก "${newPlan.crop}" ในเดือน ${selectedMonth}`);
  };

  const handleDeletePlan = (id) => {
    setCropPlans(cropPlans.filter((item) => item.id !== id));
  };

  const lastHarvest = logs?.find((l) => l.type === HARVEST);
  let timerBox = null;
  if (lastHarvest) {
    const left = new Date(lastHarvest.time).getTime() + DRY_HOURS * 3600 * 1000 - now;
    timerBox =
      left > 0 ? (
        <View style={[f.timerBox, { backgroundColor: '#fef3c7', borderColor: '#fde047' }]}>
          <Text style={f.timerLabel}>⏳ เหลือเวลาลดความชื้น</Text>
          <Text style={f.timerNum}>{formatTime(left)}</Text>
        </View>
      ) : (
        <View style={[f.timerBox, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
          <Text style={f.timerLabel}>⏰ ครบเวลาแล้ว</Text>
          <Text style={f.timerHint}>กรุณาวัดความชื้นและบันทึก</Text>
        </View>
      );
  }

  const defaultUserInfo = DEFAULT_USERS.find((u) => u.id === user?.id || u.login === user?.login);
  const displayDob = user?.dob || defaultUserInfo?.dob;
  const rawAge = user?.age || defaultUserInfo?.age;
  const displayAge = calculateAge(displayDob, rawAge);

  return (
    <SafeAreaView style={f.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#72c07b" />

      <View style={f.mainLayout}>
        {/* Sidebar */}
        {isSidebarOpen && (
          <View style={f.sidebar}>
            <View style={f.sidebarTop}>
              <TouchableOpacity style={f.avatarTouch} onPress={() => setShowProfileModal(true)}>
                <View style={f.avatarCircle}>
                  <Text style={f.avatarText}>{user?.name ? user.name.charAt(0) : 'ก'}</Text>
                </View>
                <Text style={f.sidebarUserName} numberOfLines={1}>{user?.name}</Text>
                <Text style={f.sidebarUserId}>ID: {user?.id}</Text>
                <Text style={f.profileHint}>👆 กดดูโปรไฟล์</Text>
              </TouchableOpacity>
            </View>

            <View style={f.sidebarMenu}>
              <TouchableOpacity
                style={[f.sidebarTab, recordMode === 'daily' && f.sidebarTabActive]}
                onPress={() => setRecordMode('daily')}
              >
                <Text style={f.sidebarTabIcon}>📅</Text>
                <Text style={[f.sidebarTabText, recordMode === 'daily' && f.sidebarTabTextActive]}>บันทึกรายวัน</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[f.sidebarTab, recordMode === 'annual' && f.sidebarTabActive]}
                onPress={() => setRecordMode('annual')}
              >
                <Text style={f.sidebarTabIcon}>🗓️</Text>
                <Text style={[f.sidebarTabText, recordMode === 'annual' && f.sidebarTabTextActive]}>บันทึกรายปี</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[f.sidebarTab, recordMode === 'community' && f.sidebarTabActive]}
                onPress={() => setRecordMode('community')}
              >
                <Text style={f.sidebarTabIcon}>👥</Text>
                <Text style={[f.sidebarTabText, recordMode === 'community' && f.sidebarTabTextActive]}>แดชบอร์ดกลุ่ม</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={f.logoutBtn} onPress={handleLogout}>
              <Text style={f.logoutText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content Right */}
        <ScrollView contentContainerStyle={f.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={f.bannerCard}>
            <TouchableOpacity
              style={f.toggleSidebarBtn}
              onPress={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Text style={f.toggleSidebarIcon}>{isSidebarOpen ? '◀' : '☰'}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={f.bannerTitle}>🌾 ระบบจัดการเกษตรกร</Text>
              <Text style={f.bannerLoc}>📍 กลุ่มวิสาหกิจชุมชน ต.ผักไหม</Text>
            </View>

            <TouchableOpacity style={f.statusBadge} onPress={() => setShowProfileModal(true)}>
              <View style={f.greenDot} />
              <Text style={f.statusText}>โปรไฟล์</Text>
            </TouchableOpacity>
          </View>

          {recordMode === 'community' ? (
            <>
              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>👥 ภาพรวมกลุ่มเกษตรกรแปลงใหญ่ ต.ผักไหม</Text>
                <View style={f.communityGrid}>
                  <View style={[f.communityStatBox, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={f.communityStatIcon}>🌾</Text>
                    <Text style={f.communityStatNum}>125 ไร่</Text>
                    <Text style={f.communityStatLabel}>พื้นที่ปลูกรวมกลุ่ม</Text>
                  </View>

                  <View style={[f.communityStatBox, { backgroundColor: '#f1f8e9' }]}>
                    <Text style={f.communityStatIcon}>👨‍🌾</Text>
                    <Text style={f.communityStatNum}>24 ราย</Text>
                    <Text style={f.communityStatLabel}>สมาชิกในกลุ่ม</Text>
                  </View>

                  <View style={[f.communityStatBox, { backgroundColor: '#fffde7' }]}>
                    <Text style={f.communityStatIcon}>📦</Text>
                    <Text style={f.communityStatNum}>68 ตัน</Text>
                    <Text style={f.communityStatLabel}>คาดการณ์ผลผลิต</Text>
                  </View>
                </View>
              </View>

              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>💰 ราคารับซื้อข้าวเปลือกหอมมะลิ (วันนี้)</Text>
                <View style={f.priceRow}>
                  <View style={f.priceCard}>
                    <Text style={f.priceLabel}>ข้าวเปลือกแห้ง (ชื้นไม่เกิน 15%)</Text>
                    <Text style={f.priceValue}>15,200 <Text style={f.priceUnit}>บาท/ตัน</Text></Text>
                  </View>
                  <View style={f.priceCard}>
                    <Text style={f.priceLabel}>ข้าวเปลือกเกี่ยวสด (ชื้น 25%)</Text>
                    <Text style={f.priceValue}>12,800 <Text style={f.priceUnit}>บาท/ตัน</Text></Text>
                  </View>
                </View>
              </View>
            </>
          ) : recordMode === 'daily' ? (
            <>
              <View style={f.statusCard}>
                <Text style={f.sectionTitle}>📊 สถานะการประเมินและแปลงปลูก</Text>
                <View style={f.statusGrid}>
                  <View style={f.statusBox}>
                    <Text style={f.statusBoxLabel}>มาตรฐาน GAP</Text>
                    <Text style={[f.statusBoxValue, { color: '#2e7d32' }]}>ผ่านรับรอง</Text>
                    <Text style={f.statusBoxSub}>หมดอายุ: 12/2026</Text>
                  </View>
                  <View style={f.statusBox}>
                    <Text style={f.statusBoxLabel}>จำนวนแปลง</Text>
                    <Text style={[f.statusBoxValue, { color: '#388e3c' }]}>2 แปลง</Text>
                    <Text style={f.statusBoxSub}>พื้นที่รวม 5 ไร่</Text>
                  </View>
                </View>
              </View>

              {timerBox}

              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>📝 เมนูบันทึกกิจกรรมประจำวัน</Text>
                <View style={f.grid}>
                  <TouchableOpacity style={[f.gridBtn, { backgroundColor: '#4caf50' }]} onPress={() => setPage('form')}>
                    <Text style={f.gridIcon}>📝</Text>
                    <Text style={f.gridTitle}>บันทึกกิจกรรมวันนี้</Text>
                    <Text style={f.gridSub}>ใส่ปุ๋ย ให้น้ำ มีปฏิทินและสั่งงานด้วยเสียง</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[f.gridBtn, { backgroundColor: '#388e3c' }]} onPress={() => setPage('photo')}>
                    <Text style={f.gridIcon}>📷</Text>
                    <Text style={f.gridTitle}>ถ่ายรูปแปลงนา</Text>
                    <Text style={f.gridSub}>แนบรูปพร้อมพิกัด GPS</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>🎥 วิดีโอสอนวิธีใช้งานตามฟังก์ชัน</Text>

                <View style={f.videoWrapper}>
                  <View style={f.videoPlayerContainer}>
                    <Text style={{ fontSize: 32 }}>🎬</Text>
                    <Text style={f.videoPlayingTitle} numberOfLines={2}>{activeVideo.title}</Text>
                    <Text style={f.videoPlayingDuration}>⏱️ ความยาว: {activeVideo.duration}</Text>
                    <Text style={f.videoDescText}>{activeVideo.desc}</Text>

                    <TouchableOpacity style={f.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                      <Text style={f.playBtnText}>{isPlaying ? '⏸️ หยุดเล่นวิดีโอ' : '▶️ เล่นวิดีโอ'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2e7d32', marginTop: 12, marginBottom: 6 }}>
                  เลือกคู่มือของฟังก์ชันที่คุณต้องการดู:
                </Text>

                <View style={{ gap: 6 }}>
                  {videoList.map((item) => {
                    const isSelected = activeVideo.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[f.videoItem, isSelected && f.videoItemActive]}
                        onPress={() => handleSelectVideo(item)}
                      >
                        <Text style={{ fontSize: 20, marginRight: 8 }}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[f.videoItemTitle, isSelected && { color: '#2e7d32' }]}>{item.title}</Text>
                          <Text style={f.videoItemSub}>{item.desc}</Text>
                        </View>
                        <View style={f.selectBadge}>
                          <Text style={{ fontSize: 10, color: isSelected ? '#ffffff' : '#2e7d32', fontWeight: 'bold' }}>
                            {isSelected && isPlaying ? '▶️ เล่นอยู่' : 'เลือกดู'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 🟢 การ์ดวัดความชื้น Real-time */}
              <View style={f.sectionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={f.sectionTitle}>💧 วัดและบันทึกความชื้นข้าวเปลือก</Text>
                  
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' }}
                    onPress={() => setIsLiveMoisture(!isLiveMoisture)}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isLiveMoisture ? '#22c55e' : '#ef4444', marginRight: 6 }} />
                    <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>
                      {isLiveMoisture ? '● เรียลไทม์' : '○ พิมพ์เอง'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.label}>ค่าความชื้นจากเซนเซอร์ปัจจุบัน (%)</Text>
                <TextInput
                  style={[s.input, f.customInput, { fontWeight: 'bold', color: '#1b5e20', fontSize: 15 }]}
                  value={moisture}
                  onChangeText={(val) => {
                    setMoisture(val);
                    setIsLiveMoisture(false);
                  }}
                  keyboardType="numeric"
                  placeholder="กำลังดึงข้อมูลจากเซนเซอร์..."
                  placeholderTextColor="#a1a1a1"
                />
                <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#2e7d32', marginTop: 10 }]} onPress={saveMoisture}>
                  <Text style={s.bigBtnText}>💾 บันทึกค่าความชื้น</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>🌱 วางแผนงานการปลูกพืชประจำปี (Voice Support)</Text>
                <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                  เลือกเดือนและกรอกชื่อพืชที่ตั้งใจจะปลูก หรือกดปุ่มพูดด้วยเสียง
                </Text>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 }}>
                  1. เลือกเดือนที่จะปลูก:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {monthsList.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          f.monthChip,
                          selectedMonth === m && f.monthChipActive,
                        ]}
                        onPress={() => setSelectedMonth(m)}
                      >
                        <Text style={[f.monthChipText, selectedMonth === m && { color: '#fff' }]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 }}>
                  2. ระบุชื่อพืชที่จะปลูก:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[f.customInput, { flex: 1 }]}
                    placeholder="พิมพ์ชื่อพืช เช่น ข้าวหอมมะลิ..."
                    value={cropName}
                    onChangeText={setCropName}
                    placeholderTextColor="#a1a1a1"
                  />

                  <TouchableOpacity
                    style={[
                      f.voiceBtn,
                      isListening && { backgroundColor: '#dc2626' },
                    ]}
                    onPress={handleVoiceRecordAnnual}
                    disabled={isListening}
                  >
                    <Text style={f.voiceBtnText}>
                      {isListening ? '🎙️ ฟังอยู่...' : '🎙️ พูด'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[s.bigBtn, { backgroundColor: '#2e7d32', marginTop: 12 }]}
                  onPress={handleAddCropPlan}
                >
                  <Text style={s.bigBtnText}>➕ บันทึกแผนการปลูกลงปฏิทิน</Text>
                </TouchableOpacity>
              </View>

              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>📅 ปฏิทินแผนงานการปลูกพืชในปีนี้</Text>

                {cropPlans.length === 0 ? (
                  <Text style={{ fontSize: 11, color: '#888', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 }}>
                    ยังไม่มีรายการแผนการปลูก เพิ่มรายการด้านบนได้เลย
                  </Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {cropPlans.map((plan) => (
                      <View key={plan.id} style={f.planCardItem}>
                        <View style={f.planMonthBadge}>
                          <Text style={f.planMonthText}>{plan.month}</Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={f.planCropName}>🌱 {plan.crop}</Text>
                          <Text style={f.planStatusText}>สถานะ: วางแผนแล้ว</Text>
                        </View>

                        <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}>
                          <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={f.sectionCard}>
                <Text style={f.sectionTitle}>🗓️ บันทึกแปลงและสรุปผลผลิตรายปี</Text>
                <View style={f.grid}>
                  <TouchableOpacity style={[f.gridBtn, { backgroundColor: '#4caf50', width: '100%' }]} onPress={() => setPage('plot')}>
                    <Text style={f.gridIcon}>🗺️</Text>
                    <Text style={f.gridTitle}>ข้อมูลแปลงและใบรับรองมาตรฐานประจำปี</Text>
                    <Text style={f.gridSub}>ปรับปรุงขนาดแปลง ชนิดดิน ประวัติสารเคมี และใบรับรอง GAP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[f.gridBtn, { backgroundColor: '#388e3c', width: '100%', marginTop: 8 }]} onPress={() => setPage('yield')}>
                    <Text style={f.gridIcon}>📦</Text>
                    <Text style={f.gridTitle}>สรุปบันทึกผลผลิตรายปี/ฤดูกาล</Text>
                    <Text style={f.gridSub}>บันทึกปริมาณผลผลิตข้าวรวม และออกเลขล็อตประจำปี</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Modal Profile */}
      <Modal visible={showProfileModal} animationType="fade" transparent>
        <View style={f.modalOverlay}>
          <View style={f.modalCard}>
            <View style={f.modalAvatarCircle}>
              <Text style={f.modalAvatarText}>{user?.name ? user.name.charAt(0) : 'ก'}</Text>
            </View>

            <Text style={f.modalFarmerName}>{user?.name}</Text>
            <Text style={f.modalFarmerId}>รหัสสมาชิก: {user?.id}</Text>

            <View style={f.modalDivider} />

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>🎂 วัน/เดือน/ปีเกิด:</Text>
              <Text style={f.infoValue}>{displayDob ? displayDob : 'ยังไม่ได้ระบุ'}</Text>
            </View>

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>👤 อายุ:</Text>
              <Text style={f.infoValue}>{displayAge !== null ? `${displayAge} ปี` : 'ยังไม่ได้ระบุ'}</Text>
            </View>

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>🏞️ แปลงที่ครอบครอง:</Text>
              <Text style={f.infoValue}>2 แปลง</Text>
            </View>

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>📏 พื้นที่รวมทั้งหมด:</Text>
              <Text style={f.infoValue}>5 ไร่</Text>
            </View>

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>📍 ที่ตั้งแปลงหลัก:</Text>
              <Text style={f.infoValue}>ต.ผักไหม อ.ห้วยทับทัน</Text>
            </View>

            <View style={f.infoRow}>
              <Text style={f.infoLabel}>🛡️ สถานะ GAP:</Text>
              <Text style={[f.infoValue, { color: '#2e7d32' }]}>ผ่านการรับรอง</Text>
            </View>

            <TouchableOpacity
              style={f.closeModalBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={f.closeModalText}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const f = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  mainLayout: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: 110,
    backgroundColor: '#72c07b',
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTop: { alignItems: 'center', width: '100%' },
  avatarTouch: { alignItems: 'center', width: '100%' },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    elevation: 2,
  },
  avatarText: { color: '#2e7d32', fontSize: 20, fontWeight: 'bold' },
  sidebarUserName: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  sidebarUserId: { color: '#e8f5e9', fontSize: 10, marginTop: 1 },
  profileHint: { color: '#fef08a', fontSize: 8, fontWeight: 'bold', marginTop: 3 },

  sidebarMenu: { width: '100%', gap: 8, marginVertical: 12 },
  sidebarTab: { alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  sidebarTabActive: { backgroundColor: '#2e7d32' },
  sidebarTabIcon: { fontSize: 18, marginBottom: 2 },
  sidebarTabText: { color: '#ffffff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  sidebarTabTextActive: { color: '#ffffff', fontWeight: 'bold' },

  logoutBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },

  contentContainer: { flexGrow: 1, backgroundColor: '#f1f8e9', padding: 12, gap: 12 },

  bannerCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  toggleSidebarBtn: {
    backgroundColor: '#72c07b',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleSidebarIcon: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  bannerTitle: { color: '#2e7d32', fontSize: 13, fontWeight: 'bold' },
  bannerLoc: { color: '#666666', fontSize: 10, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4caf50' },
  statusText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },

  videoWrapper: { backgroundColor: '#1b5e20', borderRadius: 12, padding: 12 },
  videoPlayerContainer: { backgroundColor: '#2e7d32', borderRadius: 10, padding: 14, alignItems: 'center' },
  videoPlayingTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  videoPlayingDuration: { color: '#e8f5e9', fontSize: 10, marginTop: 2 },
  videoDescText: { color: '#f1f8e9', fontSize: 10, textAlign: 'center', marginTop: 4 },
  playBtn: { backgroundColor: '#ffffff', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginTop: 10 },
  playBtnText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 11 },

  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  videoItemActive: { backgroundColor: '#e8f5e9', borderColor: '#4caf50', borderWidth: 1.5 },
  videoItemTitle: { fontSize: 11, fontWeight: 'bold', color: '#333333' },
  videoItemSub: { fontSize: 9, color: '#757575', marginTop: 2 },
  selectBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  monthChipActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  monthChipText: { fontSize: 11, color: '#2e7d32', fontWeight: '600' },

  voiceBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  planCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fbe7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dce775',
  },
  planMonthBadge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planMonthText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  planCropName: { fontSize: 12, fontWeight: 'bold', color: '#1b5e20' },
  planStatusText: { fontSize: 9, color: '#666', marginTop: 2 },

  communityGrid: { flexDirection: 'row', gap: 8, marginTop: 6 },
  communityStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  communityStatIcon: { fontSize: 20, marginBottom: 2 },
  communityStatNum: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },
  communityStatLabel: { fontSize: 9, color: '#666', marginTop: 2, textAlign: 'center' },

  priceRow: { gap: 8, marginTop: 6 },
  priceCard: {
    backgroundColor: '#f9fbe7',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  priceLabel: { fontSize: 11, color: '#555', fontWeight: '500' },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  priceUnit: { fontSize: 11, fontWeight: 'normal', color: '#666' },

  statusCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, elevation: 1 },
  sectionTitle: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  statusGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusBox: {
    flex: 1,
    backgroundColor: '#f9fbe7',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#dce775',
  },
  statusBoxLabel: { fontSize: 10, color: '#616161', fontWeight: 'bold' },
  statusBoxValue: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  statusBoxSub: { fontSize: 9, color: '#757575', marginTop: 2 },

  timerBox: { padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  timerLabel: { fontSize: 11, fontWeight: 'bold', color: '#854d0e' },
  timerNum: { fontSize: 16, fontWeight: 'bold', color: '#a16207', marginTop: 2 },
  timerHint: { fontSize: 10, color: '#991b1b', marginTop: 2 },

  sectionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, elevation: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridBtn: { width: '48%', borderRadius: 10, padding: 10, justifyContent: 'space-between', minHeight: 80 },
  gridIcon: { fontSize: 20, marginBottom: 2 },
  gridTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  gridSub: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 9, marginTop: 2 },

  customInput: {
    borderColor: '#a5d6a7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fafafa',
    fontSize: 12,
    borderWidth: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalCard: { width: '85%', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 5 },
  modalAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#72c07b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAvatarText: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  modalFarmerName: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  modalFarmerId: { fontSize: 12, color: '#757575', marginTop: 2 },
  modalDivider: { width: '100%', height: 1, backgroundColor: '#e0e0e0', marginVertical: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#616161', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#212121', fontWeight: 'bold' },
  closeModalBtn: { backgroundColor: '#2e7d32', width: '100%', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  closeModalText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
});
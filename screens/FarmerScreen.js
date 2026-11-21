import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLiveMoisture } from '../utils/notify';
import { s } from '../styles';
import DailyLogScreen from './DailyLogScreen';
import PhotoScreen from './PhotoScreen';
import PlotInfoScreen from './PlotInfoScreen';
import YieldScreen from './YieldScreen';
import AssistantScreen from './AssistantScreen';
import { SharedBottomNav, SharedTabContent } from './SharedBottomTabs';
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
  const [bottomTab, setBottomTab] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDailyTutorials, setShowDailyTutorials] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoList = [
    { id: 1, title: 'สอนบันทึกกิจกรรมประจำวัน', duration: '02:15 นาที', icon: '📝', desc: 'กรอกข้อมูลการใส่ปุ๋ย ให้น้ำ และการดูแลพืช' },
    { id: 2, title: 'สอนถ่ายรูปแปลงนา + GPS', duration: '01:45 นาที', icon: '📷', desc: 'เปิดกล้องถ่ายภาพแปลงนาพร้อมปักพิกัดอัตโนมัติ' },
    { id: 3, title: 'สอนวัดและบันทึกความชื้น', duration: '01:30 นาที', icon: '💧', desc: 'ใช้งานเครื่องวัดความชื้นและกรอกค่าลงระบบ' },
    { id: 4, title: 'สอนวางแผนปลูกและสรุปรายปี', duration: '03:10 นาที', icon: '🌾', desc: 'ใช้ปฏิทินวางแผนพืชด้วยเสียงและสรุปผลผลิต' },
  ];
  const [activeVideo, setActiveVideo] = useState(videoList[0]);

  const [selectedMonth, setSelectedMonth] = useState('พฤศจิกายน');
  const [cropName, setCropName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef(null);
  const nativeVoiceRef = useRef(null);
  const [cropPlans, setCropPlans] = useState([
    { id: '1', month: 'พฤศจิกายน', crop: 'ข้าวหอมมะลิ 105 (ข้าวนาปี)' },
    { id: '2', month: 'มกราคม', crop: 'ถั่วพร้า / ปุ๋ยพืชสดปรับปรุงดิน' },
  ]);

  const monthsList = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const [moisture, setMoisture] = useState('');
  const [isLiveMoisture, setIsLiveMoisture] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState('home');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let interval;
    if (isLiveMoisture) {
      fetchLiveMoisture().then((val) => {
        if (val !== null) setMoisture(String(val));
      });
      interval = setInterval(async () => {
        const liveValue = await fetchLiveMoisture();
        if (liveValue !== null) setMoisture(String(liveValue));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLiveMoisture]);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        const recognition = speechRecognitionRef.current;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try { recognition.abort(); } catch (e) {}
        speechRecognitionRef.current = null;
      }
      if (nativeVoiceRef.current) {
        nativeVoiceRef.current.destroy().catch(() => {});
        nativeVoiceRef.current = null;
      }
    };
  }, []);

  // 🟢 ฟังก์ชันย้อนกลับไปหน้าหลัก (บริการประจำวัน) สำหรับทุกปุ่ม
  const goHomeDaily = () => {
    setPage('home');
    setRecordMode('daily');
    setBottomTab('home');
    setShowProfileModal(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(SESSION_KEYS);
    } catch (e) {
      console.warn('clear session failed', e);
    }
    setShowProfileModal(false);
    setRecordMode('daily');
    setPage('home');
    if (onLogout) onLogout();
  };

  // 🟢 แถบปุ่มย้อนกลับด้านบนสำหรับ 5 หน้าย่อย (บันทึกวันนี้, ถ่ายรูป GPS, ผู้ช่วย AI, ข้อมูลแปลง, สรุปผลผลิต)
  const renderSubPageWithBack = (title, content) => (
    <SafeAreaView style={f.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />
      <View style={f.subPageBackBar}>
        <TouchableOpacity style={f.subPageBackBtn} onPress={goHomeDaily}>
          <Text style={f.subPageBackBtnText}>❮ ย้อนกลับหน้าหลัก</Text>
        </TouchableOpacity>
        <Text style={f.subPageBackTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={{ flex: 1 }}>{content}</View>
    </SafeAreaView>
  );

  if (page === 'form') {
    return renderSubPageWithBack(
      '📝 บันทึกกิจกรรมวันนี้',
      <DailyLogScreen
        onSave={(type, data) => { if (onLog) onLog(type, data); }}
        onClose={goHomeDaily}
      />
    );
  }
  if (page === 'photo') {
    return renderSubPageWithBack(
      '📷 ถ่ายรูปแปลง + GPS',
      <PhotoScreen onSave={onLog} onClose={goHomeDaily} />
    );
  }
  if (page === 'plot') {
    return renderSubPageWithBack(
      '🗺️ ข้อมูลแปลง',
      <PlotInfoScreen onSave={onLog} onClose={goHomeDaily} />
    );
  }
  if (page === 'yield') {
    return renderSubPageWithBack(
      '📦 สรุปผลผลิต',
      <YieldScreen user={user} onSave={onLog} onClose={goHomeDaily} />
    );
  }
  if (page === 'assistant') {
    return renderSubPageWithBack(
      '🤖 ผู้ช่วยเกษตร AI',
      <AssistantScreen user={user} logs={logs} moisture={moisture} onClose={goHomeDaily} />
    );
  }

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    setIsPlaying(true);
  };

  const saveMoisture = () => {
    const v = parseFloat(moisture);
    if (isNaN(v)) return;
    onLog('วัดความชื้น', { moisture: v, category: 'SENSOR' });
    setMoisture('');
    Alert.alert('บันทึกแล้ว ✅', 'ความชื้น ' + v + '%');
  };

  const handleVoiceRecordAnnual = async () => {
    if (isListening) return;
    setIsListening(true);

    if (Platform.OS === 'web') {
      const SpeechRecognition =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      if (!SpeechRecognition) {
        setIsListening(false);
        Alert.alert('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการรู้จำเสียง แนะนำให้ใช้ Google Chrome');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i += 1) {
          transcript += `${event.results[i][0].transcript} `;
        }
        if (transcript.trim()) setCropName(transcript.trim());
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted') {
          Alert.alert('จับเสียงไม่สำเร็จ', 'กรุณาอนุญาตไมโครโฟนแล้วลองอีกครั้ง');
        }
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
      };
      speechRecognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (error) {
        speechRecognitionRef.current = null;
        setIsListening(false);
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (e) => { if (e.value?.[0]) setCropName(e.value[0].trim()); };
      Voice.onSpeechPartialResults = (e) => { if (e.value?.[0]) setCropName(e.value[0].trim()); };
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechError = () => setIsListening(false);
      const available = await Voice.isAvailable();
      if (!available) { setIsListening(false); return; }
      await Voice.start('th-TH');
    } catch (error) {
      setIsListening(false);
    }
  };

  const handleAddCropPlan = () => {
    if (!cropName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาระบุชื่อพืชที่จะปลูกหรือกดปุ่มพูดด้วยเสียง');
      return;
    }
    const newPlan = { id: Date.now().toString(), month: selectedMonth, crop: cropName.trim() };
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

  const filteredVideos = videoList.filter(
    (v) =>
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // เมนูไอคอน 4 คอลัมน์ (8 ปุ่ม)
  const quickMenuItems = [
    { key: 'form', icon: '📝', label: 'บันทึกวันนี้', bg: '#e8f5e9', onPress: () => setPage('form') },
    { key: 'photo', icon: '📷', label: 'ถ่ายรูป GPS', bg: '#e0f2f1', onPress: () => setPage('photo') },
    { key: 'assistant', icon: '🤖', label: 'ผู้ช่วย AI', bg: '#f1f8e9', onPress: () => setPage('assistant') },
    { key: 'plot', icon: '🗺️', label: 'ข้อมูลแปลง', bg: '#e8f5e9', onPress: () => setPage('plot') },
    { key: 'yield', icon: '📦', label: 'สรุปผลผลิต', bg: '#fffde7', onPress: () => setPage('yield') },
    { key: 'annual', icon: '🗓️', label: 'แผนรายปี', bg: '#e8f5e9', onPress: () => setRecordMode('annual') },
    { key: 'community', icon: '📊', label: 'แดชบอร์ดรวมของกลุ่ม', bg: '#e0f2f1', onPress: () => setRecordMode('community') },
    { key: 'profile', icon: '👤', label: 'โปรไฟล์ฉัน', bg: '#f1f8e9', onPress: () => setShowProfileModal(true) },
  ];

  return (
    <SafeAreaView style={f.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />

      {/* 🟢 Top Header Bar */}
      <View style={f.topHeader}>
        <TouchableOpacity style={f.logoBadge} onPress={goHomeDaily}>
          <Text style={f.logoEmoji}>🌾</Text>
        </TouchableOpacity>
        <View style={f.searchPill}>
          <Text style={f.searchIcon}>🔍</Text>
          <TextInput
            style={f.searchInput}
            placeholder="ค้นหาคู่มือหรือเมนู..."
            placeholderTextColor="#78909c"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={f.headerIconBtn} onPress={handleLogout}>
          <Text style={f.headerIconText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* เนื้อหาหลัก */}
      {bottomTab !== 'home' ? (
        <SharedTabContent
          activeTab={bottomTab}
          user={user}
          role="farmer"
          logs={logs}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfileModal(true)}
        />
      ) : (
        <ScrollView contentContainerStyle={f.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 🟢 Hero Banner Card */}
          <View style={f.heroBanner}>
            <View style={f.heroTopRow}>
              <View style={f.heroTag}>
                <Text style={f.heroTagText}>PlangJai เกษตรกร</Text>
              </View>
              <View style={f.heroTagRight}>
                <Text style={f.heroTagText}>GAP ผ่านรับรอง ✓</Text>
              </View>
            </View>

            <View style={f.heroBody}>
              <View style={{ flex: 1 }}>
                <Text style={f.heroGreeting}>สวัสดี, คุณ{user?.name || 'เกษตรกร'}</Text>
                <Text style={f.heroSub}>📍 กลุ่มวิสาหกิจชุมชน ต.ผักไหม • ID: {user?.id}</Text>
              </View>
              <TouchableOpacity style={f.heroAvatar} onPress={() => setShowProfileModal(true)}>
                <Text style={f.heroAvatarText}>{user?.name ? user.name.charAt(0) : 'ก'}</Text>
              </TouchableOpacity>
            </View>

            <View style={f.heroStatsRow}>
              <View style={f.heroStatPill}>
                <Text style={f.heroStatLabel}>จำนวนแปลง</Text>
                <Text style={f.heroStatVal}>2 แปลง (5 ไร่)</Text>
              </View>
              <View style={f.heroStatPill}>
                <Text style={f.heroStatLabel}>ความชื้นสด</Text>
                <Text style={f.heroStatVal}>{moisture ? `${moisture}%` : '-- %'}</Text>
              </View>
              <View style={f.heroStatPill}>
                <Text style={f.heroStatLabel}>บันทึกแล้ว</Text>
                <Text style={f.heroStatVal}>{logs?.length || 0} รายการ</Text>
              </View>
            </View>
          </View>

          {timerBox}

          {/* 🟢 4-Column Icon Grid Menu (8 ปุ่ม) */}
          <View style={f.gridCard}>
            <View style={f.iconGrid}>
              {quickMenuItems.map((item) => {
                const isActiveMode =
                  (item.key === 'annual' && recordMode === 'annual') ||
                  (item.key === 'community' && recordMode === 'community');
                return (
                  <TouchableOpacity key={item.key} style={f.iconGridItem} onPress={item.onPress}>
                    <View
                      style={[
                        f.iconCircle,
                        { backgroundColor: item.bg },
                        isActiveMode && f.iconCircleActive,
                      ]}
                    >
                      <Text style={f.iconEmoji}>{item.icon}</Text>
                    </View>
                    <Text
                      style={[f.iconLabel, isActiveMode && { color: '#1b5e20', fontWeight: 'bold' }]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 🟢 เส้นคั่นหัวข้อกลาง */}
          <View style={f.sectionDividerRow}>
            <View style={f.dividerLine} />
            <Text style={f.sectionDividerText}>
              {recordMode === 'daily'
                ? 'บริการประจำวัน'
                : recordMode === 'annual'
                  ? 'แผนการปลูกและรายปี'
                  : 'แดชบอร์ดรวมของกลุ่ม'}
            </Text>
            <View style={f.dividerLine} />
          </View>

          {/* 🟢 ปุ่มย้อนกลับไปหน้าหลัก (บริการประจำวัน) เมื่ออยู่ในโหมดแผนรายปี หรือ แดชบอร์ดรวมของกลุ่ม */}
          {recordMode !== 'daily' && (
            <TouchableOpacity style={f.inlineBackBtn} onPress={goHomeDaily}>
              <Text style={f.inlineBackBtnText}>❮ ย้อนกลับหน้าหลัก (บริการประจำวัน)</Text>
            </TouchableOpacity>
          )}

          {/* เนื้อหาตามแท็บที่เลือก */}
          {recordMode === 'daily' && (
            <>
              {/* การ์ดวัดความชื้น Real-time */}
              <View style={f.card}>
                <View style={f.cardHeaderRow}>
                  <Text style={f.cardTitle}>💧 วัดและบันทึกความชื้นข้าวเปลือก</Text>
                  <TouchableOpacity
                    style={f.liveBadge}
                    onPress={() => setIsLiveMoisture(!isLiveMoisture)}
                  >
                    <View style={[f.liveDot, { backgroundColor: isLiveMoisture ? '#22c55e' : '#ef4444' }]} />
                    <Text style={f.liveBadgeText}>{isLiveMoisture ? 'เรียลไทม์' : 'พิมพ์เอง'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={f.inputCaption}>ค่าความชื้นจากเซนเซอร์ปัจจุบัน (%)</Text>
                <View style={f.moistureRow}>
                  <TextInput
                    style={[f.customInput, { flex: 1, fontWeight: 'bold', color: '#1b5e20', fontSize: 16 }]}
                    value={moisture}
                    onChangeText={(val) => {
                      setMoisture(val);
                      setIsLiveMoisture(false);
                    }}
                    keyboardType="numeric"
                    placeholder="กำลังดึงข้อมูล..."
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity style={f.saveMoistureBtn} onPress={saveMoisture}>
                    <Text style={f.saveMoistureText}>💾 บันทึก</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* วิดีโอคู่มือการใช้งาน */}
              <View style={f.card}>
                <Text style={f.cardTitle}>🎥 การสอนบันทึกกิจกรรมประจำวัน</Text>

                <View style={f.videoPlayerBox}>
                  <Text style={{ fontSize: 32 }}>🎬</Text>
                  <Text style={f.videoPlayingTitle}>{activeVideo.title}</Text>
                  <Text style={f.videoPlayingSub}>⏱️ {activeVideo.duration} • {activeVideo.desc}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={f.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                      <Text style={f.playBtnText}>{isPlaying ? '⏸️ หยุดเล่น' : '▶️ เล่นวิดีโอ'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={f.playBtn}
                      onPress={() => setShowDailyTutorials((visible) => !visible)}
                    >
                      <Text style={f.playBtnText}>
                        {showDailyTutorials ? '▲ ซ่อนบทเรียนย่อย' : '▼ ดู 4 บทเรียนย่อย'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={f.videoContactInfo}>
                  ติดต่อ (ตัวอย่างสมมติ โทรไม่ได้): เจ้าหน้าที่เกษตร 08X-XXX-1003 • ผู้ดูแลแอป 08X-XXX-1004
                </Text>

                {(showDailyTutorials || searchQuery.trim()) && (
                  <View style={f.videoGrid}>
                    {filteredVideos.map((item) => {
                      const isSelected = activeVideo.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[f.videoMiniCard, isSelected && f.videoMiniCardActive]}
                          onPress={() => handleSelectVideo(item)}
                        >
                          <View style={f.videoMiniTop}>
                            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                            <Text style={f.videoMiniDur}>{item.duration}</Text>
                          </View>
                          <Text style={f.videoMiniTitle} numberOfLines={2}>{item.title}</Text>
                          <Text style={f.videoMiniDesc} numberOfLines={2}>{item.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          {recordMode === 'annual' && (
            <>
              <View style={f.card}>
                <Text style={f.cardTitle}>🌱 วางแผนการปลูกพืชประจำปี (รองรับเสียง)</Text>
                <Text style={f.inputCaption}>1. เลือกเดือนที่จะปลูก</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {monthsList.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[f.monthChip, selectedMonth === m && f.monthChipActive]}
                        onPress={() => setSelectedMonth(m)}
                      >
                        <Text style={[f.monthChipText, selectedMonth === m && { color: '#fff' }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={f.inputCaption}>2. ระบุชื่อพืชที่จะปลูก</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[f.customInput, { flex: 1 }]}
                    placeholder="พิมพ์ชื่อพืช เช่น ข้าวหอมมะลิ..."
                    value={cropName}
                    onChangeText={setCropName}
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity
                    style={[f.voiceBtn, isListening && { backgroundColor: '#dc2626' }]}
                    onPress={handleVoiceRecordAnnual}
                    disabled={isListening}
                  >
                    <Text style={f.voiceBtnText}>{isListening ? '🎙️ ฟังอยู่' : '🎙️ พูด'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={f.primaryFullBtn} onPress={handleAddCropPlan}>
                  <Text style={f.primaryFullBtnText}>➕ บันทึกแผนการปลูกลงปฏิทิน</Text>
                </TouchableOpacity>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>📅 ปฏิทินแผนงานในปีนี้</Text>
                {cropPlans.length === 0 ? (
                  <Text style={f.emptyText}>ยังไม่มีรายการแผนการปลูก</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {cropPlans.map((plan) => (
                      <View key={plan.id} style={f.planCardItem}>
                        <View style={f.planMonthBadge}>
                          <Text style={f.planMonthText}>{plan.month}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
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
            </>
          )}

          {recordMode === 'community' && (
            <>
              <View style={f.card}>
                <Text style={f.cardTitle}>📊 แดชบอร์ดรวมของกลุ่ม ต.ผักไหม</Text>
                <View style={f.communityGrid}>
                  <View style={f.communityStatBox}>
                    <Text style={f.communityStatIcon}>🌾</Text>
                    <Text style={f.communityStatNum}>125 ไร่</Text>
                    <Text style={f.communityStatLabel}>พื้นที่ปลูกรวม</Text>
                  </View>
                  <View style={f.communityStatBox}>
                    <Text style={f.communityStatIcon}>👨‍🌾</Text>
                    <Text style={f.communityStatNum}>24 ราย</Text>
                    <Text style={f.communityStatLabel}>สมาชิกกลุ่ม</Text>
                  </View>
                  <View style={f.communityStatBox}>
                    <Text style={f.communityStatIcon}>📦</Text>
                    <Text style={f.communityStatNum}>68 ตัน</Text>
                    <Text style={f.communityStatLabel}>คาดการณ์ผลผลิต</Text>
                  </View>
                </View>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>💰 ราคารับซื้อข้าวเปลือกหอมมะลิ (วันนี้)</Text>
                <View style={f.priceRow}>
                  <View style={f.priceCard}>
                    <Text style={f.priceLabel}>ข้าวเปลือกแห้ง (ชื้น ≤ 15%)</Text>
                    <Text style={f.priceValue}>15,200 <Text style={f.priceUnit}>บาท/ตัน</Text></Text>
                  </View>
                  <View style={f.priceCard}>
                    <Text style={f.priceLabel}>ข้าวเปลือกเกี่ยวสด (ชื้น 25%)</Text>
                    <Text style={f.priceValue}>12,800 <Text style={f.priceUnit}>บาท/ตัน</Text></Text>
                  </View>
                </View>
                <TouchableOpacity style={f.aiPriceButton} onPress={() => setPage('assistant')}>
                  <Text style={f.aiPriceButtonText}>🤖 ถาม AI วิธีลดความชื้นข้าว</Text>
                </TouchableOpacity>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>🌤️ พยากรณ์อากาศ • ต.ผักไหม</Text>
                <View style={f.weatherSummary}>
                  <View>
                    <Text style={f.weatherCaption}>อุณหภูมิโดยประมาณ</Text>
                    <Text style={f.weatherTemperature}>☀️ 29°C</Text>
                  </View>
                  <View style={f.weatherAdvice}>
                    <Text style={f.weatherAdviceTitle}>คำแนะนำ</Text>
                    <Text style={f.weatherAdviceText}>เหมาะแก่การตากข้าว</Text>
                  </View>
                </View>
                <View style={f.forecastRow}>
                  {[
                    { day: 'พฤ. 19 พ.ย.', temperature: '31° / 22°', rain: 'ฝน 10%' },
                    { day: 'ศ. 20 พ.ย.', temperature: '30° / 22°', rain: 'ฝน 35%' },
                    { day: 'ส. 21 พ.ย.', temperature: '29° / 21°', rain: 'ฝน 60%' },
                  ].map((fc) => (
                    <View key={fc.day} style={f.forecastDay}>
                      <Text style={f.forecastDayTitle}>{fc.day}</Text>
                      <Text style={f.forecastTemperature}>{fc.temperature}</Text>
                      <Text style={f.forecastRain}>{fc.rain}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>🗓️ ปฏิทินรอบการผลิตของกลุ่ม</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {['เตรียมดิน', 'หว่าน', 'บำรุง', 'เก็บเกี่ยว'].map((stage, index) => (
                    <View
                      key={stage}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        backgroundColor: index === 2 ? '#2e7d32' : index < 2 ? '#e8f5e9' : '#f9fafb',
                        borderColor: index === 2 ? '#2e7d32' : index < 2 ? '#c8e6c9' : '#e5e7eb',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: index === 2 ? '#fff' : index < 2 ? '#2e7d32' : '#6b7280' }}>
                        {index < 2 ? '✓' : index + 1}
                      </Text>
                      <Text style={{ fontSize: 10, marginTop: 2, fontWeight: index === 2 ? 'bold' : '500', color: index === 2 ? '#fff' : '#4b5563' }}>
                        {stage}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2e7d32', marginTop: 8 }}>
                  ช่วงปัจจุบัน: บำรุงต้นข้าว
                </Text>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>📊 ภาพรวมการบันทึกและต้นทุน</Text>
                <View style={f.communityGrid}>
                  <View style={f.communityStatBox}>
                    <Text style={f.communityStatIcon}>📝</Text>
                    <Text style={f.communityStatNum}>18/24 ราย</Text>
                    <Text style={f.communityStatLabel}>สมาชิกบันทึกข้อมูลแล้ว</Text>
                  </View>
                  <View style={[f.communityStatBox, { backgroundColor: '#fffde7', borderColor: '#dce775' }]}>
                    <Text style={f.communityStatIcon}>💵</Text>
                    <Text style={f.communityStatNum}>1,250 บาท/ไร่</Text>
                    <Text style={f.communityStatLabel}>ต้นทุนเฉลี่ยต่อไร่</Text>
                  </View>
                </View>
              </View>

              <View style={f.card}>
                <Text style={f.cardTitle}>📣 ประกาศจากกลุ่ม</Text>
                <View style={f.announcementCard}>
                  <Text style={f.announcementMeta}>ประธานกลุ่ม • 17 พ.ย. 2569</Text>
                  <Text style={f.announcementTitle}>นัดสมาชิกนำตัวอย่างข้าวมาตรวจความชื้น</Text>
                  <Text style={f.announcementText}>วันศุกร์ เวลา 09.00 น. ณ ศาลากลุ่ม ก่อนวางแผนจำหน่ายผลผลิต</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* 🟢 Bottom Navigation Bar (กดหน้าหลักจะกลับมาหน้ารูปที่ 2 อัตโนมัติ) */}
      <SharedBottomNav
        activeTab={bottomTab}
        onSelectTab={(tab) => {
          setBottomTab(tab);
          if (tab === 'home') {
            setRecordMode('daily');
          }
        }}
        unreadCount={3}
      />

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
              <Text style={f.infoValue}>{displayDob || 'ยังไม่ได้ระบุ'}</Text>
            </View>
            <View style={f.infoRow}>
              <Text style={f.infoLabel}>👤 อายุ:</Text>
              <Text style={f.infoValue}>{displayAge !== null ? `${displayAge} ปี` : 'ยังไม่ได้ระบุ'}</Text>
            </View>
            <View style={f.infoRow}>
              <Text style={f.infoLabel}>🏞️ แปลงที่ครอบครอง:</Text>
              <Text style={f.infoValue}>2 แปลง (5 ไร่)</Text>
            </View>
            <View style={f.infoRow}>
              <Text style={f.infoLabel}>📍 ที่ตั้งแปลงหลัก:</Text>
              <Text style={f.infoValue}>ต.ผักไหม อ.ห้วยทับทัน</Text>
            </View>
            <View style={f.infoRow}>
              <Text style={f.infoLabel}>🛡️ สถานะ GAP:</Text>
              <Text style={[f.infoValue, { color: '#2e7d32' }]}>ผ่านการรับรอง</Text>
            </View>

            <TouchableOpacity style={f.closeModalBtn} onPress={goHomeDaily}>
              <Text style={f.closeModalText}>❮ ย้อนกลับหน้าหลัก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const f = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7f2' },

  // แถบปุ่มย้อนกลับสำหรับหน้าย่อยทั้ง 5 หน้า
  subPageBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  subPageBackBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  subPageBackBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subPageBackTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // ปุ่มย้อนกลับในหน้าหลักเมื่อสลับไปแผนรายปี หรือ แดชบอร์ดรวมของกลุ่ม
  inlineBackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#81c784',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  inlineBackBtnText: {
    color: '#1b5e20',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Top Header Bar
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 20 },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#1f2937', outlineStyle: 'none' },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: { fontSize: 16 },

  scrollContent: { padding: 14, paddingBottom: 28, gap: 14 },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#388e3c',
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#1b5e20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  heroTag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroTagRight: { backgroundColor: '#1b5e20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroTagText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  heroBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroGreeting: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  heroSub: { color: '#e8f5e9', fontSize: 12, marginTop: 3 },
  heroAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: { color: '#2e7d32', fontSize: 20, fontWeight: 'bold' },
  heroStatsRow: { flexDirection: 'row', gap: 8 },
  heroStatPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  heroStatLabel: { color: '#e8f5e9', fontSize: 10 },
  heroStatVal: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },

  // 4-Column Icon Grid
  gridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconGridItem: { width: '25%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircleActive: {
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  iconEmoji: { fontSize: 24 },
  iconLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },

  // Section Divider
  sectionDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#c8e6c9' },
  sectionDividerText: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8 },
  inputCaption: { fontSize: 12, color: '#4b5563', fontWeight: '600', marginBottom: 6 },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveBadgeText: { fontSize: 11, color: '#166534', fontWeight: 'bold' },

  moistureRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: {
    borderColor: '#c8e6c9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#f9fafb',
    fontSize: 13,
  },
  saveMoistureBtn: {
    backgroundColor: '#2e7d32',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMoistureText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  // Videos
  videoPlayerBox: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlayingTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 6 },
  videoPlayingSub: { color: '#e8f5e9', fontSize: 11, textAlign: 'center', marginTop: 4 },
  playBtn: { backgroundColor: '#ffffff', paddingVertical: 7, paddingHorizontal: 18, borderRadius: 20, marginTop: 10 },
  playBtnText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  videoContactInfo: { color: '#6b7280', fontSize: 10, textAlign: 'center', marginBottom: 10 },

  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  videoMiniCard: {
    width: '48.5%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  videoMiniCardActive: { backgroundColor: '#e8f5e9', borderColor: '#4caf50', borderWidth: 1.5 },
  videoMiniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  videoMiniDur: { fontSize: 10, color: '#2e7d32', fontWeight: 'bold', backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  videoMiniTitle: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  videoMiniDesc: { fontSize: 10, color: '#6b7280', marginTop: 3 },

  // Annual
  monthChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9' },
  monthChipActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  monthChipText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  voiceBtn: { backgroundColor: '#15803d', paddingHorizontal: 14, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  voiceBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  primaryFullBtn: { backgroundColor: '#2e7d32', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  primaryFullBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  planCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fbe7', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#dce775' },
  planMonthBadge: { backgroundColor: '#2e7d32', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  planMonthText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  planCropName: { fontSize: 13, fontWeight: 'bold', color: '#1b5e20' },
  planStatusText: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  emptyText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginVertical: 12 },

  // Community
  communityGrid: { flexDirection: 'row', gap: 8 },
  communityStatBox: { flex: 1, backgroundColor: '#f1f8e9', padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#c8e6c9' },
  communityStatIcon: { fontSize: 22, marginBottom: 4 },
  communityStatNum: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20' },
  communityStatLabel: { fontSize: 10, color: '#4b5563', marginTop: 2, textAlign: 'center' },
  priceRow: { gap: 8 },
  priceCard: { backgroundColor: '#f9fbe7', padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  priceLabel: { fontSize: 12, color: '#4b5563' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  priceUnit: { fontSize: 12, fontWeight: 'normal', color: '#6b7280' },
  aiPriceButton: { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7', borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  aiPriceButtonText: { color: '#1b5e20', fontSize: 12, fontWeight: 'bold' },
  weatherSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fbe7', borderRadius: 12, padding: 12 },
  weatherCaption: { fontSize: 11, color: '#6b7280' },
  weatherTemperature: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  weatherAdvice: { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10 },
  weatherAdviceTitle: { fontSize: 10, color: '#2e7d32', fontWeight: 'bold' },
  weatherAdviceText: { fontSize: 12, color: '#1b5e20', fontWeight: 'bold', marginTop: 2 },
  forecastRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  forecastDay: { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  forecastDayTitle: { fontSize: 10, color: '#374151', fontWeight: 'bold' },
  forecastTemperature: { fontSize: 11, color: '#1b5e20', fontWeight: 'bold', marginTop: 4 },
  forecastRain: { fontSize: 10, color: '#0284c7', marginTop: 2 },
  announcementCard: { backgroundColor: '#f9fbe7', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#7cb342' },
  announcementMeta: { fontSize: 10, color: '#6b7280' },
  announcementTitle: { fontSize: 13, color: '#1b5e20', fontWeight: 'bold', marginTop: 4 },
  announcementText: { fontSize: 12, color: '#4b5563', marginTop: 3, lineHeight: 18 },

  // Timer
  timerBox: { padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  timerLabel: { fontSize: 12, fontWeight: 'bold', color: '#854d0e' },
  timerNum: { fontSize: 18, fontWeight: 'bold', color: '#a16207', marginTop: 2 },
  timerHint: { fontSize: 11, color: '#991b1b', marginTop: 2 },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomNavIcon: { fontSize: 20, opacity: 0.55 },
  bottomNavActive: { opacity: 1 },
  bottomNavText: { fontSize: 10, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  bottomNavTextActive: { color: '#2e7d32', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center', elevation: 5 },
  modalAvatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modalAvatarText: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  modalFarmerName: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },
  modalFarmerId: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalDivider: { width: '100%', height: 1, backgroundColor: '#e5e7eb', marginVertical: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#4b5563' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: 'bold' },
  closeModalBtn: { backgroundColor: '#2e7d32', width: '100%', paddingVertical: 11, borderRadius: 12, alignItems: 'center', marginTop: 18 },
  closeModalText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { requestAssistant } from '../lib/assistantApi';

// 🟢 1. แถบเมนูด้านล่าง (ใช้ร่วมกันทั้ง 2 ฝั่ง)
export function SharedBottomNav({ activeTab, onSelectTab, unreadCount = 2 }) {
  const tabs = [
    { key: 'home', icon: '🏠', label: 'หน้าหลัก' },
    { key: 'chat', icon: '💬', label: 'แชท/ปรึกษา' },
    { key: 'notifications', icon: '🔔', label: 'แจ้งเตือน', badge: unreadCount },
    { key: 'news', icon: '📈', label: 'ราคา/ข่าว' },
    { key: 'settings', icon: '⚙️', label: 'บัญชี' },
  ];

  return (
    <View style={st.bottomNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={st.bottomNavItem}
            onPress={() => onSelectTab(tab.key)}
          >
            <View style={{ position: 'relative' }}>
              <Text style={[st.bottomNavIcon, isActive && st.bottomNavActive]}>
                {tab.icon}
              </Text>
              {tab.badge > 0 && !isActive && (
                <View style={st.badgeDot}>
                  <Text style={st.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[st.bottomNavText, isActive && st.bottomNavTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 🟢 2. เนื้อหาของ 4 แท็บใหม่ (แชท, แจ้งเตือน, ราคา/ข่าว, บัญชี)
export function SharedTabContent({
  activeTab,
  user,
  role = 'farmer',
  logs = [],
  onLogout,
  onOpenProfile,
}) {
  const [largeText, setLargeText] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef(null);
  const nativeVoiceRef = useRef(null);
  const voiceBaseChatInputRef = useRef('');
  const [messages, setMessages] = useState(() =>
    role === 'farmer'
      ? [
          {
            id: 'welcome',
            sender: 'ผู้ช่วย AI',
            isMe: false,
            role: 'assistant',
            text: 'สวัสดีครับ มีคำถามเรื่องข้าว การจัดการน้ำ ปุ๋ย หรือมาตรฐาน GAP ถามได้เลยครับ',
            time: '09:30',
          },
        ]
      : [
          {
            id: 'welcome',
            sender: 'ผู้ช่วย AI',
            isMe: false,
            role: 'assistant',
            text: 'สวัสดีครับ ผมเป็นผู้ช่วย AI สำหรับเจ้าหน้าที่ ถามเรื่องการตรวจแปลง มาตรฐาน GAP หรือการจัดการข้าวได้เลยครับ',
            time: '09:30',
          },
        ]
  );

  const setVoiceTranscript = (transcript) => {
    const text = transcript.trim();
    if (!text) return;
    const baseInput = voiceBaseChatInputRef.current;
    setChatInput(baseInput ? `${baseInput} ${text}` : text);
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        const recognition = speechRecognitionRef.current;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch (error) {
          console.warn('Stop browser speech recognition failed:', error);
        }
        speechRecognitionRef.current = null;
      }

      if (nativeVoiceRef.current) {
        nativeVoiceRef.current
          .destroy()
          .catch((error) => console.warn('Stop native speech recognition failed:', error));
        nativeVoiceRef.current = null;
      }
    };
  }, []);

  const handleVoiceInput = async () => {
    if (isListening) {
      try {
        if (Platform.OS === 'web' && speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        } else if (nativeVoiceRef.current) {
          await nativeVoiceRef.current.stop();
        }
      } catch (error) {
        setIsListening(false);
        Alert.alert('หยุดฟังเสียงไม่ได้', error.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    voiceBaseChatInputRef.current = chatInput.trimEnd();
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
        setVoiceTranscript(transcript);
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted') {
          const message =
            event.error === 'not-allowed' || event.error === 'service-not-allowed'
              ? 'กรุณาอนุญาตให้เบราว์เซอร์ใช้ไมโครโฟน แล้วลองอีกครั้ง'
              : event.error === 'no-speech'
                ? 'ไม่ได้ยินเสียงพูด กรุณาลองพูดอีกครั้ง'
                : `กรุณาลองอีกครั้ง (${event.error})`;
          Alert.alert('จับเสียงไม่สำเร็จ', message);
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
        Alert.alert('เริ่มใช้ไมโครโฟนไม่ได้', error.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (event) => setVoiceTranscript(event.value?.[0] || '');
      Voice.onSpeechPartialResults = (event) => setVoiceTranscript(event.value?.[0] || '');
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechError = (event) => {
        setIsListening(false);
        Alert.alert(
          'จับเสียงไม่สำเร็จ',
          event.error?.message || 'กรุณาตรวจสอบสิทธิ์ไมโครโฟนและลองพูดอีกครั้ง'
        );
      };

      const available = await Voice.isAvailable();
      if (!available) {
        setIsListening(false);
        Alert.alert('ไม่พบระบบรู้จำเสียง', 'กรุณาตรวจสอบว่ามีบริการรู้จำเสียงในอุปกรณ์');
        return;
      }

      await Voice.start('th-TH');
    } catch (error) {
      setIsListening(false);
      Alert.alert(
        'เริ่มใช้ไมโครโฟนไม่ได้',
        error.message || 'กรุณาเปิดแอปด้วย Development Build และอนุญาตใช้ไมโครโฟน'
      );
    }
  };

  const handleSendChat = async () => {
    const textToSend = chatInput.trim();
    if (!textToSend || chatLoading) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const userMessage = {
      id: Date.now().toString(),
      sender: 'ฉัน',
      isMe: true,
      role: 'user',
      text: textToSend,
      time: timeStr,
    };
    setMessages((current) => [...current, userMessage]);
    setChatInput('');

    setChatLoading(true);
    try {
      const history = messages
        .filter((message) => message.id !== 'welcome' && !message.failed && !message.isError)
        .filter((message) => message.role)
        .map((message) => ({ role: message.role, content: message.text }));
      const reply = await requestAssistant(
        [...history, { role: 'user', content: textToSend }]
      );
      const replyTime = new Date();
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          sender: 'ผู้ช่วย AI',
          isMe: false,
          role: 'assistant',
          text: reply,
          time: `${String(replyTime.getHours()).padStart(2, '0')}:${String(
            replyTime.getMinutes()
          ).padStart(2, '0')}`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current.map((message) =>
          message.id === userMessage.id ? { ...message, failed: true } : message
        ),
        {
          id: `${Date.now()}-error`,
          sender: 'ผู้ช่วย AI',
          isMe: false,
          isError: true,
          text: `ขออภัย ส่งคำถามไม่สำเร็จ: ${error.message}`,
          time: timeStr,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const fs = (size) => (largeText ? size + 3 : size);

  // --- แท็บ 1: แชท / ปรึกษา ---
  if (activeTab === 'chat') {
    return (
      <View style={st.chatContainer}>
        <View style={st.chatHeader}>
          <Text style={[st.sectionTitle, { marginBottom: 0, fontSize: fs(14) }]}>
            💬 {role === 'farmer' ? 'ห้องปรึกษา AI เกษตร' : 'ผู้ช่วย AI สำหรับเจ้าหน้าที่'}
          </Text>
          <Text style={{ fontSize: 11, color: '#2e7d32' }}>
            ● AI พร้อมให้คำปรึกษา
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                st.chatBubble,
                m.isMe ? st.chatMe : st.chatOther,
                m.isError && st.chatError,
              ]}
            >
              {!m.isMe && <Text style={st.chatSender}>{m.sender}</Text>}
              <Text
                style={[
                  st.chatText,
                  m.isMe && { color: '#fff' },
                  m.isError && st.chatErrorText,
                  { fontSize: fs(13) },
                ]}
              >
                {m.text}
              </Text>
              <Text style={[st.chatTime, m.isMe && { color: '#e8f5e9' }]}>
                {m.time}
              </Text>
            </View>
          ))}
          {chatLoading && (
            <View style={[st.chatBubble, st.chatOther]}>
              <Text style={st.chatSender}>ผู้ช่วย AI</Text>
              <Text style={[st.chatText, { fontSize: fs(13) }]}>กำลังคิดคำตอบ...</Text>
            </View>
          )}
        </ScrollView>

        <View style={st.chatInputRow}>
          <TextInput
            style={st.chatInput}
            placeholder="พิมพ์คำถามถึงผู้ช่วย AI..."
            placeholderTextColor="#9ca3af"
            value={chatInput}
            onChangeText={(text) => {
              setChatInput(text);
              if (isListening) voiceBaseChatInputRef.current = text.trimEnd();
            }}
            onSubmitEditing={handleSendChat}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[st.micBtn, isListening && st.micBtnActive]}
            onPress={handleVoiceInput}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'หยุดฟังเสียง' : 'เริ่มพูดคำถาม'}
          >
            <Text style={st.micBtnText}>{isListening ? '⏹️' : '🎙️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.sendBtn, (chatLoading || !chatInput.trim()) && st.sendBtnDisabled]}
            onPress={handleSendChat}
            disabled={chatLoading || !chatInput.trim()}
          >
            <Text style={st.sendBtnText}>{chatLoading ? '...' : 'ส่ง'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- แท็บ 2: แจ้งเตือน ---
  if (activeTab === 'notifications') {
    const alerts =
      role === 'farmer'
        ? [
            { id: '1', icon: '🌧️', title: 'แจ้งเตือนสภาพอากาศ', desc: 'วันเสาร์มีโอกาสฝนตก 60% ควรวางแผนการตากข้าว', time: '10 นาทีที่แล้ว', bg: '#e0f2fe' },
            { id: '2', icon: '💧', title: 'เตือนวัดความชื้นข้าวเปลือก', desc: 'อย่าลืมบันทึกค่าความชื้นประจำวันเพื่อรักษาคุณภาพ GAP', time: '2 ชั่วโมงที่แล้ว', bg: '#e8f5e9' },
            { id: '3', icon: '🛡️', title: 'สถานะใบรับรอง GAP', desc: 'ใบรับรองของคุณยังใช้งานได้ (หมดอายุ 12/2026)', time: 'เมื่อวาน', bg: '#fffde7' },
          ]
        : [
            { id: '1', icon: '📝', title: 'มีการบันทึกกิจกรรมใหม่', desc: `มีบันทึกในระบบทั้งหมด ${logs?.length || 0} รายการ กดซิงก์เพื่อตรวจสอบล่าสุด`, time: 'เมื่อสักครู่', bg: '#e8f5e9' },
            { id: '2', icon: '📍', title: 'นัดหมายลงตรวจแปลง', desc: 'แปลง ต.ผักไหม รอการยืนยันพิกัด GPS และตรวจประเมิน GAP', time: '1 ชั่วโมงที่แล้ว', bg: '#e0f2fe' },
            { id: '3', icon: '🔬', title: 'ระบบ AI สแกนโรคข้าวพร้อมใช้งาน', desc: 'อัปเดตโมเดลเวอร์ชันล่าสุด แยกแยะใบข้าวและสิ่งแปลกปลอมแม่นยำ 98%', time: 'วันนี้', bg: '#f1f8e9' },
          ];

    return (
      <ScrollView contentContainerStyle={st.scrollPad}>
        <Text style={[st.sectionTitle, { fontSize: fs(15) }]}>🔔 ศูนย์การแจ้งเตือน</Text>
        {alerts.map((item) => (
          <View key={item.id} style={st.alertCard}>
            <View style={[st.alertIconBox, { backgroundColor: item.bg }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[st.alertTitle, { fontSize: fs(13) }]}>{item.title}</Text>
                <Text style={st.alertTime}>{item.time}</Text>
              </View>
              <Text style={[st.alertDesc, { fontSize: fs(12) }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  // --- แท็บ 3: ราคา & ข่าวสาร ---
  if (activeTab === 'news') {
    return (
      <ScrollView contentContainerStyle={st.scrollPad}>
        <View style={st.card}>
          <Text style={[st.sectionTitle, { fontSize: fs(14) }]}>💰 ราคารับซื้อข้าวเปลือกหอมมะลิ (วันนี้)</Text>
          <View style={st.priceBox}>
            <Text style={[st.priceLabel, { fontSize: fs(12) }]}>ข้าวเปลือกแห้ง (ชื้นไม่เกิน 15%)</Text>
            <Text style={[st.priceVal, { fontSize: fs(18) }]}>15,200 บาท/ตัน</Text>
          </View>
          <View style={[st.priceBox, { marginTop: 8 }]}>
            <Text style={[st.priceLabel, { fontSize: fs(12) }]}>ข้าวเปลือกเกี่ยวสด (ชื้น 25%)</Text>
            <Text style={[st.priceVal, { fontSize: fs(18) }]}>12,800 บาท/ตัน</Text>
          </View>
        </View>

        <View style={st.card}>
          <Text style={[st.sectionTitle, { fontSize: fs(14) }]}>🌤️ พยากรณ์อากาศ • ต.ผักไหม</Text>
          <View style={st.weatherRow}>
            <View>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>อุณหภูมิวันนี้</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1b5e20' }}>☀️ 29°C</Text>
            </View>
            <View style={st.weatherPill}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2e7d32' }}>เหมาะแก่การตากข้าว</Text>
            </View>
          </View>
        </View>

        <View style={st.card}>
          <Text style={[st.sectionTitle, { fontSize: fs(14) }]}>📣 ประกาศจากกลุ่มวิสาหกิจชุมชน</Text>
          <View style={st.announceBox}>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>ประธานกลุ่ม • 17 พ.ย. 2569</Text>
            <Text style={[st.alertTitle, { marginTop: 4, fontSize: fs(13) }]}>
              นัดสมาชิกนำตัวอย่างข้าวมาตรวจความชื้น
            </Text>
            <Text style={[st.alertDesc, { fontSize: fs(12) }]}>
              วันศุกร์ เวลา 09.00 น. ณ ศาลากลุ่ม ก่อนวางแผนจำหน่ายผลผลิต
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // --- แท็บ 4: ตั้งค่า / บัญชี ---
  return (
    <ScrollView contentContainerStyle={st.scrollPad}>
      <View style={st.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={st.profileAvatar}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0) : role === 'officer' ? 'จ' : 'ก'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.sectionTitle, { marginBottom: 2, fontSize: fs(15) }]}>
              {user?.name || (role === 'officer' ? 'เจ้าหน้าที่สมศรี' : 'เกษตรกร')}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              รหัส: {user?.id || '-'} • สถานะ: {role === 'officer' ? 'เจ้าหน้าที่ตรวจแปลง' : 'สมาชิกเกษตรกร'}
            </Text>
          </View>
        </View>

        {onOpenProfile && (
          <TouchableOpacity style={st.outlineBtn} onPress={onOpenProfile}>
            <Text style={st.outlineBtnText}>👤 ดูข้อมูลโปรไฟล์และแปลงปลูกแบบเต็ม</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={st.card}>
        <Text style={[st.sectionTitle, { fontSize: fs(14) }]}>⚙️ การตั้งค่าการใช้งาน</Text>
        <View style={st.settingRow}>
          <View>
            <Text style={[st.alertTitle, { fontSize: fs(13) }]}>โหมดตัวอักษรขนาดใหญ่</Text>
            <Text style={st.alertDesc}>ช่วยให้อ่านข้อความในหน้านี้ได้ชัดเจนขึ้น</Text>
          </View>
          <Switch value={largeText} onValueChange={setLargeText} trackColor={{ true: '#4caf50' }} />
        </View>
      </View>

      <TouchableOpacity style={st.logoutFullBtn} onPress={onLogout}>
        <Text style={st.logoutFullText}>🚪 ออกจากระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
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
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  scrollPad: { padding: 14, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20', marginBottom: 10 },

  // Chat
  chatContainer: { flex: 1, backgroundColor: '#f4f7f2' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatBubble: { maxWidth: '80%', padding: 10, borderRadius: 14 },
  chatMe: { alignSelf: 'flex-end', backgroundColor: '#2e7d32', borderBottomRightRadius: 4 },
  chatOther: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  chatError: { backgroundColor: '#ffebee', borderColor: '#ef9a9a' },
  chatErrorText: { color: '#c62828' },
  chatSender: { fontSize: 10, fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  chatText: { fontSize: 13, color: '#1f2937' },
  chatTime: { fontSize: 9, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 4 },
  chatInputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  chatInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, height: 40, fontSize: 13 },
  micBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8d6c8', justifyContent: 'center', alignItems: 'center' },
  micBtnActive: { backgroundColor: '#ffebee', borderColor: '#ef9a9a' },
  micBtnText: { fontSize: 17 },
  sendBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 18, borderRadius: 20, justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#a5d6a7' },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Alerts
  alertCard: { flexDirection: 'row', backgroundColor: '#ffffff', padding: 12, borderRadius: 14, gap: 12, alignItems: 'center', elevation: 1 },
  alertIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  alertTitle: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  alertTime: { fontSize: 10, color: '#9ca3af' },
  alertDesc: { fontSize: 12, color: '#4b5563', marginTop: 2 },

  // News
  priceBox: { backgroundColor: '#f9fbe7', padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  priceLabel: { fontSize: 12, color: '#4b5563' },
  priceVal: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fbe7', padding: 12, borderRadius: 12 },
  weatherPill: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  announceBox: { backgroundColor: '#f9fbe7', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#7cb342' },

  // Settings
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  outlineBtn: { marginTop: 12, borderWidth: 1, borderColor: '#2e7d32', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  outlineBtnText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  logoutFullBtn: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  logoutFullText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 14 },
});
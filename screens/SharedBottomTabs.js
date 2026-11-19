import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';

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
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: role === 'farmer' ? 'เจ้าหน้าที่สมศรี' : 'คุณลุงสมหมาย',
      isMe: false,
      text:
        role === 'farmer'
          ? 'สวัสดีครับ มีคำถามเรื่องโรคข้าวหรือการตรวจ GAP ทักมาได้เลยนะครับ'
          : 'สวัสดีครับเจ้าหน้าที่ วันศุกร์นี้ผมพร้อมให้ลงตรวจแปลงแล้วครับ',
      time: '09:30',
    },
    {
      id: '2',
      sender: 'ฉัน',
      isMe: true,
      text:
        role === 'farmer'
          ? 'รับทราบครับ เดี๋ยวช่วงบ่ายจะถ่ายรูปใบข้าวส่งให้ช่วยดูครับ'
          : 'รับทราบครับ เดี๋ยวเจอกันเวลา 09.00 น. ที่แปลงนะครับ',
      time: '09:32',
    },
  ]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: 'ฉัน',
        isMe: true,
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  const fs = (size) => (largeText ? size + 3 : size);

  // --- แท็บ 1: แชท / ปรึกษา ---
  if (activeTab === 'chat') {
    return (
      <View style={st.chatContainer}>
        <View style={st.chatHeader}>
          <Text style={[st.sectionTitle, { marginBottom: 0, fontSize: fs(14) }]}>
            💬 {role === 'farmer' ? 'ห้องปรึกษาเจ้าหน้าที่เกษตร' : 'ห้องแชทติดต่อเกษตรกร'}
          </Text>
          <Text style={{ fontSize: 11, color: '#2e7d32' }}>● ออนไลน์</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12, gap: 10 }}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[st.chatBubble, m.isMe ? st.chatMe : st.chatOther]}
            >
              {!m.isMe && <Text style={st.chatSender}>{m.sender}</Text>}
              <Text style={[st.chatText, m.isMe && { color: '#fff' }, { fontSize: fs(13) }]}>
                {m.text}
              </Text>
              <Text style={[st.chatTime, m.isMe && { color: '#e8f5e9' }]}>
                {m.time}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={st.chatInputRow}>
          <TextInput
            style={st.chatInput}
            placeholder="พิมพ์ข้อความที่นี่..."
            placeholderTextColor="#9ca3af"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSendChat}
          />
          <TouchableOpacity style={st.sendBtn} onPress={handleSendChat}>
            <Text style={st.sendBtnText}>ส่ง</Text>
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
  chatSender: { fontSize: 10, fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  chatText: { fontSize: 13, color: '#1f2937' },
  chatTime: { fontSize: 9, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 4 },
  chatInputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  chatInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, height: 40, fontSize: 13 },
  sendBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 18, borderRadius: 20, justifyContent: 'center' },
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
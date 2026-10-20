import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { s } from '../styles';

export default function OfficerScreen({ logs, allUsers, onClear, onLogout, onRefresh, onSaveLogForFarmer }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [auditTab, setAuditTab] = useState('gap');
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // States สำหรับ Modal ช่วยเติมข้อมูลให้เกษตรกร
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [officerNote, setOfficerNote] = useState('');
  const [officerMoisture, setOfficerMoisture] = useState('');
  const [targetFarmerForAdd, setTargetFarmerForAdd] = useState(null);

  // States สำหรับ GIS & GPS
  const [coords, setCoords] = useState('Lat: 15.118624, Long: 104.322015');
  const [gpsConnected, setGpsConnected] = useState(false);

  // States สำหรับ AI & Sensor
  const [aiScanned, setAiScanned] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [sensorData, setSensorData] = useState({ moisture: '--', temp: '--' });

  // GAP Checklist
  const [gapItems, setGapItems] = useState([
    { id: 1, title: '1. แหล่งน้ำสะอาด ไร้สารปนเปื้อน', checked: true },
    { id: 2, title: '2. พื้นที่ปลูกไม่มีประวัติสารพิษตกค้าง', checked: true },
    { id: 3, title: '3. วัตถุอันตรายจัดเก็บมิดชิด', checked: true },
    { id: 4, title: '4. จัดการคุณภาพก่อนการเก็บเกี่ยว', checked: true },
    { id: 5, title: '5. ภาชนะบรรจุและสถานที่พักสะอาด', checked: true },
  ]);
  const [lotId, setLotId] = useState('');

  const farmersList = allUsers ? allUsers.filter((u) => u.role === 'farmer') : [];

  // ตรวจสอบความครบถ้วนของข้อมูลเกษตรกร
  const checkFarmerCompleteness = (farmerId) => {
    const farmerLogs = logs ? logs.filter((l) => l.farmerId === farmerId) : [];
    const hasActivity = farmerLogs.some((l) => l.type === 'บันทึกรายวัน' || l.activity);
    const hasMoisture = farmerLogs.some((l) => l.type === 'วัดความชื้น' || l.moisture !== undefined);
    const hasPhoto = farmerLogs.some((l) => l.type === 'ถ่ายรูปแปลง' || l.photoUri);

    const isComplete = hasActivity && hasMoisture;
    return {
      isComplete,
      hasActivity,
      hasMoisture,
      hasPhoto,
      count: farmerLogs.length,
    };
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setCurrentPage('audit');
    setAuditTab('gap');
  };

  const handleOpenAddLog = (farmer) => {
    setTargetFarmerForAdd(farmer);
    setOfficerNote('');
    setOfficerMoisture('');
    setShowAddLogModal(true);
  };

  const handleSaveOfficerEntry = () => {
    if (!officerNote.trim() && !officerMoisture.trim()) {
      Alert.alert('กรอกข้อมูล', 'กรุณาระบุรายละเอียดหรือค่าความชื้นที่ต้องการเติม');
      return;
    }

    if (onSaveLogForFarmer && targetFarmerForAdd) {
      const summaryText = officerMoisture
        ? `เจ้าหน้าที่เติมข้อมูล: ${officerNote || 'บันทึกเพิ่มเติม'} (ความชื้น ${officerMoisture}%)`
        : `เจ้าหน้าที่เติมข้อมูล: ${officerNote}`;

      onSaveLogForFarmer(targetFarmerForAdd.id, targetFarmerForAdd.name, 'เจ้าหน้าที่ลงบันทึกแทน', {
        summary: summaryText,
        moisture: officerMoisture ? parseFloat(officerMoisture) : undefined,
        byOfficer: true,
      });

      Alert.alert('เพิ่มข้อมูลสำเร็จ ✅', `บันทึกข้อมูลเพิ่มเติมให้ คุณ${targetFarmerForAdd.name} เรียบร้อยแล้ว`);
      setShowAddLogModal(false);
    } else {
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลลงระบบเรียบร้อยแล้ว');
      setShowAddLogModal(false);
    }
  };

  const toggleGap = (id) => {
    setGapItems(gapItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleCaptureGIS = () => {
    setGpsConnected(true);
    Alert.alert('ดึงพิกัดสำเร็จ 📍', 'GPS High-Precision (±1.5m)');
  };

  const handleConnectBluetooth = () => {
    setBtConnected(true);
    setSensorData({ moisture: '68.5', temp: '28.4' });
    Alert.alert('เชื่อมต่อสำเร็จ 📡', 'BT-SENSOR-09 อ่านค่าเรียบร้อย');
  };

  const handleSubmitAudit = () => {
    const generatedLot = 'PKM-20261008-089-A' + Math.floor(Math.random() * 9 + 1);
    setLotId(generatedLot);
    Alert.alert('อนุมัติสำเร็จ ✅', `รหัสล็อตสินค้า: ${generatedLot}`);
  };

  return (
    <SafeAreaView style={o.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#72c07b" />

      <View style={o.mainLayout}>
        {/* Header สรุปข้อมูลเจ้าหน้าที่ ด้านบน */}
        <View style={o.headerCard}>
          <View style={o.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={o.onlineDot} />
              <Text style={o.headerSubtitle}>FIELD OFFICER SUITE v4.0</Text>
            </View>
            <TouchableOpacity onPress={onLogout}>
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' }}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>

          <Text style={o.profileName}>นายสมชาย ใจดี <Text style={o.profileSub}>(OFF-2026-0089)</Text></Text>
          <Text style={o.profileRole}>ตำแหน่ง: Senior GAP Auditor (Level 2)</Text>
        </View>

        {/* ======================================================== */}
        {/* หน้าที่ 1: Dashboard ภาพรวม & แผนที่ GPS & คิวเกษตรกร */}
        {/* ======================================================== */}
        {currentPage === 'home' ? (
          <ScrollView contentContainerStyle={o.container} showsVerticalScrollIndicator={false}>
            
            {/* Dashboard KPI & แผนที่ GPS Interactive */}
            <View style={o.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={o.sectionTitle}>📊 Dashboard & แผนที่ GPS พิกัดแปลงตรวจ</Text>
                <TouchableOpacity onPress={onRefresh} style={o.refreshBtn}>
                  <Text style={{ color: '#2e7d32', fontSize: 11, fontWeight: 'bold' }}>🔄 ซิงก์ข้อมูล</Text>
                </TouchableOpacity>
              </View>

              <View style={o.kpiGrid}>
                <View style={o.kpiCard}>
                  <Text style={o.kpiLabel}>เกษตรกรในระบบ</Text>
                  <Text style={o.kpiNum}>{farmersList.length} <Text style={o.kpiUnit}>คน</Text></Text>
                </View>
                <View style={o.kpiCard}>
                  <Text style={o.kpiLabel}>บันทึกกิจกรรมรวม</Text>
                  <Text style={[o.kpiNum, { color: '#2e7d32' }]}>{logs ? logs.length : 0} <Text style={o.kpiUnit}>รายการ</Text></Text>
                </View>
              </View>

              {/* แผนที่จำลองพิกัด GPS แปลงเกษตรกร */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1b5e20', marginTop: 12, marginBottom: 6 }}>
                🗺️ พิกัดแปลงเกษตรกรในพื้นที่ ต.ผักไหม:
              </Text>
              <View style={o.mapSimContainer}>
                <TouchableOpacity
                  style={[o.mapPin, { top: '20%', left: '15%', backgroundColor: '#2e7d32' }]}
                  onPress={() => Alert.alert('แปลงไร่สุขใจ (นายสมศักดิ์)', 'พิกัด: Lat 15.1186, Long 104.3220\nสถานะ: ข้อมูลครบถ้วน (พร้อมออก QR)')}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>📍 แปลงไร่สุขใจ (Lat: 15.1186)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[o.mapPin, { bottom: '25%', right: '15%', backgroundColor: '#d97706' }]}
                  onPress={() => Alert.alert('แปลงป้าสมศรี (นางสมศรี)', 'พิกัด: Lat 15.1205, Long 104.3255\nสถานะ: ข้อมูลยังไม่ครบ (รอวัดความชื้น)')}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>📍 แปลงป้าสมศรี (Lat: 15.1205)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ตรวจเช็กความครบถ้วนของข้อมูลเกษตรกรทุกคน */}
            <View style={o.sectionCard}>
              <View style={o.cardHeader}>
                <Text style={o.sectionTitle}>👨‍🌾 รายชื่อเกษตรกร & ความครบถ้วนของข้อมูล</Text>
                <Text style={o.badge}>{farmersList.length} รายการ</Text>
              </View>

              {farmersList.map((farmer) => {
                const check = checkFarmerCompleteness(farmer.id);
                const farmerLogs = logs ? logs.filter((l) => l.farmerId === farmer.id) : [];
                const lastLog = farmerLogs.length > 0 ? farmerLogs[0] : null;

                return (
                  <View key={farmer.id} style={o.queueItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={o.queueCode}>ID: {farmer.id}</Text>
                      <Text style={{ color: check.isComplete ? '#2e7d32' : '#d97706', fontSize: 11, fontWeight: 'bold' }}>
                        {check.isComplete ? '✅ ข้อมูลครบถ้วน' : '⚠️ ข้อมูลยังไม่ครบ'}
                      </Text>
                    </View>

                    <Text style={o.queueName}>คุณ{farmer.name}</Text>
                    <Text style={o.queueDesc}>เบอร์โทรศัพท์: {farmer.login}</Text>

                    {/* สรุปสถานะความครบถ้วนของหัวข้อ */}
                    <View style={o.checkStatusGroup}>
                      <Text style={[o.checkBadge, { backgroundColor: check.hasActivity ? '#e8f5e9' : '#fee2e2', color: check.hasActivity ? '#2e7d32' : '#b91c1c' }]}>
                        {check.hasActivity ? '✓ บันทึกกิจกรรม' : '✗ ขาดบันทึกกิจกรรม'}
                      </Text>
                      <Text style={[o.checkBadge, { backgroundColor: check.hasMoisture ? '#e8f5e9' : '#fee2e2', color: check.hasMoisture ? '#2e7d32' : '#b91c1c' }]}>
                        {check.hasMoisture ? '✓ วัดความชื้น' : '✗ ขาดวัดความชื้น'}
                      </Text>
                    </View>

                    {lastLog && (
                      <View style={o.lastLogBox}>
                        <Text style={o.lastLogTitle}>📝 บันทึกล่าสุด:</Text>
                        <Text style={o.lastLogText}>
                          {lastLog.summary ? lastLog.summary : lastLog.type}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        style={[o.actionBtn, { flex: 1, backgroundColor: '#0284c7' }]}
                        onPress={() => handleOpenAddLog(farmer)}
                      >
                        <Text style={o.actionBtnText}>➕ เติมข้อมูลให้เกษตรกร</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[o.actionBtn, { flex: 1, backgroundColor: '#2e7d32' }]}
                        onPress={() => handleSelectFarmer(farmer)}
                      >
                        <Text style={o.actionBtnText}>ตรวจประเมิน ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity onPress={onClear} style={{ marginTop: 10 }}>
              <Text style={s.clear}>🗑 ล้างข้อมูลบันทึกทั้งหมด</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* ======================================================== */
          /* หน้าที่ 2: หน้าลงตรวจแปลงของเกษตรกรที่เลือก */
          /* ======================================================== */
          <View style={{ flex: 1 }}>
            <View style={o.subHeader}>
              <TouchableOpacity onPress={() => setCurrentPage('home')} style={o.backBtn}>
                <Text style={o.backBtnText}>❮ กลับหน้าหลัก</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>ตรวจแปลง: คุณ{selectedFarmer?.name}</Text>
                <Text style={{ color: '#e8f5e9', fontSize: 10 }}>รหัสเกษตรกร: {selectedFarmer?.id}</Text>
              </View>
            </View>

            <View style={o.auditTabNav}>
              <TouchableOpacity style={[o.tabItem, auditTab === 'gap' && o.tabItemActive]} onPress={() => setAuditTab('gap')}>
                <Text style={[o.tabText, auditTab === 'gap' && o.tabTextActive]}>📋 GAP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[o.tabItem, auditTab === 'gis' && o.tabItemActive]} onPress={() => setAuditTab('gis')}>
                <Text style={[o.tabText, auditTab === 'gis' && o.tabTextActive]}>🗺️ GIS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[o.tabItem, auditTab === 'ai' && o.tabItemActive]} onPress={() => setAuditTab('ai')}>
                <Text style={[o.tabText, auditTab === 'ai' && o.tabTextActive]}>🔬 AI สแกน</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[o.tabItem, auditTab === 'sensor' && o.tabItemActive]} onPress={() => setAuditTab('sensor')}>
                <Text style={[o.tabText, auditTab === 'sensor' && o.tabTextActive]}>📡 IoT</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={o.container} showsVerticalScrollIndicator={false}>
              {auditTab === 'gap' && (
                <View style={o.sectionCard}>
                  <Text style={o.sectionTitle}>📋 ประเมินมาตรฐาน GAP - คุณ{selectedFarmer?.name}</Text>

                  {gapItems.map((item) => (
                    <View key={item.id} style={o.checkRow}>
                      <Switch value={item.checked} onValueChange={() => toggleGap(item.id)} trackColor={{ true: '#4caf50' }} />
                      <Text style={{ fontSize: 12, color: '#333', flex: 1, marginLeft: 8 }}>{item.title}</Text>
                    </View>
                  ))}

                  <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#2e7d32', marginTop: 14 }]} onPress={handleSubmitAudit}>
                    <Text style={s.bigBtnText}>อนุมัติปล่อยล็อตสินค้า & ออก QR ➔</Text>
                  </TouchableOpacity>

                  {lotId !== '' && (
                    <View style={o.qrBox}>
                      <Text style={{ fontWeight: 'bold', color: '#1b5e20', marginBottom: 6 }}>
                        ✅ อนุมัติสำเร็จ! Lot ID: {lotId}
                      </Text>
                      <Image
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://ผักไหม.com/trace/${lotId}` }}
                        style={{ width: 120, height: 120, borderRadius: 8 }}
                      />
                    </View>
                  )}
                </View>
              )}

              {auditTab === 'gis' && (
                <View style={o.sectionCard}>
                  <Text style={o.sectionTitle}>🗺️ ปักหมุด GIS & GPS Polygon</Text>
                  <View style={o.darkBox}>
                    <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 8 }}>{coords}</Text>
                    <TouchableOpacity style={o.greenBtn} onPress={handleCaptureGIS}>
                      <Text style={o.greenBtnText}>📍 ดึงพิกัดและสร้าง Polygon ขอบเขตแปลง</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {auditTab === 'ai' && (
                <View style={o.sectionCard}>
                  <Text style={o.sectionTitle}>🔬 สแกนโรคพืช AI Scanner</Text>
                  <View style={o.scannerBox}>
                    <Text style={{ fontSize: 36, marginBottom: 6 }}>📷</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1b5e20' }}>ถ่ายภาพใบหรือลำต้นผักไหม</Text>
                    <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#388e3c', marginTop: 12 }]} onPress={() => setAiScanned(true)}>
                      <Text style={s.bigBtnText}>เริ่มวิเคราะห์ด้วย AI</Text>
                    </TouchableOpacity>
                  </View>

                  {aiScanned && (
                    <View style={o.aiResultBox}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>✅ ผลการวิเคราะห์ AI (Accuracy 98.4%):</Text>
                      <Text style={{ fontSize: 12, color: '#1f2937', marginTop: 2 }}>ไม่พบโรคพืชรุนแรง / สภาพลำต้นสมบูรณ์</Text>
                    </View>
                  )}
                </View>
              )}

              {auditTab === 'sensor' && (
                <View style={o.sectionCard}>
                  <Text style={o.sectionTitle}>📡 IoT Soil & Environment Reader</Text>
                  <View style={o.darkBox}>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>ความชื้นดิน</Text>
                        <Text style={{ color: '#81c784', fontSize: 20, fontWeight: 'bold' }}>{sensorData.moisture} %</Text>
                      </View>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>อุณหภูมิ</Text>
                        <Text style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold' }}>{sensorData.temp} °C</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[o.greenBtn, { backgroundColor: '#0284c7' }]} onPress={handleConnectBluetooth}>
                      <Text style={o.greenBtnText}>เชื่อมต่อเซนเซอร์</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* MODAL: เจ้าหน้าที่ช่วยบันทึกข้อมูลเพิ่มเติมให้เกษตรกร */}
        <Modal visible={showAddLogModal} animationType="fade" transparent>
          <View style={o.modalOverlay}>
            <View style={o.modalCard}>
              <Text style={o.modalTitle}>➕ เพิ่มข้อมูลให้ คุณ{targetFarmerForAdd?.name}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                เจ้าหน้าที่สามารถช่วยเติมบันทึกกิจกรรมหรือค่าความชื้นแทนเกษตรกรได้
              </Text>

              <Text style={s.label}>บันทึกรายละเอียดกิจกรรม</Text>
              <TextInput
                style={[s.input, o.customInput]}
                placeholder="เช่น ใส่ปุ๋ยอินทรีย์ 2 กระสอบ"
                value={officerNote}
                onChangeText={setOfficerNote}
              />

              <Text style={s.label}>ค่าความชื้นที่วัดได้ (%) [ถ้ามี]</Text>
              <TextInput
                style={[s.input, o.customInput]}
                placeholder="เช่น 14.5"
                keyboardType="numeric"
                value={officerMoisture}
                onChangeText={setOfficerMoisture}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[s.bigBtn, { flex: 1, backgroundColor: '#9ca3af' }]}
                  onPress={() => setShowAddLogModal(false)}
                >
                  <Text style={s.bigBtnText}>ยกเลิก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.bigBtn, { flex: 1, backgroundColor: '#2e7d32' }]}
                  onPress={handleSaveOfficerEntry}
                >
                  <Text style={s.bigBtnText}>บันทึกข้อมูล</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const o = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  mainLayout: { flex: 1, backgroundColor: '#f1f8e9' },

  headerCard: {
    backgroundColor: '#72c07b',
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' },
  headerSubtitle: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  profileName: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  profileSub: { fontSize: 11, color: '#e8f5e9', fontWeight: 'normal' },
  profileRole: { color: '#f1f8e9', fontSize: 11, marginTop: 2 },

  refreshBtn: { backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  subHeader: { backgroundColor: '#388e3c', flexDirection: 'row', alignItems: 'center', padding: 10 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },

  auditTabNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 3, borderBottomColor: '#2e7d32' },
  tabText: { fontSize: 12, color: '#616161', fontWeight: '600' },
  tabTextActive: { color: '#2e7d32', fontWeight: 'bold' },

  container: { padding: 12, paddingBottom: 30, gap: 10 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, elevation: 1 },
  sectionTitle: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },

  kpiGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  kpiCard: { flex: 1, backgroundColor: '#f9fbe7', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#dce775' },
  kpiLabel: { color: '#616161', fontSize: 10, fontWeight: 'bold' },
  kpiNum: { color: '#1b5e20', fontSize: 18, fontWeight: '900', marginTop: 2 },
  kpiUnit: { fontSize: 10, fontWeight: 'normal', color: '#616161' },

  mapSimContainer: { height: 120, backgroundColor: '#1b5e20', borderRadius: 10, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  mapPin: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  queueItem: { backgroundColor: '#ffffff', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#c8e6c9' },
  queueCode: { fontSize: 10, fontWeight: 'bold', color: '#757575' },
  queueName: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32', marginTop: 2 },
  queueDesc: { fontSize: 11, color: '#616161', marginTop: 1 },

  checkStatusGroup: { flexDirection: 'row', gap: 6, marginTop: 6 },
  checkBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  lastLogBox: { backgroundColor: '#f1f8e9', padding: 8, borderRadius: 6, marginTop: 6 },
  lastLogTitle: { fontSize: 10, fontWeight: 'bold', color: '#2e7d32' },
  lastLogText: { fontSize: 11, color: '#333', marginTop: 2 },

  actionBtn: { borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },

  darkBox: { backgroundColor: '#1b5e20', borderRadius: 10, padding: 12 },
  greenBtn: { backgroundColor: '#4caf50', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  greenBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  scannerBox: { backgroundColor: '#f1f8e9', borderWidth: 2, borderStyle: 'dashed', borderColor: '#a5d6a7', borderRadius: 12, padding: 16, alignItems: 'center' },
  aiResultBox: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 8, padding: 10, marginTop: 8 },
  sensorMetric: { flex: 1, backgroundColor: '#2e7d32', padding: 8, borderRadius: 8, alignItems: 'center' },

  checkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f8e9', padding: 6, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#c8e6c9' },
  qrBox: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#a5d6a7' },

  customInput: {
    borderColor: '#a5d6a7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fafafa',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 5 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#2e7d32' },
});
import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { USERS } from '../data/users';
import * as ImagePicker from 'expo-image-picker';
import DailyLogScreen from './DailyLogScreen';

let MapContainer, TileLayer, MarkerWeb, PolygonWeb, useMapEvents;
if (Platform.OS === 'web') {
  const ReactLeaflet = require('react-leaflet');
  MapContainer = ReactLeaflet.MapContainer;
  TileLayer = ReactLeaflet.TileLayer;
  MarkerWeb = ReactLeaflet.Marker;
  PolygonWeb = ReactLeaflet.Polygon;
  useMapEvents = ReactLeaflet.useMapEvents;
}

let MapView, Polygon, Marker;
if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Polygon = RNMaps.Polygon;
  Marker = RNMaps.Marker;
}

export default function OfficerScreen({ logs, allUsers, onClear, onLogout, onRefresh, onSaveLogForFarmer, onUpdateLog, onDeleteLog, onDeleteActivityField }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [auditTab, setAuditTab] = useState('gap');
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const [targetFarmerForAdd, setTargetFarmerForAdd] = useState(null);
  const [editingLogData, setEditingLogData] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  // States สำหรับ GIS & GPS
  const [coords, setCoords] = useState('Lat: 15.118624, Long: 104.322015');
  const [gpsConnected, setGpsConnected] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setPolygonPoints((currentPoints) => [...currentPoints, coordinate]);
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
  };

  // States สำหรับ AI & Sensor
  const [aiHistory, setAiHistory] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [sensorData, setSensorData] = useState({ moisture: '--', temp: '--', sunlight: '--', rain: '--' });

  // GAP Checklist
  const [gapItems, setGapItems] = useState([
    { id: 1, title: '1. แหล่งน้ำสะอาด ไร้สารปนเปื้อน', checked: true },
    { id: 2, title: '2. พื้นที่ปลูกไม่มีประวัติสารพิษตกค้าง', checked: true },
    { id: 3, title: '3. วัตถุอันตรายจัดเก็บมิดชิด', checked: true },
    { id: 4, title: '4. จัดการคุณภาพก่อนการเก็บเกี่ยว', checked: true },
    { id: 5, title: '5. ภาชนะบรรจุและสถานที่พักสะอาด', checked: true },
  ]);
  const [lotId, setLotId] = useState('');

  // 🟢 ฟังก์ชันส่งออกรายงานบันทึกกิจกรรมเกษตรกรทุกคนเป็น PDF
  const handleExportPDF = () => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      const farmers = (allUsers && allUsers.length > 0 ? allUsers : USERS).filter(u => u.role === 'farmer');

      let htmlContent = `
        <html>
          <head>
            <title>รายงานการบันทึกกิจกรรมเกษตรกร - ต.ผักไหม</title>
            <style>
              body { font-family: 'Sarabun', Tahoma, sans-serif; padding: 20px; color: #333; }
              h1 { color: #1b5e20; text-align: center; margin-bottom: 5px; }
              p.sub { text-align: center; color: #666; font-size: 14px; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
              th { background-color: #2e7d32; color: white; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .header-info { margin-bottom: 20px; padding: 10px; background: #e8f5e9; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>🌾 รายงานการบันทึกกิจกรรมประจำวันของเกษตรกร</h1>
            <p class="sub">กลุ่มวิสาหกิจชุมชน ต.ผักไหม | ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}</p>
            
            <div class="header-info">
              <strong>ผู้ออกรายงาน:</strong> เจ้าหน้าที่สมศรี (OFF-2026-0089)<br/>
              <strong>จำนวนเกษตรกรทั้งหมด:</strong> ${farmers.length} ราย | <strong>จำนวนบันทึกกิจกรรมรวม:</strong> ${logs ? logs.length : 0} รายการ
            </div>

            <table>
              <thead>
                <tr>
                  <th>วันที่/เวลา</th>
                  <th>รหัส/ชื่อเกษตรกร</th>
                  <th>ประเภทบันทึก</th>
                  <th>แปลง</th>
                  <th>กิจกรรม</th>
                  <th>ปัจจัยที่ใช้/หมายเหตุ</th>
                  <th>ความชื้น (%)</th>
                </tr>
              </thead>
              <tbody>
                ${logs && logs.length > 0 ? logs.map(l => {
                  const farmer = farmers.find(f => f.id === l.farmerId);
                  return `
                    <tr>
                      <td>${new Date(l.time).toLocaleString('th-TH')}</td>
                      <td>${l.farmerId} - คุณ${farmer ? farmer.name : 'ไม่ระบุ'}</td>
                      <td>${l.type || '-'}</td>
                      <td>${l.plot || '-'}</td>
                      <td>${l.activity || '-'}</td>
                      <td>${l.activityNote || l.input?.type || l.summary || '-'}</td>
                      <td>${l.moisture !== undefined ? l.moisture + '%' : '-'}</td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="7" style="text-align:center;">ไม่มีข้อมูลการบันทึก</td></tr>'}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      Alert.alert('ส่งออก PDF 📄', 'ระบบกำลังจัดทำไฟล์ PDF สำหรับอุปกรณ์เคลื่อนที่...');
    }
  };

  const renderReportRow = (label, value, onRemoveField = null) => {
    const hasValue = value && value !== '';
    return (
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: 'bold' }}>{label}</Text>
        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 12, marginRight: 6 }}>{hasValue ? '✅' : '❌'}</Text>
            <Text style={{ 
              fontSize: 12, 
              color: hasValue ? '#1e293b' : '#94a3b8', 
              textDecorationLine: hasValue ? 'none' : 'line-through' 
            }}>
              {hasValue ? value : 'ไม่ได้ระบุข้อมูล'}
            </Text>
          </View>

          {/* 🟢 ปุ่มเลือกลบเฉพาะกิจกรรมย่อย */}
          {hasValue && onRemoveField && (
            <TouchableOpacity 
              onPress={onRemoveField}
              style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 }}
            >
              <Text style={{ fontSize: 10, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ ลบกิจกรรมนี้</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const farmersList = (allUsers && allUsers.length > 0 ? allUsers : USERS).filter((u) => u.role === 'farmer');

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const checkFarmerCompleteness = (farmerId) => {
    const farmerLogs = logs ? logs.filter((l) => l.farmerId === farmerId) : [];
    
    const hasActivity = farmerLogs.some((l) => l.category === 'ACTIVITY' || l.type === 'บันทึกรายวัน' || l.type === 'บันทึกกิจกรรมประจำวัน' || l.activity || l.water || l.fertilizer);
    const hasMoisture = farmerLogs.some((l) => l.category === 'SENSOR' || l.type === 'วัดความชื้น' || l.moisture !== undefined);
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
    setEditingLogData(null);
    setCurrentPage('officer_form');
  };

  const handleOpenEditLog = (logItem) => {
    const logOwner = farmersList.find(f => f.id === logItem.farmerId) || { id: logItem.farmerId, name: logItem.farmerId };
    setTargetFarmerForAdd(logOwner);
    setEditingLogData(logItem);
    setShowReportModal(false);
    setShowManageModal(false);
    setCurrentPage('officer_form');
  };

  const confirmDeleteLog = (logId) => {
    const doDelete = () => {
      if (onDeleteLog) onDeleteLog(logId);
      showAlert('ลบสำเร็จ 🗑️', 'ลบรายการบันทึกเรียบร้อยแล้ว');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('คุณต้องการลบบันทึกรายการนี้ใช่หรือไม่?')) doDelete();
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบบันทึกรายการนี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบทิ้ง', onPress: doDelete, style: 'destructive' }
      ]);
    }
  };

  const confirmDeleteActivityField = (logId, fieldKey, fieldName) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`คุณต้องการลบกิจกรรม "${fieldName}" หรือไม่?`)) {
        if (onDeleteActivityField) onDeleteActivityField(logId, fieldKey);
        setShowReportModal(false);
      }
    } else {
      Alert.alert('ยืนยันการลบกิจกรรม', `คุณต้องการลบกิจกรรม "${fieldName}" หรือไม่?`, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบกิจกรรม', onPress: () => { if (onDeleteActivityField) onDeleteActivityField(logId, fieldKey); setShowReportModal(false); }, style: 'destructive' }
      ]);
    }
  };

  const MapClickHandler = () => {
    if (Platform.OS === 'web') {
      useMapEvents({
        click(e) {
          handleMapPress({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
        },
      });
    }
    return null;
  };

  const toggleGap = (id) => {
    setGapItems(gapItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleCaptureGIS = () => {
    setGpsConnected(true);
    showAlert('ดึงพิกัดสำเร็จ 📍', 'GPS High-Precision (±1.5m)');
  };

  const handleConnectBluetooth = () => {
    setBtConnected(true);
    setSensorData({ moisture: '68.5', temp: '28.4', sunlight: '45000', rain: '15' });
    showAlert('เชื่อมต่อสำเร็จ 📡', 'BT-SENSOR-09 อ่านค่าเรียบร้อย');
  };

  const handleSubmitAudit = () => {
    const generatedLot = 'PKM-20261008-089-A' + Math.floor(Math.random() * 9 + 1);
    setLotId(generatedLot);
    showAlert('อนุมัติสำเร็จ ✅', `รหัสล็อตสินค้า: ${generatedLot}`);
  };

  const handleScanAI = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert('แจ้งเตือน', 'ต้องขออนุญาตเข้าถึงรูปภาพก่อนครับ');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (pickerResult.canceled) {
      return; 
    }

    const realImageUri = pickerResult.assets[0].uri;
    setAiLoading(true);

    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(realImageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'upload.jpg');
      } else {
        formData.append('file', {
          uri: realImageUri,
          name: 'upload.jpg',
          type: 'image/jpeg',
        });
      }

      const res = await fetch('https://576lb288-5000.asse.devtunnels.ms/predict', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      
      if (res.ok) {
        const now = new Date();
        const timeString = now.toLocaleString('th-TH');

        const newRecord = {
          id: Date.now().toString(),
          image: realImageUri,
          result: result,
          timestamp: timeString
        };

        setAiHistory((prevHistory) => {
          const currentFarmerId = selectedFarmer.id;
          const existingHistory = prevHistory[currentFarmerId] || [];
          return {
            ...prevHistory,
            [currentFarmerId]: [newRecord, ...existingHistory]
          };
        });
      } else {
        showAlert('แจ้งเตือนจากเซิร์ฟเวอร์', result.error || 'เกิดข้อผิดพลาดในการวิเคราะห์');
      }
    } catch (error) {
      console.error(error);
      showAlert('เชื่อมต่อไม่ได้', 'กรุณาตรวจสอบลิงก์ VS Code ว่าตั้งเป็น Public หรือยัง');
    } finally {
      setAiLoading(false);
    }
  };

  if (currentPage === 'officer_form') {
    return (
      <DailyLogScreen
        isOfficer={true}
        targetFarmer={targetFarmerForAdd}
        initialData={editingLogData}
        onSave={(type, data) => {
          if (editingLogData && onUpdateLog) {
            onUpdateLog(editingLogData.id, data);
            showAlert('อัปเดตสำเร็จ ✏️', `แก้ไขข้อมูลให้ คุณ${targetFarmerForAdd?.name || ''} เรียบร้อยแล้ว`);
          } else if (onSaveLogForFarmer && targetFarmerForAdd) {
            onSaveLogForFarmer(targetFarmerForAdd.id, targetFarmerForAdd.name, type, data);
            showAlert('บันทึกสำเร็จ ✅', `บันทึกข้อมูลให้ คุณ${targetFarmerForAdd.name} เรียบร้อยแล้ว`);
          }
          setEditingLogData(null);
          setCurrentPage('home');
        }}
        onClose={() => {
          setEditingLogData(null);
          setCurrentPage('home');
        }}
      />
    );
  }

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

          <Text style={o.profileName}>เจ้าหน้าที่สมศรี <Text style={o.profileSub}>(OFF-2026-0089)</Text></Text>
          <Text style={o.profileRole}>ตำแหน่ง: Senior GAP Auditor (Level 2)</Text>
        </View>

        {/* หน้าหลัก */}
        {currentPage === 'home' ? (
          <ScrollView contentContainerStyle={o.container} showsVerticalScrollIndicator={false}>
            
            {/* Dashboard KPI & ปุ่มส่งออก PDF */}
            <View style={o.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={o.sectionTitle}>📊 Dashboard & แผนที่ GPS พิกัดแปลงตรวจ</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {/* 🟢 ปุ่มส่งออกข้อมูล PDF */}
                  <TouchableOpacity onPress={handleExportPDF} style={[o.refreshBtn, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={{ color: '#0284c7', fontSize: 11, fontWeight: 'bold' }}>📄 ออก PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowManageModal(true)} style={[o.refreshBtn, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={{ color: '#334155', fontSize: 11, fontWeight: 'bold' }}>⚙️ จัดการข้อมูล</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onRefresh} style={o.refreshBtn}>
                    <Text style={{ color: '#2e7d32', fontSize: 11, fontWeight: 'bold' }}>🔄 ซิงก์ข้อมูล</Text>
                  </TouchableOpacity>
                </View>
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

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1b5e20', marginTop: 12, marginBottom: 6 }}>
                🗺️ พิกัดแปลงเกษตรกรในพื้นที่ ต.ผักไหม:
              </Text>
              <View style={o.mapSimContainer}>
                <TouchableOpacity
                  style={[o.mapPin, { top: '20%', left: '15%', backgroundColor: '#2e7d32' }]}
                  onPress={() => showAlert('แปลงลุงสมหมาย (f001)', 'พิกัด: Lat 15.1186, Long 104.3220\nสถานะ: ข้อมูลครบถ้วน')}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>📍 แปลงลุงสมหมาย (Lat: 15.1186)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[o.mapPin, { bottom: '25%', right: '15%', backgroundColor: '#d97706' }]}
                  onPress={() => showAlert('แปลงป้าสมศรี (f002)', 'พิกัด: Lat 15.1205, Long 104.3255\nสถานะ: รอวัดความชื้น')}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>📍 แปลงป้าสมศรี (Lat: 15.1205)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* รายชื่อเกษตรกร */}
            <View style={o.sectionCard}>
              <View style={o.cardHeader}>
                <Text style={o.sectionTitle}>👨‍🌾 รายชื่อเกษตรกร & ความครบถ้วนของข้อมูล</Text>
                <Text style={o.badge}>{farmersList.length} รายการ</Text>
              </View>

              {farmersList.map((farmer) => {
                const check = checkFarmerCompleteness(farmer.id);
                const farmerLogs = logs ? logs.filter((l) => l.farmerId === farmer.id) : [];
                
                // 🟢 ดึงรายการบันทึกสูงสุด 3 รายการล่าสุด
                const recentLogs = farmerLogs.slice(0, 3);

                return (
                  <View key={farmer.id} style={o.queueItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={o.queueCode}>ID: {farmer.id}</Text>
                      <Text style={{ color: check.isComplete ? '#2e7d32' : '#d97706', fontSize: 11, fontWeight: 'bold' }}>
                        {check.isComplete ? '✅ ข้อมูลครบถ้วน' : '⚠️ ข้อมูลยังไม่ครบ'}
                      </Text>
                    </View>

                    <Text style={o.queueName}>คุณ{farmer.name}</Text>
                    <Text style={o.queueDesc}>เบอร์โทรศัพท์: {farmer.login} | อายุ: {farmer.age} ปี (เกิด {farmer.dob})</Text>

                    <View style={o.checkStatusGroup}>
                      <Text style={[o.checkBadge, { backgroundColor: check.hasActivity ? '#e8f5e9' : '#fee2e2', color: check.hasActivity ? '#2e7d32' : '#b91c1c' }]}>
                        {check.hasActivity ? '✓ บันทึกกิจกรรม' : '✗ ขาดบันทึกกิจกรรม'}
                      </Text>
                      <Text style={[o.checkBadge, { backgroundColor: check.hasMoisture ? '#e8f5e9' : '#fee2e2', color: check.hasMoisture ? '#2e7d32' : '#b91c1c' }]}>
                        {check.hasMoisture ? '✓ วัดความชื้น' : '✗ ขาดวัดความชื้น'}
                      </Text>
                    </View>

                    {/* 🟢 ส่วนแสดงรายการบันทึกล่าสุด สูงสุด 3 รายการ */}
                    {recentLogs.length > 0 && (
                      <View style={{ marginTop: 8, gap: 6 }}>
                        {recentLogs.map((logItem, index) => (
                          <View key={logItem.id || index} style={[o.lastLogBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View style={{ flex: 1, paddingRight: 6 }}>
                              <Text style={o.lastLogTitle}>📝 บันทึกล่าสุด ({index + 1}):</Text>
                              <Text style={o.lastLogText}>
                                {logItem.summary || logItem.activity || (logItem.moisture !== undefined ? `วัดความชื้น (${logItem.moisture}%)` : logItem.type)}
                              </Text>
                            </View>
                            
                            <TouchableOpacity 
                              style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 8 }}
                              onPress={() => {
                                setSelectedLog({
                                  isCombinedView: false,
                                  farmerName: farmer.name,
                                  time: logItem.time,
                                  ...logItem,
                                  activityLog: logItem
                                });
                                setShowReportModal(true);
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>👁️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        style={[o.actionBtn, { flex: 1, backgroundColor: '#0284c7' }]}
                        onPress={() => handleOpenAddLog(farmer)}
                      >
                        <Text style={o.actionBtnText}>✏️ กรอกฟอร์มให้เกษตรกร</Text>
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
            
          </ScrollView>
        ) : (
          /* หน้าลงตรวจแปลง */
          <View style={{ flex: 1 }}>
            <View style={o.subHeader}>
              <TouchableOpacity onPress={() => setCurrentPage('home')} style={o.backBtn}>
                <Text style={o.backBtnText}>❮ กลับหน้าหลัก</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>ตรวจแปลง: คุณ{selectedFarmer?.name}</Text>
                <Text style={{ color: '#e8f5e9', fontSize: 10 }}>รหัสเกษตรกร: {selectedFarmer?.id} | เบอร์โทร: {selectedFarmer?.login}</Text>
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

                  <TouchableOpacity style={[o.bigBtn, { backgroundColor: '#2e7d32', marginTop: 14 }]} onPress={handleSubmitAudit}>
                    <Text style={o.bigBtnText}>อนุมัติปล่อยล็อตสินค้า & ออก QR ➔</Text>
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
                <View style={{ marginTop: 15, paddingHorizontal: 15 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#2e7d32' }}>
                    🗺️ ปักหมุด GIS & GPS Polygon
                  </Text>
                  
                  <View style={{ height: 400, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' }}>
                    {Platform.OS === 'web' ? (
                      <div style={{ height: '100%', width: '100%' }}>
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <MapContainer center={[15.118624, 104.322015]} zoom={16} style={{ height: '100%', width: '100%' }}>
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <MapClickHandler />
                          
                          {polygonPoints.map((point, index) => (
                            <MarkerWeb key={index} position={[point.latitude, point.longitude]} />
                          ))}

                          {polygonPoints.length >= 3 && (
                            <PolygonWeb
                              positions={polygonPoints.map(p => [p.latitude, p.longitude])}
                              pathOptions={{ fillColor: 'rgba(46, 125, 50, 0.4)', color: '#2e7d32', weight: 3 }}
                            />
                          )}
                        </MapContainer>
                      </div>
                    ) : (
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                          latitude: 15.118624,
                          longitude: 104.322015,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        mapType="satellite"
                        onPress={handleMapPress}
                      >
                        {polygonPoints.map((point, index) => (
                          <Marker key={index} coordinate={point} pinColor="red" />
                        ))}

                        {polygonPoints.length >= 3 && (
                          <Polygon
                            coordinates={polygonPoints}
                            fillColor="rgba(46, 125, 50, 0.4)"
                            strokeColor="#2e7d32"
                            strokeWidth={3}
                          />
                        )}
                      </MapView>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 20 }}>
                    <TouchableOpacity 
                      onPress={clearPolygon}
                      style={{ padding: 12, backgroundColor: '#f44336', borderRadius: 8, flex: 1, marginRight: 5, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>ลบวาดใหม่</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => alert(`บันทึกพิกัดทั้งหมด ${polygonPoints.length} จุดสำเร็จ!`)}
                      style={{ padding: 12, backgroundColor: '#2e7d32', borderRadius: 8, flex: 1, marginLeft: 5, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>บันทึกพื้นที่แปลง</Text>
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
                    
                    <TouchableOpacity 
                      style={[o.bigBtn, { backgroundColor: '#388e3c', marginTop: 12, opacity: aiLoading ? 0.7 : 1 }]} 
                      onPress={handleScanAI}
                      disabled={aiLoading}
                    >
                      <Text style={o.bigBtnText}>{aiLoading ? 'กำลังวิเคราะห์ด้วย AI...' : 'เริ่มวิเคราะห์ด้วย AI'}</Text>
                    </TouchableOpacity>
                  </View>

                  {(aiHistory[selectedFarmer?.id] || []).map((item) => (
                    <View key={item.id} style={[o.aiResultBox, { marginTop: 15 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10 }} />
                        <View>
                          <Text style={{ fontSize: 11, color: '#666' }}>🕒 เวลาที่สแกน:</Text>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>{item.timestamp}</Text>
                        </View>
                      </View>

                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>
                        ✅ ผลการวิเคราะห์ AI (ความมั่นใจ {item.result.accuracy}):
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b91c1c', marginTop: 6 }}>
                        ตรวจพบ: {item.result.disease}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#1f2937', marginTop: 4 }}>
                        คำแนะนำ: {item.result.advice}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {auditTab === 'sensor' && (
                <View style={o.sectionCard}>
                  <Text style={o.sectionTitle}>📡 IoT Soil & Environment Reader</Text>
                  <View style={o.darkBox}>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>ความชื้นดิน</Text>
                        <Text style={{ color: '#81c784', fontSize: 20, fontWeight: 'bold' }}>{sensorData.moisture} %</Text>
                      </View>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>อุณหภูมิ</Text>
                        <Text style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold' }}>{sensorData.temp} °C</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>แสงแดด</Text>
                        <Text style={{ color: '#60a5fa', fontSize: 20, fontWeight: 'bold' }}>{sensorData.sunlight} lux</Text>
                      </View>
                      <View style={o.sensorMetric}>
                        <Text style={{ color: '#c8e6c9', fontSize: 11 }}>ปริมาณน้ำฝน</Text>
                        <Text style={{ color: '#a78bfa', fontSize: 20, fontWeight: 'bold' }}>{sensorData.rain} mm</Text>
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

        {/* MODAL: ศูนย์จัดการข้อมูล */}
        <Modal visible={showManageModal} animationType="slide" transparent>
          <View style={o.modalOverlay}>
            <View style={[o.modalCard, { maxHeight: '80%', padding: 0, overflow: 'hidden' }]}>
              <View style={{ backgroundColor: '#f1f5f9', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <Text style={[o.modalTitle, { fontSize: 14, color: '#334155' }]}>⚙️ จัดการข้อมูล (เลือกลบหรือแก้ไขประจำวัน)</Text>
              </View>
              
              <ScrollView style={{ padding: 10 }}>
                {logs && logs.length > 0 ? logs.map(log => {
                  const logOwner = farmersList.find(u => u.id === log.farmerId);
                  const ownerName = logOwner ? logOwner.name : log.farmerId;
                  return (
                    <View key={log.id} style={{ backgroundColor: '#ffffff', padding: 12, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#0f172a' }} numberOfLines={1}>
                          คุณ{ownerName} (ID: {log.farmerId})
                        </Text>
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }} numberOfLines={1}>ประเภท: {log.type} {log.activity ? `(${log.activity})` : ''}</Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>เวลา: {new Date(log.time).toLocaleString('th-TH')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity 
                          style={{ backgroundColor: '#e0f2fe', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }}
                          onPress={() => handleOpenEditLog(log)}
                        >
                          <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: 'bold' }}>✏️ แก้ไข</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ backgroundColor: '#fee2e2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }}
                          onPress={() => confirmDeleteLog(log.id)}
                        >
                          <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ ลบทั้งหมด</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }) : (
                  <Text style={{ textAlign: 'center', marginVertical: 20, color: '#94a3b8' }}>ยังไม่มีประวัติการบันทึกข้อมูล</Text>
                )}
              </ScrollView>

              <TouchableOpacity style={{ backgroundColor: '#0f172a', padding: 15, alignItems: 'center' }} onPress={() => setShowManageModal(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL: ดูรายละเอียดและเลือกลบกิจกรรมย่อย */}
        <Modal visible={showReportModal} animationType="fade" transparent>
          <View style={o.modalOverlay}>
            <View style={[o.modalCard, { maxHeight: '85%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[o.modalTitle, { fontSize: 16 }]}>📄 รายรายละเอียดบันทึกกิจกรรม</Text>
                
                {selectedLog?.activityLog && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#e0f2fe', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}
                      onPress={() => handleOpenEditLog(selectedLog.activityLog)}
                    >
                      <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: 'bold' }}>✏️ แก้ไข</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#fee2e2', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}
                      onPress={() => {
                        setShowReportModal(false);
                        confirmDeleteLog(selectedLog.activityLog.id);
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ ลบทั้งหมด</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <ScrollView style={{ marginTop: 4, width: '100%' }} showsVerticalScrollIndicator={false}>
                {selectedLog && (
                  <View style={{ backgroundColor: '#fafafa', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    
                    {selectedLog.isCombinedView ? (
                      <>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 }}>
                          👤 เกษตรกร: คุณ{selectedLog.farmerName}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                          🕒 เวลาอัปเดตล่าสุด: {new Date(selectedLog.time).toLocaleString('th-TH')}
                        </Text>

                        {selectedLog.activityLog ? (
                          <>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 6, backgroundColor: '#e8f5e9', padding: 4 }}>ข้อมูลกิจกรรม</Text>
                            {renderReportRow('วันที่ปฏิบัติงาน', selectedLog.activityLog.date, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'date', 'วันที่ปฏิบัติงาน'))}
                            {renderReportRow('แปลงที่ทำ', selectedLog.activityLog.plot, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'plot', 'แปลงที่ทำ'))}
                            {renderReportRow('กิจกรรมหลัก', selectedLog.activityLog.activity, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'activity', 'กิจกรรมหลัก'))}
                            {renderReportRow('รายละเอียดกิจกรรม', selectedLog.activityLog.activityNote, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'activityNote', 'รายละเอียดกิจกรรม'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 10, backgroundColor: '#e8f5e9', padding: 4 }}>ปัจจัยที่ใช้ & แหล่งน้ำ</Text>
                            {renderReportRow('ปุ๋ย/ปัจจัยที่ใช้', selectedLog.activityLog.input?.type ? `${selectedLog.activityLog.input.type} (${selectedLog.activityLog.input.quantity})` : null, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'input', 'ปุ๋ย/ปัจจัยที่ใช้'))}
                            {renderReportRow('น้ำหมัก/สารทำเอง', selectedLog.activityLog.selfMade?.formula, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'selfMade', 'น้ำหมัก/สารทำเอง'))}
                            {renderReportRow('แหล่งน้ำ', selectedLog.activityLog.water?.source, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'water', 'แหล่งน้ำ'))}
                            
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 10, backgroundColor: '#e8f5e9', padding: 4 }}>แรงงาน</Text>
                            {renderReportRow('ประเภทแรงงาน', selectedLog.activityLog.worker, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'worker', 'ประเภทแรงงาน'))}
                          </>
                        ) : (
                          <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>ยังไม่มีบันทึกกิจกรรมประจำวัน</Text>
                        )}

                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0284c7', marginTop: 12, backgroundColor: '#e0f2fe', padding: 4 }}>ข้อมูลความชื้น (IoT / Manual)</Text>
                        {selectedLog.moistureLog ? (
                          renderReportRow('ค่าความชื้นที่วัดได้', `${selectedLog.moistureLog.moisture} %`, () => confirmDeleteActivityField(selectedLog.moistureLog.id, 'moisture', 'ค่าความชื้น'))
                        ) : selectedLog.activityLog && selectedLog.activityLog.moisture !== undefined ? (
                          renderReportRow('ค่าความชื้นที่ระบุ', `${selectedLog.activityLog.moisture} %`, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'moisture', 'ค่าความชื้น'))
                        ) : (
                          renderReportRow('ค่าความชื้นที่วัดได้', null)
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
                          📌 ประเภท: {selectedLog.type}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                          🕒 เวลาที่บันทึก: {new Date(selectedLog.time).toLocaleString('th-TH')}
                        </Text>

                        {selectedLog.type === 'บันทึกกิจกรรมประจำวัน' || selectedLog.type === 'เจ้าหน้าที่ลงบันทึกแทน' ? (
                          <>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 10, backgroundColor: '#e8f5e9', padding: 4 }}>ข้อมูลกิจกรรม</Text>
                            {renderReportRow('วันที่ปฏิบัติงาน', selectedLog.date, () => confirmDeleteActivityField(selectedLog.id, 'date', 'วันที่ปฏิบัติงาน'))}
                            {renderReportRow('แปลงที่ทำ', selectedLog.plot, () => confirmDeleteActivityField(selectedLog.id, 'plot', 'แปลงที่ทำ'))}
                            {renderReportRow('กิจกรรมหลัก', selectedLog.activity, () => confirmDeleteActivityField(selectedLog.id, 'activity', 'กิจกรรมหลัก'))}
                            {renderReportRow('รายละเอียดกิจกรรม', selectedLog.activityNote, () => confirmDeleteActivityField(selectedLog.id, 'activityNote', 'รายละเอียดกิจกรรม'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 10, backgroundColor: '#e8f5e9', padding: 4 }}>ปัจจัยที่ใช้ & แหล่งน้ำ</Text>
                            {renderReportRow('ปุ๋ย/ปัจจัยที่ใช้', selectedLog.input?.type ? `${selectedLog.input.type} (${selectedLog.input.quantity})` : null, () => confirmDeleteActivityField(selectedLog.id, 'input', 'ปุ๋ย/ปัจจัยที่ใช้'))}
                            {renderReportRow('น้ำหมัก/สารทำเอง', selectedLog.selfMade?.formula, () => confirmDeleteActivityField(selectedLog.id, 'selfMade', 'น้ำหมัก/สารทำเอง'))}
                            {renderReportRow('แหล่งน้ำ', selectedLog.water?.source, () => confirmDeleteActivityField(selectedLog.id, 'water', 'แหล่งน้ำ'))}
                            
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32', marginTop: 10, backgroundColor: '#e8f5e9', padding: 4 }}>แรงงาน</Text>
                            {renderReportRow('ประเภทแรงงาน', selectedLog.worker, () => confirmDeleteActivityField(selectedLog.id, 'worker', 'ประเภทแรงงาน'))}

                            {selectedLog.moisture !== undefined && (
                              <>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0284c7', marginTop: 10, backgroundColor: '#e0f2fe', padding: 4 }}>ข้อมูลความชื้น</Text>
                                {renderReportRow('ความชื้นที่ระบุ', `${selectedLog.moisture} %`, () => confirmDeleteActivityField(selectedLog.id, 'moisture', 'ความชื้น'))}
                              </>
                            )}
                          </>
                        ) : selectedLog.type === 'วัดความชื้น' ? (
                          <>
                            {renderReportRow('ค่าความชื้นที่วัดได้', selectedLog.moisture ? `${selectedLog.moisture} %` : null, () => confirmDeleteActivityField(selectedLog.id, 'moisture', 'ค่าความชื้น'))}
                          </>
                        ) : (
                          <>
                            {renderReportRow('รายละเอียดเพิ่มเติม', selectedLog.summary, () => confirmDeleteActivityField(selectedLog.id, 'summary', 'รายละเอียด'))}
                            {renderReportRow('ความชื้น (ถ้ามี)', selectedLog.moisture ? `${selectedLog.moisture} %` : null, () => confirmDeleteActivityField(selectedLog.id, 'moisture', 'ความชื้น'))}
                          </>
                        )}
                      </>
                    )}

                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[o.bigBtn, { width: '100%', backgroundColor: '#0284c7', marginTop: 15 }]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={o.bigBtnText}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
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

  lastLogBox: { backgroundColor: '#f1f8e9', padding: 8, borderRadius: 6, marginTop: 2 },
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

  bigBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 8,
    marginBottom: 4,
  },
  customInput: {
    borderColor: '#a5d6a7',
    borderWidth: 1,
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
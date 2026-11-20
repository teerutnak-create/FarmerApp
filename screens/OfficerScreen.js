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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USERS } from '../data/users';
import * as ImagePicker from 'expo-image-picker';
import DailyLogScreen from './DailyLogScreen';
import { SharedBottomNav, SharedTabContent } from './SharedBottomTabs';
import {
  FARMER_LOCATIONS_KEY,
  FARMER_VISITS_KEY,
  hasValidGpsCoordinates,
} from '../utils/farmerMapData';

const USERS_KEY = 'registered_users';

const FALLBACK_WEB_URL = 'https://farmerapp-ashy.vercel.app/'; // แก้เป็นลิงก์ Vercel จริงของคุณถ้าเทสบนมือถือ

const TESTER_FARMER = {
  id: 'FRM-TESTER-01',
  name: 'ป้าเทสเตอร์',
  login: '089-999-1010',
  dob: '15/05/2508',
  age: 61,
  role: 'farmer',
};

const TESTER_10_DAYS_LOGS = [
  { id: 'tester-log-10', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '20/11/2569', time: '2026-11-20T08:30:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ตรวจเช็กความชื้นก่อนเก็บเกี่ยว', activityNote: 'เมล็ดข้าวสุกเหลืองสม่ำเสมอเกิน 85% พร้อมเก็บเกี่ยว', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'ระบายน้ำออกแห้งสนิทแล้ว' }, worker: 'แรงงานในครัวเรือน (2 คน)', moisture: 14.5, summary: 'ตรวจเช็กความชื้นก่อนเก็บเกี่ยว (14.5%)' },
  { id: 'tester-log-09', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '19/11/2569', time: '2026-11-19T08:15:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ตรวจแปลงและสุ่มตรวจโรคพืชด้วย AI', activityNote: 'ไม่พบอาการโรคไหม้และใบจุด ต้นข้าวสมบูรณ์', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'แปลงแห้งพร้อมเกี่ยว' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 15.2, summary: 'สุ่มตรวจโรคพืชด้วย AI ไม่พบโรค' },
  { id: 'tester-log-08', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '18/11/2569', time: '2026-11-18T09:00:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'จัดเตรียมลานตากและกระสอบสะอาด', activityNote: 'ทำความสะอาดผ้าใบและภาชนะบรรจุตาม GAP หมวด 5', input: { notDone: true }, selfMade: { notDone: true }, water: { notDone: true }, worker: 'แรงงานในครัวเรือน (2 คน)', moisture: 16.0, summary: 'ทำความสะอาดลานตากและภาชนะบรรจุ' },
  { id: 'tester-log-07', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '17/11/2569', time: '2026-11-17T07:45:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ระบายน้ำออกจากแปลงก่อนเกี่ยว', activityNote: 'เปิดคันนาระบายน้ำออกเพื่อให้พื้นดินแห้ง', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'ระบายน้ำลงคลองไส้ไก่' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 22.4, summary: 'ระบายน้ำออกจากแปลงก่อนเก็บเกี่ยว' },
  { id: 'tester-log-06', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '16/11/2569', time: '2026-11-16T08:00:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ถอนวัชพืชและข้าวปนรอบคันนา', activityNote: 'กำจัดหญ้าข้าวนกและตัดข้าวพันธุ์ปน', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'น้ำในแปลงระดับต่ำ' }, worker: 'แรงงานในครัวเรือน (3 คน)', moisture: 48.0, summary: 'ถอนวัชพืชและข้าวพันธุ์ปน' },
  { id: 'tester-log-05', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '15/11/2569', time: '2026-11-15T07:30:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ฉีดพ่นน้ำหมักชีวภาพบำรุงรวง', activityNote: 'ฉีดพ่นช่วงเช้าตอนแดดอ่อน ช่วยให้เมล็ดเต่ง', input: { notDone: true }, selfMade: { formula: 'น้ำหมักหน่อกล้วย + ฮอร์โมนไข่' }, water: { source: 'สระน้ำในไร่นา' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 62.5, summary: 'ฉีดพ่นน้ำหมักชีวภาพบำรุงรวง' },
  { id: 'tester-log-04', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '14/11/2569', time: '2026-11-14T08:20:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'สำรวจแมลงศัตรูพืช 5 จุดทั่วแปลง', activityNote: 'ไม่พบการระบาดของเพลี้ยกระโดดสีน้ำตาล', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'น้ำขังระดับปกติ 5 ซม.' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 65.0, summary: 'สำรวจแมลงศัตรูพืช ไม่พบการระบาด' },
  { id: 'tester-log-03', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '13/11/2569', time: '2026-11-13T09:10:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ตรวจเช็กความสะอาดแหล่งน้ำและโรงเก็บ', activityNote: 'แหล่งน้ำสะอาด ไม่มีสารปนเปื้อน', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'คลองชลประทาน ต.ผักไหม' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 67.8, summary: 'ตรวจเช็กความสะอาดแหล่งน้ำ' },
  { id: 'tester-log-02', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '12/11/2569', time: '2026-11-12T08:00:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'ใส่ปุ๋ยอินทรีย์เสริมระยะข้าวตั้งท้อง', activityNote: 'หว่านปุ๋ยอินทรีย์อัดเม็ดบริเวณที่ต้นข้าวสีอ่อน', input: { type: 'ปุ๋ยอินทรีย์อัดเม็ด', quantity: '15 กก./ไร่' }, selfMade: { notDone: true }, water: { source: 'น้ำขังระดับปกติ 5 ซม.' }, worker: 'แรงงานในครัวเรือน (2 คน)', moisture: 69.2, summary: 'ใส่ปุ๋ยอินทรีย์อัดเม็ด 15 กก./ไร่' },
  { id: 'tester-log-01', farmerId: 'FRM-TESTER-01', category: 'ACTIVITY', type: 'บันทึกกิจกรรมประจำวัน', date: '11/11/2569', time: '2026-11-11T08:00:00.000Z', plot: 'แปลง A1 (ข้าวหอมมะลิ 105)', activity: 'วัดความชื้นดินและบันทึกสภาพอากาศ', activityNote: 'อากาศแจ่มใส ความชื้นดินเหมาะสม', input: { notDone: true }, selfMade: { notDone: true }, water: { source: 'สระน้ำในไร่นา' }, worker: 'แรงงานในครัวเรือน (1 คน)', moisture: 70.1, summary: 'วัดความชื้นดิน (70.1%)' },
];

const SAMPLE_MAP_FARMERS = [
  {
    farmer: { id: 'sample-sommai', name: 'ลุงสมหมาย', isSample: true },
    location: { lat: 14.874314, lng: 103.839757 },
  },
  {
    farmer: { id: 'sample-somsri', name: 'ป้าสมศรี', isSample: true },
    location: { lat: 14.876, lng: 103.842 },
  },
  {
    farmer: { id: 'sample-boonmee', name: 'ลุงบุญมี', isSample: true },
    location: { lat: 14.8722, lng: 103.8375 },
  },
];

const AUDIT_MODULES = [
  {
    key: 'gap',
    icon: '📋',
    title: 'ประเมินมาตรฐาน GAP',
    subtitle: 'ตรวจเช็ก 5 หมวดมาตรฐาน & ออกรหัสล็อต QR',
    badgeBg: '#dcfce7',
    accent: '#15803d',
  },
  {
    key: 'gis',
    icon: '🗺️',
    title: 'แผนที่ GIS & GPS Polygon',
    subtitle: 'ปักหมุดแปลงและวาดขอบเขตพื้นที่เพาะปลูก',
    badgeBg: '#e0f2fe',
    accent: '#0369a1',
  },
  {
    key: 'ai',
    icon: '🔬',
    title: 'สแกนโรคพืช AI Scanner',
    subtitle: 'วิเคราะห์ภาพใบ/ลำต้นและเก็บประวัติรายแปลง',
    badgeBg: '#fef3c7',
    accent: '#b45309',
  },
  {
    key: 'sensor',
    icon: '📡',
    title: 'IoT & สภาพอากาศเรียลไทม์',
    subtitle: 'ดึงอุณหภูมิ แสงแดด ฝนจริง + ความชื้นดิน',
    badgeBg: '#ede9fe',
    accent: '#6d28d9',
  },
];

function getAgeFromDob(dob) {
  if (typeof dob !== 'string') return null;
  const parts = dob.split('/').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;

  const [day, month, yearBE] = parts;
  const birthDate = new Date(yearBE - 543, month - 1, day);
  if (
    birthDate.getFullYear() !== yearBE - 543 ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
}

function parseStoredObject(raw, key) {
  const parsed = raw ? JSON.parse(raw) : {};
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${key} data must be an object`);
  }
  return parsed;
}

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

export default function OfficerScreen({ user, logs, allUsers, onClear, onLogout, onRefresh, onSaveLogForFarmer, onUpdateLog, onDeleteLog, onDeleteActivityField }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [homeTab, setHomeTab] = useState('all'); // 'all' | 'map' | 'farmers'
  const [bottomTab, setBottomTab] = useState('home');
  const [auditTab, setAuditTab] = useState(null); // null = แสดงเมนูแนวตั้ง 4 รายการก่อนเลือก
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [registeredFarmers, setRegisteredFarmers] = useState([]);
  const [farmLocations, setFarmLocations] = useState({});
  const [fieldVisits, setFieldVisits] = useState({});
  const [selectedMapFarmer, setSelectedMapFarmer] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);
  const [mapFocusVersion, setMapFocusVersion] = useState(0);
  const [savingVisit, setSavingVisit] = useState(false);

  const [targetFarmerForAdd, setTargetFarmerForAdd] = useState(null);
  const [editingLogData, setEditingLogData] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRegisteredFarmers = async () => {
      try {
        const storedUsers = await AsyncStorage.getItem(USERS_KEY);
        if (!storedUsers) return;

        const parsedUsers = JSON.parse(storedUsers);
        if (!Array.isArray(parsedUsers)) {
          throw new Error('Registered users data must be an array');
        }

        const farmers = parsedUsers
          .filter(
            (registeredUser) =>
              registeredUser &&
              registeredUser.role === 'farmer' &&
              registeredUser.id &&
              typeof registeredUser.name === 'string'
          )
          .map((registeredUser) => ({
            id: registeredUser.id,
            name: registeredUser.name,
            login: registeredUser.login || '',
            dob: registeredUser.dob || '',
            age: Number.isFinite(registeredUser.age)
              ? registeredUser.age
              : getAgeFromDob(registeredUser.dob),
            role: 'farmer',
          }));

        if (isMounted) setRegisteredFarmers(farmers);
      } catch (error) {
        console.warn('Unable to load registered farmers:', error);
      }
    };

    loadRegisteredFarmers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStoredObject = async (key, setValue) => {
      try {
        const raw = await AsyncStorage.getItem(key);
        const storedObject = parseStoredObject(raw, key);
        if (isMounted) setValue(storedObject);
      } catch (error) {
        console.warn(`Unable to load ${key}:`, error);
      }
    };

    Promise.all([
      loadStoredObject(FARMER_LOCATIONS_KEY, setFarmLocations),
      loadStoredObject(FARMER_VISITS_KEY, setFieldVisits),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

  const usersById = new Map();
  for (const candidate of [
    TESTER_FARMER, // 🟢 เพิ่มคุณป้าเทสเตอร์
    ...USERS,
    ...(Array.isArray(allUsers) ? allUsers : []),
    ...registeredFarmers,
  ]) {
    if (candidate && candidate.id) usersById.set(candidate.id, candidate);
  }
  const usersForDisplay = Array.from(usersById.values());

  // 🟢 รวมประวัติของป้าเทสเตอร์เข้ากับ logs ปัจจุบัน
  const effectiveLogs = [
    ...(Array.isArray(logs) ? logs : []),
    ...TESTER_10_DAYS_LOGS,
  ];

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
  const [sensorLoading, setSensorLoading] = useState(false);

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
      const farmers = usersForDisplay.filter((u) => u.role === 'farmer');

      const htmlContent = `
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
                ${logs && logs.length > 0 ? logs.map((l) => {
                  const farmer = farmers.find((f) => f.id === l.farmerId);
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
              textDecorationLine: hasValue ? 'none' : 'line-through',
            }}>
              {hasValue ? value : 'ไม่ได้ระบุข้อมูล'}
            </Text>
          </View>

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

  const farmersList = usersForDisplay.filter((u) => u.role === 'farmer');
  const filteredFarmersList = farmersList.filter((farmer) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (farmer.name && farmer.name.toLowerCase().includes(q)) ||
      (farmer.id && farmer.id.toLowerCase().includes(q)) ||
      (farmer.login && farmer.login.toLowerCase().includes(q))
    );
  });

  const latestLocations = { ...farmLocations };
  for (const log of logs || []) {
    if (
      log &&
      log.farmerId &&
      (log.type === 'ถ่ายรูปแปลง' || log.photoUri) &&
      hasValidGpsCoordinates(log.lat, log.lng)
    ) {
      const capturedAt = log.photoTime || log.time;
      const previousTime = Date.parse(latestLocations[log.farmerId]?.capturedAt) || 0;
      const capturedTime = Date.parse(capturedAt) || 0;
      if (previousTime <= capturedTime) {
        latestLocations[log.farmerId] = {
          lat: log.lat,
          lng: log.lng,
          accuracy: log.accuracy,
          plot: log.plot,
          capturedAt,
        };
      }
    }
  }

  const farmersWithLocations = farmersList
    .map((farmer) => ({ farmer, location: latestLocations[farmer.id] }))
    .filter(({ location }) => location && hasValidGpsCoordinates(location.lat, location.lng));
  const mapFarmersWithLocations = [...farmersWithLocations, ...SAMPLE_MAP_FARMERS];
  const sampleFarmerIds = new Set(SAMPLE_MAP_FARMERS.map(({ farmer }) => farmer.id));
  const sampleFarmerNames = new Set(SAMPLE_MAP_FARMERS.map(({ farmer }) => farmer.name));
  const isSampleMapFarmer = (farmer) =>
    farmer.isSample || sampleFarmerIds.has(farmer.id) || sampleFarmerNames.has(farmer.name);
  const farmersWithoutLocations = farmersList.filter((farmer) => {
    if (isSampleMapFarmer(farmer)) return false;
    const location = latestLocations[farmer.id];
    return !location || !hasValidGpsCoordinates(location.lat, location.lng);
  });
  const latitudes = mapFarmersWithLocations.map(({ location }) => location.lat);
  const longitudes = mapFarmersWithLocations.map(({ location }) => location.lng);
  const minLatitude = latitudes.length ? Math.min(...latitudes) : 0;
  const maxLatitude = latitudes.length ? Math.max(...latitudes) : 0;
  const minLongitude = longitudes.length ? Math.min(...longitudes) : 0;
  const maxLongitude = longitudes.length ? Math.max(...longitudes) : 0;
  const mapCenter = {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
  };
  const latitudeDelta = Math.max((maxLatitude - minLatitude) * 1.5, 0.005);
  const longitudeDelta = Math.max((maxLongitude - minLongitude) * 1.5, 0.005);
  const maxCoordinateSpan = Math.max(maxLatitude - minLatitude, maxLongitude - minLongitude, 0.001);
  const mapZoom = Math.min(18, Math.max(3, Math.floor(Math.log2(360 / maxCoordinateSpan)) - 1));
  const mapKey = `${mapFarmersWithLocations
    .map(({ farmer, location }) => `${farmer.id}:${location.lat},${location.lng}`)
    .join('|')}:${mapFocusVersion}`;
  const focusedMapCenter = mapFocus || mapCenter;
  const focusedLatitudeDelta = mapFocus ? 0.008 : latitudeDelta;
  const focusedLongitudeDelta = mapFocus ? 0.008 : longitudeDelta;
  const focusedMapZoom = mapFocus ? 16 : mapZoom;
  const selectedMapLocation = selectedMapFarmer
    ? selectedMapFarmer.isSample
      ? selectedMapFarmer.sampleLocation
      : latestLocations[selectedMapFarmer.id]
    : null;
  const selectedVisit = selectedMapFarmer ? fieldVisits[selectedMapFarmer.id] : null;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSelectMapFarmer = (farmer, location) => {
    setMapFocus({ latitude: location.lat, longitude: location.lng });
    setMapFocusVersion((version) => version + 1);
    setSelectedMapFarmer(
      farmer.isSample ? { ...farmer, sampleLocation: location } : farmer
    );
  };

  const handleMarkVisited = async () => {
    if (!selectedMapFarmer || savingVisit) return;
    setSavingVisit(true);

    try {
      const rawVisits = await AsyncStorage.getItem(FARMER_VISITS_KEY);
      const storedVisits = parseStoredObject(rawVisits, FARMER_VISITS_KEY);
      const visitRecord = {
        visitedAt: new Date().toISOString(),
        visitedBy: user?.name || 'เจ้าหน้าที่',
      };
      const updatedVisits = {
        ...storedVisits,
        [selectedMapFarmer.id]: visitRecord,
      };
      await AsyncStorage.setItem(FARMER_VISITS_KEY, JSON.stringify(updatedVisits));
      setFieldVisits(updatedVisits);
      showAlert('บันทึกสถานะแล้ว', `บันทึกว่าลงพื้นที่ของคุณ${selectedMapFarmer.name}แล้ว`);
    } catch (error) {
      console.error('Saving field visit status failed:', error);
      showAlert('บันทึกไม่สำเร็จ', 'ไม่สามารถบันทึกสถานะลงพื้นที่ได้ กรุณาลองอีกครั้ง');
    } finally {
      setSavingVisit(false);
    }
  };

  const checkFarmerCompleteness = (farmerId) => {
    const farmerLogs = effectiveLogs.filter((l) => l.farmerId === farmerId);

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
    setAuditTab(null); // แสดงเมนูแนวตั้งให้เลือกก่อน
  };

  const handleOpenAddLog = (farmer) => {
    setTargetFarmerForAdd(farmer);
    setEditingLogData(null);
    setCurrentPage('officer_form');
  };

  const handleOpenEditLog = (logItem) => {
    const logOwner = farmersList.find((f) => f.id === logItem.farmerId) || { id: logItem.farmerId, name: logItem.farmerId };
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
        { text: 'ลบทิ้ง', onPress: doDelete, style: 'destructive' },
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
        { text: 'ลบกิจกรรม', onPress: () => { if (onDeleteActivityField) onDeleteActivityField(logId, fieldKey); setShowReportModal(false); }, style: 'destructive' },
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

  const handleConnectBluetooth = async () => {
    setSensorLoading(true);
    try {
      const farmerLoc = selectedFarmer ? latestLocations[selectedFarmer.id] : null;
      const lat = farmerLoc?.lat || 14.8743;
      const lng = farmerLoc?.lng || 103.8397;

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        current: 'temperature_2m,rain',
        hourly: 'shortwave_radiation',
        timezone: 'Asia/Bangkok',
        forecast_days: '1',
      });
      const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const current = data.current || {};
      const temp =
        current.temperature_2m !== undefined
          ? Number(current.temperature_2m).toFixed(1)
          : '--';
      const rain =
        current.rain !== undefined ? Number(current.rain).toFixed(1) : '0.0';

      const currentHour = new Date().getHours();
      const radiation = data.hourly?.shortwave_radiation?.[currentHour] ?? 0;
      const sunlight = Math.round(radiation * 120).toLocaleString();

      setBtConnected(true);
      setSensorData({
        moisture: '68.5',
        temp,
        sunlight,
        rain,
      });

      showAlert(
        'ดึงข้อมูลสำเร็จ 📡',
        `อัปเดตสภาพอากาศจริง (พิกัด ${lat.toFixed(4)}, ${lng.toFixed(4)}) เรียบร้อย`
      );
    } catch (error) {
      console.error('Weather API error:', error);
      showAlert('ดึงข้อมูลไม่สำเร็จ', `ไม่สามารถเชื่อมต่อ Weather API ได้ (${error.message})`);
    } finally {
      setSensorLoading(false);
    }
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
          timestamp: timeString,
        };

        setAiHistory((prevHistory) => {
          const currentFarmerId = selectedFarmer.id;
          const existingHistory = prevHistory[currentFarmerId] || [];
          return {
            ...prevHistory,
            [currentFarmerId]: [newRecord, ...existingHistory],
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
      <StatusBar barStyle="light-content" backgroundColor="#166534" />

      <View style={o.mainLayout}>
        {/* หน้าหลัก */}
        {currentPage === 'home' ? (
          bottomTab !== 'home' ? (
            <SharedTabContent
              activeTab={bottomTab}
              user={user}
              role="officer"
              logs={logs}
              onLogout={onLogout}
            />
          ) : (
            <ScrollView contentContainerStyle={o.minimalScrollContent} showsVerticalScrollIndicator={false}>
              {/* 🟢 ส่วนหัวสีเขียวโค้งมนด้านล่าง (สไตล์รูป 4) + ค้นหา */}
              <View style={o.heroCurveHeader}>
                <View style={o.heroTopBar}>
                  <View style={o.heroBadgeRow}>
                    <Text style={o.heroBadgeText}>🌿 FIELD OFFICER</Text>
                    <View style={o.onlinePill}>
                      <Text style={o.onlinePillText}>● ออนไลน์</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={o.logoutPillBtn} onPress={onLogout}>
                    <Text style={o.logoutPillText}>ออกจากระบบ 🚪</Text>
                  </TouchableOpacity>
                </View>

                <Text style={o.heroTitle}>เจ้าหน้าที่สมศรี</Text>
                <Text style={o.heroSubtitle}>OFF-2026-0089 · Senior GAP Auditor</Text>

                <View style={o.searchBoxMinimal}>
                  <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                  <TextInput
                    style={o.searchInputMinimal}
                    placeholder="ค้นหาชื่อ, รหัส หรือเบอร์เกษตรกร..."
                    placeholderTextColor="#64748b"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* 🟢 การ์ดสรุปและเมนูลัดมินิมอลซ้อนทับด้านล่างส่วนหัว (สไตล์รูป 2 & 4) */}
              <View style={o.floatingSummaryCard}>
                <View style={o.summaryStatsRow}>
                  <View style={o.summaryStatCol}>
                    <Text style={o.summaryStatNum}>{farmersList.length}</Text>
                    <Text style={o.summaryStatLabel}>เกษตรกร</Text>
                  </View>
                  <View style={o.summaryDividerVert} />
                  <View style={o.summaryStatCol}>
                    <Text style={o.summaryStatNum}>{logs ? logs.length : 0}</Text>
                    <Text style={o.summaryStatLabel}>บันทึกรวม</Text>
                  </View>
                  <View style={o.summaryDividerVert} />
                  <View style={o.summaryStatCol}>
                    <Text style={o.summaryStatNum}>{mapFarmersWithLocations.length}</Text>
                    <Text style={o.summaryStatLabel}>พิกัด GPS</Text>
                  </View>
                </View>

                <View style={o.quickActionRow}>
                  {[
                    { key: 'pdf', icon: '📄', label: 'ออก PDF', bg: '#dcfce7', onPress: handleExportPDF },
                    { key: 'manage', icon: '⚙️', label: 'จัดการ', bg: '#e0f2fe', onPress: () => setShowManageModal(true) },
                    { key: 'sync', icon: '🔄', label: 'ซิงก์', bg: '#fef3c7', onPress: onRefresh },
                    { key: 'map', icon: '🗺️', label: homeTab === 'map' ? 'ทั้งหมด' : 'แผนที่', bg: '#ede9fe', onPress: () => setHomeTab(homeTab === 'map' ? 'all' : 'map') },
                  ].map((item) => (
                    <TouchableOpacity key={item.key} style={o.quickActionItem} onPress={item.onPress}>
                      <View style={[o.quickActionIconBox, { backgroundColor: item.bg }]}>
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                      </View>
                      <Text style={o.quickActionLabel} numberOfLines={1}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 🟢 การ์ดแผนที่พิกัดแปลง */}
              {(homeTab === 'all' || homeTab === 'map') && (
                <View style={o.minimalCard}>
                  <View style={o.cardRowBetween}>
                    <View style={o.cardTitleGroup}>
                      <View style={[o.miniIconBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ fontSize: 14 }}>🗺️</Text>
                      </View>
                      <View>
                        <Text style={o.minimalCardTitle}>พิกัดแปลง ต.ผักไหม</Text>
                        <Text style={o.minimalCardSub}>หมุดตัวอย่างไม่ใช่ GPS จริง · กดที่หมุดหรือชื่อเพื่อดู</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[o.mapSimContainer, { marginTop: 10 }]}>
                    {mapFarmersWithLocations.length === 0 ? (
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center', padding: 12 }}>
                        ยังไม่มีรูปถ่ายแปลงที่บันทึกพิกัด GPS
                      </Text>
                    ) : Platform.OS === 'web' ? (
                      <div style={{ height: '100%', width: '100%' }}>
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <MapContainer
                          key={mapKey}
                          center={[focusedMapCenter.latitude, focusedMapCenter.longitude]}
                          zoom={focusedMapZoom}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          {mapFarmersWithLocations.map(({ farmer, location }) => {
                            const isVisited = Boolean(fieldVisits[farmer.id]?.visitedAt);
                            return (
                              <MarkerWeb
                                key={farmer.id}
                                position={[location.lat, location.lng]}
                                title={`${farmer.name} · ${farmer.isSample ? 'พิกัดตัวอย่าง · ' : ''}${isVisited ? 'ลงพื้นที่แล้ว' : 'ยังไม่ลงพื้นที่'}`}
                                eventHandlers={{ click: () => handleSelectMapFarmer(farmer, location) }}
                              />
                            );
                          })}
                        </MapContainer>
                      </div>
                    ) : (
                      <MapView
                        key={mapKey}
                        style={{ flex: 1 }}
                        initialRegion={{
                          ...focusedMapCenter,
                          latitudeDelta: focusedLatitudeDelta,
                          longitudeDelta: focusedLongitudeDelta,
                        }}
                      >
                        {mapFarmersWithLocations.map(({ farmer, location }) => {
                          const isVisited = Boolean(fieldVisits[farmer.id]?.visitedAt);
                          return (
                            <Marker
                              key={farmer.id}
                              coordinate={{ latitude: location.lat, longitude: location.lng }}
                              pinColor={isVisited ? 'green' : farmer.isSample ? 'purple' : 'orange'}
                              title={`คุณ${farmer.name}`}
                              description={`${farmer.isSample ? 'พิกัดตัวอย่าง · ' : ''}${isVisited ? 'ลงพื้นที่แล้ว' : 'ยังไม่ลงพื้นที่'}`}
                              onPress={() => handleSelectMapFarmer(farmer, location)}
                            />
                          );
                        })}
                      </MapView>
                    )}
                  </View>

                  <View style={o.mapLocationNotice}>
                    <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold', marginBottom: 5 }}>
                      รายชื่อที่มีพิกัด (กดเพื่อโฟกัสหมุด):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {mapFarmersWithLocations.map(({ farmer, location }) => (
                        <TouchableOpacity
                          key={farmer.id}
                          style={o.mapLocationTag}
                          onPress={() => handleSelectMapFarmer(farmer, location)}
                        >
                          <Text style={{ fontSize: 10, color: farmer.isSample ? '#4d7c0f' : '#15803d', fontWeight: '600' }}>
                            {farmer.name}: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            {farmer.isSample ? ' (ตัวอย่าง)' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {farmersWithoutLocations.length > 0 && (
                    <View style={[o.mapLocationNotice, { backgroundColor: '#f8fafc' }]}>
                      <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 5 }}>
                        ยังไม่มีพิกัดจากรูปถ่าย GPS:
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                        {farmersWithoutLocations.map((farmer) => (
                          <TouchableOpacity
                            key={farmer.id}
                            style={[o.mapLocationTag, { backgroundColor: '#e2e8f0' }]}
                            onPress={() => setSelectedMapFarmer(farmer)}
                          >
                            <Text style={{ fontSize: 10, color: '#475569' }}>{farmer.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* 🟢 รายชื่อเกษตรกรแบบมินิมอล */}
              {(homeTab === 'all' || homeTab === 'farmers') && (
                <View style={o.minimalCard}>
                  <View style={o.cardRowBetween}>
                    <View style={o.cardTitleGroup}>
                      <View style={[o.miniIconBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ fontSize: 14 }}>👨‍🌾</Text>
                      </View>
                      <View>
                        <Text style={o.minimalCardTitle}>รายชื่อเกษตรกร</Text>
                        <Text style={o.minimalCardSub}>ตรวจสอบความครบถ้วนและลงตรวจแปลง</Text>
                      </View>
                    </View>
                    <View style={o.softGreenPill}>
                      <Text style={o.softGreenPillText}>{filteredFarmersList.length} ราย</Text>
                    </View>
                  </View>

                  {filteredFarmersList.map((farmer) => {
                    const check = checkFarmerCompleteness(farmer.id);
                    const farmerLogs = effectiveLogs.filter((l) => l.farmerId === farmer.id);
                    const recentLogs = farmerLogs.slice(0, 3);

                    return (
                      <View key={farmer.id} style={o.farmerMinimalItem}>
                        <View style={o.cardRowBetween}>
                          <Text style={o.queueCode}>ID: {farmer.id}</Text>
                          <View style={[
                            o.statusChip,
                            { backgroundColor: check.isComplete ? '#dcfce7' : '#fef3c7' },
                          ]}>
                            <Text style={{
                              color: check.isComplete ? '#15803d' : '#b45309',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}>
                              {check.isComplete ? '✓ ครบถ้วน' : '• ยังไม่ครบ'}
                            </Text>
                          </View>
                        </View>

                        <Text style={o.queueName}>คุณ{farmer.name}</Text>
                        <Text style={o.queueDesc}>
                          โทร {farmer.login} · {farmer.age} ปี ({farmer.dob})
                        </Text>

                        <View style={o.checkStatusGroup}>
                          <Text style={[
                            o.checkBadge,
                            {
                              backgroundColor: check.hasActivity ? '#f0fdf4' : '#fef2f2',
                              color: check.hasActivity ? '#15803d' : '#b91c1c',
                            },
                          ]}>
                            {check.hasActivity ? '✓ กิจกรรม' : '✗ ขาดกิจกรรม'}
                          </Text>
                          <Text style={[
                            o.checkBadge,
                            {
                              backgroundColor: check.hasMoisture ? '#f0fdf4' : '#fef2f2',
                              color: check.hasMoisture ? '#15803d' : '#b91c1c',
                            },
                          ]}>
                            {check.hasMoisture ? '✓ ความชื้น' : '✗ ขาดความชื้น'}
                          </Text>
                        </View>

                        {recentLogs.length > 0 && (
                          <View style={{ marginTop: 8, gap: 6 }}>
                            {recentLogs.map((logItem, index) => (
                              <View
                                key={logItem.id || index}
                                style={[o.lastLogBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                              >
                                <View style={{ flex: 1, paddingRight: 6 }}>
                                  <Text style={o.lastLogTitle}>บันทึกล่าสุด ({index + 1})</Text>
                                  <Text style={o.lastLogText}>
                                    {logItem.summary || logItem.activity || (logItem.moisture !== undefined ? `วัดความชื้น (${logItem.moisture}%)` : logItem.type)}
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={o.eyeIconBtn}
                                  onPress={() => {
                                    setSelectedLog({
                                      isCombinedView: false,
                                      farmerName: farmer.name,
                                      time: logItem.time,
                                      ...logItem,
                                      activityLog: logItem,
                                    });
                                    setShowReportModal(true);
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>👁️</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <TouchableOpacity
                            style={[o.pillBtnOutline, { flex: 1 }]}
                            onPress={() => handleOpenAddLog(farmer)}
                          >
                            <Text style={o.pillBtnOutlineText}>✏️ กรอกฟอร์ม</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[o.pillBtnPrimary, { flex: 1 }]}
                            onPress={() => handleSelectFarmer(farmer)}
                          >
                            <Text style={o.pillBtnPrimaryText}>ตรวจประเมิน ➔</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )
        ) : (
          /* 🟢 หน้าลงตรวจแปลง: เมนูแนวตั้ง 4 รายการ (GAP, GIS, AI สแกน, IoT) สไตล์มินิมอลธีมสีเขียว */
          <View style={{ flex: 1, backgroundColor: '#f4f9f5' }}>
            <View style={o.auditTopHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (auditTab) {
                    setAuditTab(null);
                  } else {
                    setCurrentPage('home');
                  }
                }}
                style={o.auditBackPill}
              >
                <Text style={o.auditBackPillText}>
                  {auditTab ? '❮ เลือกหมวด' : '❮ หน้าหลัก'}
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={o.auditHeaderTitle} numberOfLines={1}>
                  ตรวจแปลง · คุณ{selectedFarmer?.name}
                </Text>
                <Text style={o.auditHeaderSub} numberOfLines={1}>
                  ID: {selectedFarmer?.id} · โทร {selectedFarmer?.login || '-'}
                </Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={o.minimalScrollContent} showsVerticalScrollIndicator={false}>
              {/* รายการแนวตั้งให้เลือก 4 หมวด */}
              {!auditTab ? (
                <View style={o.verticalMenuWrapper}>
                  <View style={o.verticalMenuBanner}>
                    <Text style={o.verticalMenuBannerTitle}>เลือกหัวข้อการตรวจประเมิน</Text>
                    <Text style={o.verticalMenuBannerSub}>
                      แตะเลือก 1 รายการด้านล่างเพื่อเปิดเครื่องมือตรวจแปลง
                    </Text>
                  </View>

                  {AUDIT_MODULES.map((mod) => (
                    <TouchableOpacity
                      key={mod.key}
                      activeOpacity={0.82}
                      style={o.verticalMenuCard}
                      onPress={() => setAuditTab(mod.key)}
                    >
                      <View style={[o.verticalMenuIconBox, { backgroundColor: mod.badgeBg }]}>
                        <Text style={{ fontSize: 22 }}>{mod.icon}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={o.verticalMenuTitle}>{mod.title}</Text>
                        <Text style={o.verticalMenuDesc}>{mod.subtitle}</Text>
                      </View>

                      <View style={o.verticalChevronCircle}>
                        <Text style={{ color: mod.accent, fontWeight: 'bold', fontSize: 15 }}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                /* เนื้อหาของหมวดที่เลือก */
                <View style={{ gap: 12 }}>
                  <View style={o.activeModuleStrip}>
                    <Text style={o.activeModuleStripText}>
                      หมวดที่เปิดอยู่: {AUDIT_MODULES.find((m) => m.key === auditTab)?.title}
                    </Text>
                    <TouchableOpacity onPress={() => setAuditTab(null)}>
                      <Text style={o.changeModuleLink}>เปลี่ยนหมวด</Text>
                    </TouchableOpacity>
                  </View>

                  {auditTab === 'gap' && (
                    <View style={o.minimalCard}>
                      <Text style={o.minimalCardTitle}>📋 ประเมินมาตรฐาน GAP · คุณ{selectedFarmer?.name}</Text>
                      <Text style={[o.minimalCardSub, { marginBottom: 10 }]}>
                        เปิด/ปิดสวิตช์ตามผลการตรวจจริงในแปลง
                      </Text>

                      {gapItems.map((item) => (
                        <View key={item.id} style={o.checkRow}>
                          <Switch
                            value={item.checked}
                            onValueChange={() => toggleGap(item.id)}
                            trackColor={{ true: '#16a34a', false: '#cbd5e1' }}
                            thumbColor="#ffffff"
                          />
                          <Text style={{ fontSize: 12, color: '#1e293b', flex: 1, marginLeft: 10, fontWeight: '500' }}>
                            {item.title}
                          </Text>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={[o.pillBtnPrimary, { marginTop: 14, paddingVertical: 12 }]}
                        onPress={handleSubmitAudit}
                      >
                        <Text style={o.pillBtnPrimaryText}>อนุมัติปล่อยล็อตสินค้า & ออก QR ➔</Text>
                      </TouchableOpacity>

                      {lotId !== '' && (() => {
                        const baseUrl =
                          Platform.OS === 'web' && typeof window !== 'undefined'
                            ? window.location.origin
                            : FALLBACK_WEB_URL;
                        const passedCount = gapItems.filter((i) => i.checked).length;
                        const farmerLogsCount = effectiveLogs.filter(
                          (l) => l.farmerId === selectedFarmer?.id
                        ).length;

                        const commonQuery = new URLSearchParams({
                          lot: lotId,
                          farmer: selectedFarmer?.name || 'ป้าเทสเตอร์',
                          farmerId: selectedFarmer?.id || 'FRM-TESTER-01',
                          passed: String(passedCount),
                          total: String(gapItems.length),
                          days: String(farmerLogsCount || 10),
                        }).toString();

                        const certUrl = `${baseUrl}/api/trace?mode=cert&${commonQuery}`;
                        const logsUrl = `${baseUrl}/api/trace?mode=logs&${commonQuery}`;

                        const openTraceUrl = (url) => {
                          if (Platform.OS === 'web') {
                            window.open(url, '_blank');
                          } else {
                            Linking.openURL(url);
                          }
                        };

                        return (
                          <View style={{ marginTop: 14, gap: 12 }}>
                            <View style={o.qrBox}>
                              <Text style={{ fontWeight: 'bold', color: '#15803d', fontSize: 13 }}>
                                🏅 QR 1: ใบรับรองมาตรฐาน GAP
                              </Text>
                              <Text style={{ fontSize: 11, color: '#475569', marginTop: 2, marginBottom: 8 }}>
                                Lot ID: {lotId} · คุณ{selectedFarmer?.name}
                              </Text>
                              <Image
                                source={{
                                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(certUrl)}`,
                                }}
                                style={{ width: 140, height: 140, borderRadius: 10, backgroundColor: '#fff' }}
                              />
                              <TouchableOpacity
                                style={[o.pillBtnOutline, { marginTop: 10, width: '100%' }]}
                                onPress={() => openTraceUrl(certUrl)}
                              >
                                <Text style={o.pillBtnOutlineText}>👁️ เปิดดูหน้าใบรับรอง GAP ↗</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={[o.qrBox, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
                              <Text style={{ fontWeight: 'bold', color: '#0369a1', fontSize: 13 }}>
                                📅 QR 2: ติดตามบันทึกประจำวันย้อนหลัง
                              </Text>
                              <Text style={{ fontSize: 11, color: '#475569', marginTop: 2, marginBottom: 8 }}>
                                สแกนเพื่อเลื่อนดูรายการบันทึก {farmerLogsCount || 10} วันย้อนหลัง
                              </Text>
                              <Image
                                source={{
                                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(logsUrl)}`,
                                }}
                                style={{ width: 140, height: 140, borderRadius: 10, backgroundColor: '#fff' }}
                              />
                              <TouchableOpacity
                                style={[o.pillBtnOutline, { marginTop: 10, width: '100%', borderColor: '#7dd3fc' }]}
                                onPress={() => openTraceUrl(logsUrl)}
                              >
                                <Text style={[o.pillBtnOutlineText, { color: '#0369a1' }]}>
                                  👁️ เปิดดูหน้าประวัติย้อนหลัง ↗
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  {auditTab === 'gis' && (
                    <View style={o.minimalCard}>
                      <Text style={o.minimalCardTitle}>🗺️ ปักหมุด GIS & GPS Polygon</Text>
                      <Text style={[o.minimalCardSub, { marginBottom: 10 }]}>
                        แตะบนแผนที่เพื่อปักหมุดและวาดขอบเขตแปลงเกษตรกร
                      </Text>

                      <View style={{ height: 340, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#dcfce7' }}>
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
                                  positions={polygonPoints.map((p) => [p.latitude, p.longitude])}
                                  pathOptions={{ fillColor: 'rgba(22, 163, 74, 0.35)', color: '#15803d', weight: 3 }}
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
                                fillColor="rgba(22, 163, 74, 0.35)"
                                strokeColor="#15803d"
                                strokeWidth={3}
                              />
                            )}
                          </MapView>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <TouchableOpacity
                          onPress={clearPolygon}
                          style={[o.pillBtnDangerSoft, { flex: 1 }]}
                        >
                          <Text style={o.pillBtnDangerSoftText}>ลบวาดใหม่</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => alert(`บันทึกพิกัดทั้งหมด ${polygonPoints.length} จุดสำเร็จ!`)}
                          style={[o.pillBtnPrimary, { flex: 1 }]}
                        >
                          <Text style={o.pillBtnPrimaryText}>บันทึกพื้นที่แปลง</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {auditTab === 'ai' && (
                    <View style={o.minimalCard}>
                      <Text style={o.minimalCardTitle}>🔬 สแกนโรคพืช AI Scanner</Text>
                      <Text style={[o.minimalCardSub, { marginBottom: 10 }]}>
                        เลือกรูปใบหรือลำต้นเพื่อวิเคราะห์โรคและเก็บประวัติ
                      </Text>

                      <View style={o.scannerBox}>
                        <Text style={{ fontSize: 32, marginBottom: 6 }}>📷</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#166534' }}>
                          ถ่ายหรือเลือกรูปภาพแปลงผักไหม
                        </Text>

                        <TouchableOpacity
                          style={[o.pillBtnPrimary, { marginTop: 12, paddingHorizontal: 20, opacity: aiLoading ? 0.7 : 1 }]}
                          onPress={handleScanAI}
                          disabled={aiLoading}
                        >
                          <Text style={o.pillBtnPrimaryText}>
                            {aiLoading ? 'กำลังวิเคราะห์ด้วย AI...' : 'เริ่มวิเคราะห์ด้วย AI'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {(aiHistory[selectedFarmer?.id] || []).map((item) => (
                        <View key={item.id} style={[o.aiResultBox, { marginTop: 12 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Image source={{ uri: item.image }} style={{ width: 56, height: 56, borderRadius: 10, marginRight: 10 }} />
                            <View>
                              <Text style={{ fontSize: 10, color: '#64748b' }}>เวลาที่สแกน</Text>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>{item.timestamp}</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d' }}>
                            ✓ ผลการวิเคราะห์ AI (ความมั่นใจ {item.result.accuracy})
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#b91c1c', marginTop: 4 }}>
                            ตรวจพบ: {item.result.disease}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
                            คำแนะนำ: {item.result.advice}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {auditTab === 'sensor' && (
                    <View style={o.minimalCard}>
                      <Text style={o.minimalCardTitle}>📡 IoT & สภาพอากาศเรียลไทม์</Text>
                      <Text style={[o.minimalCardSub, { marginBottom: 10 }]}>
                        อุณหภูมิ แสงแดด และฝนดึงจาก Open-Meteo ตามพิกัดแปลง
                      </Text>

                      <View style={o.sensorPanelGreen}>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                          <View style={o.sensorMetricMinimal}>
                            <Text style={o.sensorMetricLabel}>ความชื้นดิน</Text>
                            <Text style={[o.sensorMetricVal, { color: '#bbf7d0' }]}>{sensorData.moisture} %</Text>
                          </View>
                          <View style={o.sensorMetricMinimal}>
                            <Text style={o.sensorMetricLabel}>อุณหภูมิ</Text>
                            <Text style={[o.sensorMetricVal, { color: '#fde68a' }]}>{sensorData.temp} °C</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                          <View style={o.sensorMetricMinimal}>
                            <Text style={o.sensorMetricLabel}>แสงแดด</Text>
                            <Text style={[o.sensorMetricVal, { color: '#bae6fd' }]}>{sensorData.sunlight} lux</Text>
                          </View>
                          <View style={o.sensorMetricMinimal}>
                            <Text style={o.sensorMetricLabel}>ปริมาณน้ำฝน</Text>
                            <Text style={[o.sensorMetricVal, { color: '#ddd6fe' }]}>{sensorData.rain} mm</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[o.pillBtnLightOnGreen, { opacity: sensorLoading ? 0.7 : 1 }]}
                          onPress={handleConnectBluetooth}
                          disabled={sensorLoading}
                        >
                          <Text style={o.pillBtnLightOnGreenText}>
                            {sensorLoading ? '⏳ กำลังดึงข้อมูลอากาศจริง...' : '🌐 ดึงข้อมูลอากาศจริง & เซนเซอร์'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* MODAL: ศูนย์จัดการข้อมูล */}
        <Modal visible={showManageModal} animationType="slide" transparent>
          <View style={o.modalOverlay}>
            <View style={[o.modalCard, { maxHeight: '80%', padding: 0, overflow: 'hidden' }]}>
              <View style={{ backgroundColor: '#f0fdf4', padding: 15, borderBottomWidth: 1, borderBottomColor: '#dcfce7' }}>
                <Text style={[o.modalTitle, { fontSize: 14, color: '#166534' }]}>⚙️ จัดการข้อมูล (เลือกลบหรือแก้ไขประจำวัน)</Text>
              </View>

              <ScrollView style={{ padding: 10 }}>
                {logs && logs.length > 0 ? logs.map((log) => {
                  const logOwner = farmersList.find((u) => u.id === log.farmerId);
                  const ownerName = logOwner ? logOwner.name : log.farmerId;
                  return (
                    <View key={log.id} style={{ backgroundColor: '#ffffff', padding: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#0f172a' }} numberOfLines={1}>
                          คุณ{ownerName} (ID: {log.farmerId})
                        </Text>
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }} numberOfLines={1}>
                          ประเภท: {log.type} {log.activity ? `(${log.activity})` : ''}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                          เวลา: {new Date(log.time).toLocaleString('th-TH')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: '#dcfce7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                          onPress={() => handleOpenEditLog(log)}
                        >
                          <Text style={{ fontSize: 12, color: '#15803d', fontWeight: 'bold' }}>✏️ แก้ไข</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#fee2e2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                          onPress={() => confirmDeleteLog(log.id)}
                        >
                          <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ ลบ</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }) : (
                  <Text style={{ textAlign: 'center', marginVertical: 20, color: '#94a3b8' }}>ยังไม่มีประวัติการบันทึกข้อมูล</Text>
                )}
              </ScrollView>

              <TouchableOpacity style={{ backgroundColor: '#15803d', padding: 14, alignItems: 'center' }} onPress={() => setShowManageModal(false)}>
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
                <Text style={[o.modalTitle, { fontSize: 16 }]}>📄 รายละเอียดบันทึกกิจกรรม</Text>

                {selectedLog?.activityLog && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#dcfce7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}
                      onPress={() => handleOpenEditLog(selectedLog.activityLog)}
                    >
                      <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 'bold' }}>✏️ แก้ไข</Text>
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
                  <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
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
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 6, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ข้อมูลกิจกรรม</Text>
                            {renderReportRow('วันที่ปฏิบัติงาน', selectedLog.activityLog.date, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'date', 'วันที่ปฏิบัติงาน'))}
                            {renderReportRow('แปลงที่ทำ', selectedLog.activityLog.plot, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'plot', 'แปลงที่ทำ'))}
                            {renderReportRow('กิจกรรมหลัก', selectedLog.activityLog.activity, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'activity', 'กิจกรรมหลัก'))}
                            {renderReportRow('รายละเอียดกิจกรรม', selectedLog.activityLog.activityNote, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'activityNote', 'รายละเอียดกิจกรรม'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ปัจจัยที่ใช้ & แหล่งน้ำ</Text>
                            {renderReportRow('ปุ๋ย/ปัจจัยที่ใช้', selectedLog.activityLog.input?.notDone ? 'ไม่ได้ทำ' : selectedLog.activityLog.input?.type ? `${selectedLog.activityLog.input.type} (${selectedLog.activityLog.input.quantity})` : null, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'input', 'ปุ๋ย/ปัจจัยที่ใช้'))}
                            {renderReportRow('น้ำหมัก/สารทำเอง', selectedLog.activityLog.selfMade?.notDone ? 'ไม่ได้ทำ' : selectedLog.activityLog.selfMade?.formula, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'selfMade', 'น้ำหมัก/สารทำเอง'))}
                            {renderReportRow('แหล่งน้ำ', selectedLog.activityLog.water?.notDone ? 'ไม่ได้ทำ' : selectedLog.activityLog.water?.source, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'water', 'แหล่งน้ำ'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>แรงงาน</Text>
                            {renderReportRow('ประเภทแรงงาน', selectedLog.activityLog.workerNotDone ? 'ไม่ได้ทำ' : selectedLog.activityLog.worker, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'worker', 'ประเภทแรงงาน'))}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>กิจกรรมเพิ่มเติม</Text>
                            {renderReportRow('กิจกรรมเพิ่มเติม', selectedLog.activityLog.additionalActivity, () => confirmDeleteActivityField(selectedLog.activityLog.id, 'additionalActivity', 'กิจกรรมเพิ่มเติม'))}
                          </>
                        ) : (
                          <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>ยังไม่มีบันทึกกิจกรรมประจำวัน</Text>
                        )}

                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginTop: 12, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ข้อมูลความชื้น (IoT / Manual)</Text>
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
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ข้อมูลกิจกรรม</Text>
                            {renderReportRow('วันที่ปฏิบัติงาน', selectedLog.date, () => confirmDeleteActivityField(selectedLog.id, 'date', 'วันที่ปฏิบัติงาน'))}
                            {renderReportRow('แปลงที่ทำ', selectedLog.plot, () => confirmDeleteActivityField(selectedLog.id, 'plot', 'แปลงที่ทำ'))}
                            {renderReportRow('กิจกรรมหลัก', selectedLog.activity, () => confirmDeleteActivityField(selectedLog.id, 'activity', 'กิจกรรมหลัก'))}
                            {renderReportRow('รายละเอียดกิจกรรม', selectedLog.activityNote, () => confirmDeleteActivityField(selectedLog.id, 'activityNote', 'รายละเอียดกิจกรรม'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ปัจจัยที่ใช้ & แหล่งน้ำ</Text>
                            {renderReportRow('ปุ๋ย/ปัจจัยที่ใช้', selectedLog.input?.notDone ? 'ไม่ได้ทำ' : selectedLog.input?.type ? `${selectedLog.input.type} (${selectedLog.input.quantity})` : null, () => confirmDeleteActivityField(selectedLog.id, 'input', 'ปุ๋ย/ปัจจัยที่ใช้'))}
                            {renderReportRow('น้ำหมัก/สารทำเอง', selectedLog.selfMade?.notDone ? 'ไม่ได้ทำ' : selectedLog.selfMade?.formula, () => confirmDeleteActivityField(selectedLog.id, 'selfMade', 'น้ำหมัก/สารทำเอง'))}
                            {renderReportRow('แหล่งน้ำ', selectedLog.water?.notDone ? 'ไม่ได้ทำ' : selectedLog.water?.source, () => confirmDeleteActivityField(selectedLog.id, 'water', 'แหล่งน้ำ'))}

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>แรงงาน</Text>
                            {renderReportRow('ประเภทแรงงาน', selectedLog.workerNotDone ? 'ไม่ได้ทำ' : selectedLog.worker, () => confirmDeleteActivityField(selectedLog.id, 'worker', 'ประเภทแรงงาน'))}
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803d', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>กิจกรรมเพิ่มเติม</Text>
                            {renderReportRow('กิจกรรมเพิ่มเติม', selectedLog.additionalActivity, () => confirmDeleteActivityField(selectedLog.id, 'additionalActivity', 'กิจกรรมเพิ่มเติม'))}

                            {selectedLog.moisture !== undefined && (
                              <>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginTop: 10, backgroundColor: '#dcfce7', padding: 4, borderRadius: 4 }}>ข้อมูลความชื้น</Text>
                                {renderReportRow('ความชื้นที่ระบุ', `${selectedLog.moisture} %`, () => confirmDeleteActivityField(selectedLog.id, 'moisture', 'ความชื้น'))}
                              </>
                            )}
                          </>
                        ) : selectedLog.type === 'วัดความชื้น' ? (
                          renderReportRow('ค่าความชื้นที่วัดได้', selectedLog.moisture ? `${selectedLog.moisture} %` : null, () => confirmDeleteActivityField(selectedLog.id, 'moisture', 'ค่าความชื้น'))
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
                style={[o.pillBtnPrimary, { width: '100%', marginTop: 14, paddingVertical: 12 }]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={o.pillBtnPrimaryText}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL: ข้อมูลหมุดแปลงบนแผนที่ */}
        <Modal
          visible={Boolean(selectedMapFarmer)}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedMapFarmer(null)}
        >
          <View style={o.modalOverlay}>
            <View style={[o.modalCard, { maxWidth: 480, maxHeight: '85%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={o.modalTitle}>📍 ข้อมูลแปลงเกษตรกร</Text>
                <TouchableOpacity onPress={() => setSelectedMapFarmer(null)}>
                  <Text style={{ color: '#64748b', fontSize: 20, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>

              {selectedMapFarmer && (
                <ScrollView style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#15803d' }}>
                    คุณ{selectedMapFarmer.name}
                  </Text>
                  {selectedMapFarmer.isSample ? (
                    <Text style={o.queueDesc}>รายการตัวอย่าง — ไม่ใช่ข้อมูลเกษตรกรจริง</Text>
                  ) : (
                    <>
                      <Text style={o.queueDesc}>รหัสเกษตรกร: {selectedMapFarmer.id}</Text>
                      <Text style={o.queueDesc}>เบอร์โทรศัพท์: {selectedMapFarmer.login || '-'}</Text>
                      <Text style={o.queueDesc}>
                        อายุ: {selectedMapFarmer.age ?? '-'} ปี (เกิด {selectedMapFarmer.dob || '-'})
                      </Text>
                    </>
                  )}

                  {selectedMapLocation &&
                  hasValidGpsCoordinates(selectedMapLocation.lat, selectedMapLocation.lng) ? (
                    <View style={o.mapDetailBox}>
                      <Text style={o.mapDetailText}>
                        พิกัด: {selectedMapLocation.lat.toFixed(6)}, {selectedMapLocation.lng.toFixed(6)}
                      </Text>
                      {selectedMapFarmer.isSample && (
                        <Text style={o.mapDetailText}>พิกัดสมมติสำหรับทดสอบ ไม่ใช่ตำแหน่ง GPS จริง</Text>
                      )}
                      {Number.isFinite(selectedMapLocation.accuracy) && (
                        <Text style={o.mapDetailText}>ความคลาดเคลื่อน GPS: ±{Math.round(selectedMapLocation.accuracy)} เมตร</Text>
                      )}
                      {selectedMapLocation.plot ? (
                        <Text style={o.mapDetailText}>แปลง: {selectedMapLocation.plot}</Text>
                      ) : null}
                      {selectedMapLocation.capturedAt ? (
                        <Text style={o.mapDetailText}>
                          ถ่ายภาพเมื่อ: {new Date(selectedMapLocation.capturedAt).toLocaleString('th-TH')}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={o.mapNoLocationText}>
                      ยังไม่มีพิกัดแปลง กรุณาบันทึกรูปถ่ายแปลงขณะเปิด GPS
                    </Text>
                  )}

                  <View style={o.mapDetailBox}>
                    <Text style={o.mapDetailText}>
                      สถานะลงพื้นที่{selectedMapFarmer.isSample ? ' (ข้อมูลตัวอย่าง)' : ''}:{' '}
                      {selectedVisit?.visitedAt ? 'ลงพื้นที่แล้ว' : 'ยังไม่ได้ลงพื้นที่'}
                    </Text>
                    {selectedVisit?.visitedAt ? (
                      <>
                        <Text style={o.mapDetailText}>
                          วันที่: {new Date(selectedVisit.visitedAt).toLocaleString('th-TH')}
                        </Text>
                        <Text style={o.mapDetailText}>เจ้าหน้าที่: {selectedVisit.visitedBy || 'เจ้าหน้าที่'}</Text>
                      </>
                    ) : null}
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                style={[
                  o.pillBtnPrimary,
                  { marginTop: 12, paddingVertical: 12, opacity: savingVisit ? 0.6 : 1 },
                ]}
                onPress={handleMarkVisited}
                disabled={savingVisit}
              >
                <Text style={o.pillBtnPrimaryText}>
                  {savingVisit
                    ? 'กำลังบันทึก...'
                    : selectedVisit?.visitedAt
                      ? 'บันทึกการลงพื้นที่อีกครั้ง'
                      : 'ทำเครื่องหมายว่าลงพื้นที่แล้ว'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[o.pillBtnSecondarySoft, { marginTop: 8, paddingVertical: 11 }]}
                onPress={() => setSelectedMapFarmer(null)}
              >
                <Text style={o.pillBtnSecondarySoftText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {currentPage === 'home' && (
          <SharedBottomNav activeTab={bottomTab} onSelectTab={setBottomTab} unreadCount={2} />
        )}
      </View>
    </SafeAreaView>
  );
}

const o = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  mainLayout: { flex: 1, backgroundColor: '#f4f9f5' },
  minimalScrollContent: { paddingBottom: 32, gap: 14 },

  // ส่วนหัวสีเขียวโค้งมนด้านล่าง (สไตล์รูป 4)
  heroCurveHeader: {
    backgroundColor: '#15803d',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 42,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroBadgeText: { color: '#dcfce7', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  onlinePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  onlinePillText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  logoutPillBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  logoutPillText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  heroSubtitle: { color: '#bbf7d0', fontSize: 12, marginTop: 2, marginBottom: 14 },

  searchBoxMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInputMinimal: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
  },

  // การ์ดสรุปและเมนูลัดมินิมอลซ้อนทับด้านล่างส่วนหัว (สไตล์รูป 2 & 4)
  floatingSummaryCard: {
    marginHorizontal: 14,
    marginTop: -28,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryStatCol: { flex: 1, alignItems: 'center' },
  summaryStatNum: { fontSize: 17, fontWeight: '800', color: '#15803d' },
  summaryStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  summaryDividerVert: { width: 1, height: 28, backgroundColor: '#e2e8f0' },

  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 6,
  },
  quickActionItem: { flex: 1, alignItems: 'center' },
  quickActionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  quickActionLabel: { fontSize: 11, color: '#334155', fontWeight: '600' },

  // การ์ดมินิมอลทั่วไป
  minimalCard: {
    marginHorizontal: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  miniIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalCardTitle: { fontSize: 14, fontWeight: '800', color: '#14532d' },
  minimalCardSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  softGreenPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  softGreenPillText: { color: '#15803d', fontSize: 11, fontWeight: '700' },

  // แผนที่และหมุด
  mapSimContainer: {
    height: 150,
    backgroundColor: '#166534',
    borderRadius: 14,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapLocationNotice: {
    marginTop: 8,
    padding: 9,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  mapLocationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  mapDetailBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  mapDetailText: { fontSize: 12, color: '#334155', marginTop: 3 },
  mapNoLocationText: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: 12,
    fontSize: 12,
  },

  // รายการเกษตรกรแบบมินิมอล
  farmerMinimalItem: {
    backgroundColor: '#fafffb',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  queueCode: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  queueName: { fontSize: 14, fontWeight: '800', color: '#14532d', marginTop: 4 },
  queueDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },

  checkStatusGroup: { flexDirection: 'row', gap: 6, marginTop: 8 },
  checkBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },

  lastLogBox: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  lastLogTitle: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  lastLogText: { fontSize: 11, color: '#1e293b', marginTop: 2 },
  eyeIconBtn: {
    backgroundColor: '#dcfce7',
    padding: 7,
    borderRadius: 10,
  },

  // ปุ่มมินิมอลขอบมน
  pillBtnPrimary: {
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnPrimaryText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },

  pillBtnOutline: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  pillBtnOutlineText: { color: '#15803d', fontWeight: '700', fontSize: 12 },

  pillBtnDangerSoft: {
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnDangerSoftText: { color: '#b91c1c', fontWeight: '700', fontSize: 12 },

  pillBtnSecondarySoft: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnSecondarySoftText: { color: '#475569', fontWeight: '700', fontSize: 12 },

  // หน้าตรวจประเมิน: หัว + เมนูแนวตั้ง 4 รายการ
  auditTopHeader: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  auditBackPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  auditBackPillText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  auditHeaderTitle: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  auditHeaderSub: { color: '#dcfce7', fontSize: 11, marginTop: 1 },

  verticalMenuWrapper: { paddingHorizontal: 14, paddingTop: 4, gap: 10 },
  verticalMenuBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 2,
  },
  verticalMenuBannerTitle: { fontSize: 13, fontWeight: '800', color: '#14532d' },
  verticalMenuBannerSub: { fontSize: 11, color: '#166534', marginTop: 2 },

  verticalMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  verticalMenuIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalMenuTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  verticalMenuDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  verticalChevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeModuleStrip: {
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeModuleStripText: { fontSize: 12, fontWeight: '700', color: '#14532d' },
  changeModuleLink: { fontSize: 12, fontWeight: '800', color: '#15803d', textDecorationLine: 'underline' },

  // GAP, AI, IoT
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrBox: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  scannerBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  aiResultBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 14,
    padding: 12,
  },

  sensorPanelGreen: {
    backgroundColor: '#15803d',
    borderRadius: 16,
    padding: 12,
  },
  sensorMetricMinimal: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  sensorMetricLabel: { color: '#dcfce7', fontSize: 11, fontWeight: '600' },
  sensorMetricVal: { fontSize: 19, fontWeight: '800', marginTop: 3 },
  pillBtnLightOnGreen: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pillBtnLightOnGreenText: { color: '#15803d', fontWeight: '800', fontSize: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    elevation: 5,
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#14532d' },
});
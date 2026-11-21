import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ReadAloudLabel from '../components/ReadAloudLabel';

export default function DailyLogScreen({ onSave, onClose, isOfficer = false, targetFarmer = null, initialData = null }) {
  // 🟢 ธีมสีสลับตาม Role
  const themeBg = isOfficer ? '#f0f9ff' : '#f1f8e9';
  const themePrimary = isOfficer ? '#0284c7' : '#1b5e20';
  const themeSecondary = isOfficer ? '#0ea5e9' : '#16a34a';
  const themeLight = isOfficer ? '#e0f2fe' : '#e8f5e9';
  const themeBorder = isOfficer ? '#bae6fd' : '#c8e6c9';
  const themeActiveBg = isOfficer ? '#e0f2fe' : '#dcfce7';
  const themeActiveBorder = isOfficer ? '#0284c7' : '#16a34a';

  // 1. ระบบเลือก วัน / เดือน / ปี (พ.ศ.) 
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState((today.getFullYear() + 543).toString());

  const [activePickerModal, setActivePickerModal] = useState(null); 

  const monthsList = [
    { id: '1', name: 'มกราคม' }, { id: '2', name: 'กุมภาพันธ์' }, { id: '3', name: 'มีนาคม' },
    { id: '4', name: 'เมษายน' }, { id: '5', name: 'พฤษภาคม' }, { id: '6', name: 'มิถุนายน' },
    { id: '7', name: 'กรกฎาคม' }, { id: '8', name: 'สิงหาคม' }, { id: '9', name: 'กันยายน' },
    { id: '10', name: 'ตุลาคม' }, { id: '11', name: 'พฤศจิกายน' }, { id: '12', name: 'ธันวาคม' },
  ];

  const daysList = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const yearsList = [
    (today.getFullYear() + 543).toString(),
    (today.getFullYear() + 543 - 1).toString(),
    (today.getFullYear() + 543 - 2).toString(),
  ];

  // 2. กิจกรรมในแปลง
  const [selectedPlot, setSelectedPlot] = useState('แปลงหลัก');
  const [selectedActivity, setSelectedActivity] = useState('ให้น้ำ');
  const [activityNote, setActivityNote] = useState('');

  // 3. ปัจจัยการผลิตที่ใช้
  const [inputType, setInputType] = useState('ปุ๋ยหมัก');
  const [inputQuantity, setInputQuantity] = useState('1 ถุง/กระสอบ');
  const [inputNote, setInputNote] = useState('');
  const [inputNotDone, setInputNotDone] = useState(false);
  const [inputPhoto, setInputPhoto] = useState(null);

  // 4. น้ำหมัก/สารทำเอง & ขออนุมัติ
  const [selfMadeFormula, setSelfMadeFormula] = useState('น้ำหมักชีวภาพ');
  const [requestIcsApproval, setRequestIcsApproval] = useState(true);
  const [selfMadeNote, setSelfMadeNote] = useState('');
  const [selfMadeNotDone, setSelfMadeNotDone] = useState(false);
  const [selfMadePhoto, setSelfMadePhoto] = useState(null);

  // 5. การจัดการน้ำ
  const [waterSource, setWaterSource] = useState('บ่อน้ำประจำแปลง');
  const [waterLevel, setWaterLevel] = useState('ปกติ');
  const [waterNote, setWaterNote] = useState('');
  const [waterNotDone, setWaterNotDone] = useState(false);
  const [waterPhoto, setWaterPhoto] = useState(null);

  // 6. แรงงาน
  const [workerType, setWorkerType] = useState('ทำเองในครัวเรือน');
  const [workerNote, setWorkerNote] = useState('');
  const [workerNotDone, setWorkerNotDone] = useState(false);
  const [workerPhoto, setWorkerPhoto] = useState(null);

  const [additionalActivity, setAdditionalActivity] = useState('');
  const [additionalActivityPhoto, setAdditionalActivityPhoto] = useState(null);

  // 7. ความชื้น
  const [moistureValue, setMoistureValue] = useState('');
  const [moisturePhoto, setMoisturePhoto] = useState(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.date) {
        const parts = initialData.date.split('/');
        if (parts.length === 3) {
          setDay(parseInt(parts[0], 10).toString());
          setMonth(parseInt(parts[1], 10).toString());
          setYear(parts[2]);
        }
      }
      if (initialData.plot) setSelectedPlot(initialData.plot);
      if (initialData.activity) setSelectedActivity(initialData.activity);
      if (initialData.activityNote) setActivityNote(initialData.activityNote);

      if (initialData.input) {
        if (initialData.input.type) setInputType(initialData.input.type);
        if (initialData.input.quantity) setInputQuantity(initialData.input.quantity);
        if (initialData.input.note) setInputNote(initialData.input.note);
        if (initialData.input.notDone !== undefined) setInputNotDone(initialData.input.notDone);
        if (initialData.input.photoUri) setInputPhoto({ uri: initialData.input.photoUri });
      }

      if (initialData.selfMade) {
        if (initialData.selfMade.formula) setSelfMadeFormula(initialData.selfMade.formula);
        if (initialData.selfMade.icsRequested !== undefined) setRequestIcsApproval(initialData.selfMade.icsRequested);
        if (initialData.selfMade.note) setSelfMadeNote(initialData.selfMade.note);
        if (initialData.selfMade.notDone !== undefined) setSelfMadeNotDone(initialData.selfMade.notDone);
        if (initialData.selfMade.photoUri) setSelfMadePhoto({ uri: initialData.selfMade.photoUri });
      }

      if (initialData.water) {
        if (initialData.water.source) setWaterSource(initialData.water.source);
        if (initialData.water.level) setWaterLevel(initialData.water.level);
        if (initialData.water.note) setWaterNote(initialData.water.note);
        if (initialData.water.notDone !== undefined) setWaterNotDone(initialData.water.notDone);
        if (initialData.water.photoUri) setWaterPhoto({ uri: initialData.water.photoUri });
      }

      if (initialData.worker) setWorkerType(initialData.worker);
      if (initialData.workerNote) setWorkerNote(initialData.workerNote);
      if (initialData.workerNotDone !== undefined) setWorkerNotDone(initialData.workerNotDone);
      if (initialData.workerPhotoUri) setWorkerPhoto({ uri: initialData.workerPhotoUri });
      if (initialData.additionalActivity) setAdditionalActivity(initialData.additionalActivity);
      if (initialData.additionalActivityPhotoUri) {
        setAdditionalActivityPhoto({ uri: initialData.additionalActivityPhotoUri });
      }
      if (initialData.moisture !== undefined) setMoistureValue(initialData.moisture.toString());
      if (initialData.moisturePhotoUri) setMoisturePhoto({ uri: initialData.moisturePhotoUri });
    }
  }, [initialData]);

  const showAlert = (title, message, callback) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      if (callback) callback();
    } else {
      Alert.alert(title, message, [{ text: 'ตกลง', onPress: callback }]);
    }
  };

  const takePhoto = async (setPhoto) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert('ต้องอนุญาตใช้กล้อง', 'กรุณาอนุญาตให้แอปใช้กล้องแล้วลองอีกครั้ง');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Capturing daily log photo failed:', error);
      showAlert('ถ่ายรูปไม่สำเร็จ', 'กรุณาลองถ่ายรูปอีกครั้ง');
    }
  };

  const renderPhotoField = (photo, setPhoto, sectionName) => (
    <View style={styles.photoField}>
      <Text style={styles.photoFieldLabel}>รูปประกอบหัวข้อนี้ (ไม่บังคับ)</Text>
      <TouchableOpacity
        style={[styles.photoButton, { backgroundColor: themePrimary }]}
        onPress={() => takePhoto(setPhoto)}
        accessibilityRole="button"
        accessibilityLabel={`ถ่ายรูปประกอบ${sectionName}`}
        activeOpacity={0.8}
      >
        <Text style={styles.photoButtonText}>
          {photo ? '📷 ถ่ายรูปใหม่' : '📷 ถ่ายรูปประกอบ'}
        </Text>
      </TouchableOpacity>
      {photo && (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photoPreview}
            accessibilityLabel={`รูปประกอบ${sectionName}`}
          />
          <TouchableOpacity
            onPress={() => setPhoto(null)}
            accessibilityRole="button"
            accessibilityLabel={`ลบรูปประกอบ${sectionName}`}
            hitSlop={8}
          >
            <Text style={styles.removePhotoText}>ลบรูป</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 🎙️ สถานะการฟังเสียง (เก็บชื่อหมวดที่กำลังฟังอยู่)
  const [listeningSection, setListeningSection] = useState(null);
  const recognitionRef = React.useRef(null);
  const nativeVoiceRef = React.useRef(null);

  useEffect(() => () => {
    if (nativeVoiceRef.current) {
      nativeVoiceRef.current.destroy().catch((error) => {
        console.error('Cleaning up plot voice recognition failed:', error);
      });
      nativeVoiceRef.current = null;
    }
  }, []);

  const handleSpeechToText = (currentText, setTextFunc, sectionName, replaceText = false) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      showAlert('แจ้งเตือน', 'ฟีเจอร์พูดเพื่อพิมพ์ใช้ได้บนเว็บเท่านั้นในตอนนี้');
      return;
    }

    // กดซ้ำขณะกำลังฟัง = หยุดฟัง
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showAlert('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการพูดเพื่อพิมพ์ แนะนำให้ใช้ Google Chrome');
      return;
    }

    const rec = new SR();
    rec.lang = 'th-TH';
    rec.interimResults = replaceText;
    rec.continuous = false;

    rec.onstart = () => setListeningSection(sectionName);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (replaceText) {
        setTextFunc(text);
      } else {
        setTextFunc((prev) => (prev ? `${prev} ${text}` : text));
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showAlert('ไม่ได้รับอนุญาตใช้ไมโครโฟน', 'กรุณาอนุญาตการใช้ไมค์ในเบราว์เซอร์แล้วลองใหม่');
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListeningSection(null);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      recognitionRef.current = null;
      setListeningSection(null);
    }
  };

  const handlePlotVoice = async () => {
    if (Platform.OS === 'web') {
      handleSpeechToText(selectedPlot, setSelectedPlot, 'เลือกแปลง', true);
      return;
    }

    if (listeningSection === 'เลือกแปลง' && nativeVoiceRef.current) {
      try {
        await nativeVoiceRef.current.stop();
      } catch (error) {
        console.error('Stopping plot voice recognition failed:', error);
        showAlert('หยุดฟังไม่สำเร็จ', 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      const available = await Voice.isAvailable();
      if (!available) {
        showAlert('ไม่รองรับการรู้จำเสียง', 'กรุณาตรวจสอบบริการแปลงเสียงเป็นข้อความในอุปกรณ์');
        return;
      }

      Voice.onSpeechResults = (event) => {
        const transcript = event.value?.[0]?.trim();
        if (transcript) setSelectedPlot(transcript);
      };
      Voice.onSpeechPartialResults = (event) => {
        const transcript = event.value?.[0]?.trim();
        if (transcript) setSelectedPlot(transcript);
      };
      Voice.onSpeechEnd = () => setListeningSection(null);
      Voice.onSpeechError = (event) => {
        setListeningSection(null);
        console.error('Plot voice recognition failed:', event.error);
        showAlert('จับเสียงไม่สำเร็จ', 'กรุณาอนุญาตใช้ไมโครโฟนแล้วลองอีกครั้ง');
      };

      setListeningSection('เลือกแปลง');
      await Voice.start('th-TH');
    } catch (error) {
      setListeningSection(null);
      console.error('Starting plot voice recognition failed:', error);
      showAlert('เริ่มฟังเสียงไม่สำเร็จ', 'กรุณาตรวจสอบสิทธิ์ไมโครโฟนแล้วลองอีกครั้ง');
    }
  };

  // 🟢 ฟังก์ชันบันทึกข้อมูล พร้อมแสดงป๊อปอัปแจ้งเตือนและเด้งกลับหน้าหลักทันทีเมื่อกด OK
  const handleSave = () => {
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    const logData = {
      date: formattedDate,
      plot: selectedPlot,
      activity: selectedActivity,
      activityNote,
      input: {
        type: inputType,
        quantity: inputQuantity,
        note: inputNote,
        notDone: inputNotDone,
        photoUri: inputPhoto?.uri,
      },
      selfMade: {
        formula: selfMadeFormula,
        icsRequested: requestIcsApproval,
        note: selfMadeNote,
        notDone: selfMadeNotDone,
        photoUri: selfMadePhoto?.uri,
      },
      water: {
        source: waterSource,
        level: waterLevel,
        note: waterNote,
        notDone: waterNotDone,
        photoUri: waterPhoto?.uri,
      },
      worker: workerType,
      workerNote,
      workerNotDone,
      workerPhotoUri: workerPhoto?.uri,
      additionalActivity,
      additionalActivityPhotoUri: additionalActivityPhoto?.uri,
      moisture: moistureValue ? parseFloat(moistureValue) : undefined,
      moisturePhotoUri: moisturePhoto?.uri,
      category: 'ACTIVITY',
      timestamp: new Date().toISOString(),
    };

    // 1. เซฟข้อมูลลงระบบ
    if (onSave) {
      onSave(initialData ? initialData.type : 'บันทึกกิจกรรมประจำวัน', logData);
    }

    // 2. 🟢 แสดง Pop-up แจ้งเตือน + พอกด OK แล้วจะเรียก onClose() เด้งกลับหน้าหลักทันที!
    showAlert('บันทึกสำเร็จ ✅', `บันทึกข้อมูลวันที่ ${formattedDate} เรียบร้อยแล้ว`, () => {
      if (onClose) onClose();
    });
  };

  const webSelectStyle = {
    width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${themePrimary}`,
    fontSize: '15px', fontWeight: 'bold', backgroundColor: '#ffffff', color: themePrimary,
    boxSizing: 'border-box', outline: 'none', cursor: 'pointer',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* หัวข้อด้านบน */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: themeLight }]}>
            <Text style={[styles.backText, { color: themePrimary }]}>◀ ย้อนกลับ</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: themePrimary }]}>
              {initialData ? '✏️ แก้ไขบันทึกกิจกรรม' : isOfficer ? '📝 ฟอร์มเจ้าหน้าที่ (บันทึกแทน)' : '📝 บันทึกกิจกรรมแปลง'}
            </Text>
            {isOfficer && targetFarmer && (
              <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                กำลังบันทึกข้อมูลให้: คุณ{targetFarmer.name}
              </Text>
            )}
          </View>
        </View>

        {/* 1. เลือก วัน / เดือน / ปี (พ.ศ.) */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="วันที่และกิจกรรมในแปลง ใช้บันทึกวันที่ทำกิจกรรม แปลงที่ทำ และกิจกรรมที่ดำเนินการ"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            📅 1. เลือกวันที่ และ กิจกรรมในแปลง
          </ReadAloudLabel>
          
          <ReadAloudLabel
            text="วันที่บันทึกกิจกรรม ใช้ระบุวัน เดือน และปีพุทธศักราชที่ทำกิจกรรมในแปลง"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            วันที่บันทึกกิจกรรม (วัน / เดือน / ปี พ.ศ.):
          </ReadAloudLabel>
          <View style={styles.dateSelectorRow}>
            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>วัน</Text>
              {Platform.OS === 'web' ? (
                <select value={day} onChange={(e) => setDay(e.target.value)} style={webSelectStyle}>
                  {daysList.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('day')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>{day}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.selectBoxContainer, { flex: 2 }]}>
              <Text style={styles.selectBoxLabel}>เดือน</Text>
              {Platform.OS === 'web' ? (
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={webSelectStyle}>
                  {monthsList.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('month')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>
                    {monthsList.find((item) => item.id === month)?.name || month}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>ปี พ.ศ.</Text>
              {Platform.OS === 'web' ? (
                <select value={year} onChange={(e) => setYear(e.target.value)} style={webSelectStyle}>
                  {yearsList.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('year')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>{year}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ReadAloudLabel
            text="เลือกแปลงที่ทำกิจกรรม เพื่อระบุว่าข้อมูลนี้เป็นของแปลงใด"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            เลือกแปลงของคุณ:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['แปลงหลัก', 'แปลงที่ 2', 'แปลงผักไหม'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.bigChip, selectedPlot === p && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelectedPlot((current) => current === p ? '' : p)}
              >
                <Text style={[styles.bigChipText, selectedPlot === p && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {selectedPlot === p ? `✓ ${p}` : p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.plotVoiceContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.plotVoiceInput}
              placeholder="พิมพ์ชื่อแปลง หรือกดพูดเพื่อเลือกแปลง"
              placeholderTextColor="#9ca3af"
              value={selectedPlot}
              onChangeText={setSelectedPlot}
              accessibilityLabel="ชื่อแปลงนา"
            />
            <TouchableOpacity
              style={[styles.micBtn, { backgroundColor: themePrimary }]}
              onPress={handlePlotVoice}
              accessibilityRole="button"
              accessibilityLabel={listeningSection === 'เลือกแปลง' ? 'หยุดฟังชื่อแปลง' : 'พูดชื่อแปลง'}
              activeOpacity={0.8}
            >
              <Text style={styles.micBtnText}>
                {listeningSection === 'เลือกแปลง' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดชื่อแปลง'}
              </Text>
            </TouchableOpacity>
          </View>

          <ReadAloudLabel
            text="เลือกกิจกรรมที่ทำในแปลงวันนี้ เช่น เตรียมดิน ปลูก ใส่ปุ๋ย กำจัดวัชพืช ให้น้ำ หรือเก็บเกี่ยว"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            วันนี้ทำอะไรในแปลง:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['เตรียมดิน', 'ปลูก', 'ใส่ปุ๋ย', 'กำจัดวัชพืช', 'ให้น้ำ', 'เก็บเกี่ยว'].map((act) => (
              <TouchableOpacity
                key={act}
                style={[styles.bigChip, selectedActivity === act && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelectedActivity((current) => current === act ? '' : act)}
              >
                <Text style={[styles.bigChipText, selectedActivity === act && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {selectedActivity === act ? `✓ ${act}` : act}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="รายละเอียดกิจกรรมเพิ่มเติม ใช้บันทึกข้อมูลที่ต้องการอธิบายเพิ่มจากกิจกรรมที่เลือก"
            color={themePrimary}
            textStyle={[styles.subLabel, { color: themePrimary }]}
            containerStyle={styles.labelRow}
          >
            รายละเอียดกิจกรรมเพิ่มเติม:
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={activityNote}
              onChangeText={setActivityNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(activityNote, setActivityNote, 'กิจกรรม')}>
              <Text style={styles.micBtnText}>{listeningSection === 'กิจกรรม' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. ปัจจัยการผลิตที่ใช้ */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="ปุ๋ยและปัจจัยที่ใช้ ใช้บันทึกชนิดและปริมาณของปุ๋ย เมล็ดพันธุ์ หรือวัสดุที่ใช้ในการเพาะปลูก"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            📦 2. ปุ๋ยและปัจจัยที่ใช้
          </ReadAloudLabel>
          <TouchableOpacity
            style={[
              styles.bigChip,
              inputNotDone && { backgroundColor: '#fff7ed', borderColor: '#f97316' },
            ]}
            onPress={() => setInputNotDone((notDone) => !notDone)}
          >
            <Text style={[styles.bigChipText, inputNotDone && { color: '#c2410c', fontWeight: 'bold' }]}>
              {inputNotDone ? '✓ วันนี้ไม่ได้ทำกิจกรรมนี้' : 'วันนี้ไม่ได้ทำกิจกรรมนี้'}
            </Text>
          </TouchableOpacity>

          {!inputNotDone && (
            <>
          <ReadAloudLabel
            text="ชนิดที่ใช้ เลือกปุ๋ยหรือปัจจัยการผลิตที่ใช้ในแปลง"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            ชนิดที่ใช้:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['ปุ๋ยหมัก', 'แหนแดง', 'น้ำหมักชีวภาพ', 'ปุ๋ยคอก', 'เมล็ดพันธุ์'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.bigChip, inputType === t && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setInputType((current) => current === t ? '' : t)}
              >
                <Text style={[styles.bigChipText, inputType === t && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {inputType === t ? `✓ ${t}` : t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="ปริมาณที่ใช้ เลือกจำนวนหรือปริมาณปัจจัยการผลิตที่ใช้"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            ปริมาณที่ใช้:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['1 ถุง/กระสอบ', '2-3 กระสอบ', '5 กระสอบขึ้นไป', '10-20 ลิตร'].map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.bigChip, inputQuantity === q && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setInputQuantity((current) => current === q ? '' : q)}
              >
                <Text style={[styles.bigChipText, inputQuantity === q && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {inputQuantity === q ? `✓ ${q}` : q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="รายละเอียดปุ๋ยหรือปัจจัยเพิ่มเติม ใช้ระบุข้อมูลเพิ่มเติมของสิ่งที่นำมาใช้"
            color={themePrimary}
            textStyle={[styles.subLabel, { color: themePrimary }]}
            containerStyle={styles.labelRow}
          >
            รายละเอียดปุ๋ย/ปัจจัยเพิ่มเติม:
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={inputNote}
              onChangeText={setInputNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(inputNote, setInputNote, 'ปัจจัยการผลิต')}>
              <Text style={styles.micBtnText}>{listeningSection === 'ปัจจัยการผลิต' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
          {renderPhotoField(inputPhoto, setInputPhoto, 'ปุ๋ยและปัจจัยที่ใช้')}
        </View>

        {/* 3. น้ำหมัก/สารทำเอง & สิทธิ์การขออนุญาต */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="น้ำหมักหรือสารทำเอง ใช้บันทึกสูตรที่ใช้และรายละเอียดของสารที่ทำขึ้นเอง"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            🧪 3. น้ำหมัก / สารทำเอง
          </ReadAloudLabel>
          <TouchableOpacity
            style={[
              styles.bigChip,
              selfMadeNotDone && { backgroundColor: '#fff7ed', borderColor: '#f97316' },
            ]}
            onPress={() => setSelfMadeNotDone((notDone) => !notDone)}
          >
            <Text style={[styles.bigChipText, selfMadeNotDone && { color: '#c2410c', fontWeight: 'bold' }]}>
              {selfMadeNotDone ? '✓ วันนี้ไม่ได้ทำกิจกรรมนี้' : 'วันนี้ไม่ได้ทำกิจกรรมนี้'}
            </Text>
          </TouchableOpacity>
          {!selfMadeNotDone && (
            <>
          <ReadAloudLabel
            text="สูตรน้ำหมักที่ใช้ เลือกสูตรน้ำหมักหรือสารทำเองที่ใช้ในแปลง"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            สูตรน้ำหมักที่ใช้:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['น้ำหมักชีวภาพ', 'น้ำหมักมูลสุกร', 'น้ำหมักเปลือกสับปะรด', 'ฮอร์โมนไข่'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.bigChip, selfMadeFormula === f && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelfMadeFormula((current) => current === f ? '' : f)}
              >
                <Text style={[styles.bigChipText, selfMadeFormula === f && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {selfMadeFormula === f ? `✓ ${f}` : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <ReadAloudLabel
              text="แจ้งขออนุญาตระบบไอซีเอส เปิดใช้เมื่อต้องการส่งคำขออนุมัติสำหรับสูตรน้ำหมักหรือสารทำเอง"
              color={themePrimary}
              textStyle={[styles.switchLabel, { color: themePrimary }]}
              containerStyle={styles.switchLabelRow}
            >
              แจ้งขออนุญาตระบบ ICS
            </ReadAloudLabel>
            <Switch
              value={requestIcsApproval}
              onValueChange={setRequestIcsApproval}
              trackColor={{ true: themeSecondary }}
            />
          </View>

          <ReadAloudLabel
            text="รายละเอียดสูตรน้ำหมักเพิ่มเติม ใช้บันทึกส่วนผสมหรือข้อมูลอื่นของสูตร"
            color={themePrimary}
            textStyle={[styles.subLabel, { color: themePrimary }]}
            containerStyle={styles.labelRow}
          >
            รายละเอียดสูตรน้ำหมักเพิ่มเติม:
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={selfMadeNote}
              onChangeText={setSelfMadeNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(selfMadeNote, setSelfMadeNote, 'น้ำหมักสารทำเอง')}>
              <Text style={styles.micBtnText}>{listeningSection === 'น้ำหมักสารทำเอง' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
          {renderPhotoField(selfMadePhoto, setSelfMadePhoto, 'น้ำหมักหรือสารทำเอง')}
        </View>

        {/* 4. แหล่งน้ำ */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="การจัดการน้ำ ใช้บันทึกแหล่งน้ำ ระดับน้ำ และรายละเอียดการจัดการน้ำในแปลง"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            💧 4. การจัดการน้ำ
          </ReadAloudLabel>
          <TouchableOpacity
            style={[
              styles.bigChip,
              waterNotDone && { backgroundColor: '#fff7ed', borderColor: '#f97316' },
            ]}
            onPress={() => setWaterNotDone((notDone) => !notDone)}
          >
            <Text style={[styles.bigChipText, waterNotDone && { color: '#c2410c', fontWeight: 'bold' }]}>
              {waterNotDone ? '✓ วันนี้ไม่ได้ทำกิจกรรมนี้' : 'วันนี้ไม่ได้ทำกิจกรรมนี้'}
            </Text>
          </TouchableOpacity>

          {!waterNotDone && (
            <>
          <ReadAloudLabel
            text="แหล่งน้ำที่ใช้ เลือกแหล่งน้ำที่นำมาใช้ในแปลง"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            แหล่งน้ำที่ใช้:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['บ่อน้ำประจำแปลง', 'ธนาคารน้ำใต้ดิน', 'ระบบโซลาร์เซลล์', 'น้ำชลประทาน'].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.bigChip, waterSource === w && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWaterSource((current) => current === w ? '' : w)}
              >
                <Text style={[styles.bigChipText, waterSource === w && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {waterSource === w ? `✓ ${w}` : w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="ระดับน้ำในบ่อ เลือกระดับน้ำปัจจุบัน เช่น ปกติ น้ำลดลง หรือแห้งขอด"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            ระดับน้ำในบ่อ:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['ปกติ', 'น้ำลดลง', 'แห้งขอด'].map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.bigChip, waterLevel === l && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWaterLevel((current) => current === l ? '' : l)}
              >
                <Text style={[styles.bigChipText, waterLevel === l && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {waterLevel === l ? `✓ ${l}` : l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="รายละเอียดเรื่องน้ำเพิ่มเติม ใช้บันทึกข้อมูลการจัดการน้ำที่ต้องการอธิบายเพิ่ม"
            color={themePrimary}
            textStyle={[styles.subLabel, { color: themePrimary }]}
            containerStyle={styles.labelRow}
          >
            รายละเอียดเรื่องน้ำเพิ่มเติม:
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={waterNote}
              onChangeText={setWaterNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(waterNote, setWaterNote, 'การจัดการน้ำ')}>
              <Text style={styles.micBtnText}>{listeningSection === 'การจัดการน้ำ' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
          {renderPhotoField(waterPhoto, setWaterPhoto, 'การจัดการน้ำ')}
        </View>

        {/* 5. แรงงาน */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="ผู้ปฏิบัติงานและเครื่องจักร ใช้บันทึกผู้ทำกิจกรรมและรายละเอียดแรงงานหรือเครื่องจักรที่ใช้"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            👨‍🌾 5. ผู้ปฏิบัติงาน & เครื่องจักร
          </ReadAloudLabel>
          <TouchableOpacity
            style={[
              styles.bigChip,
              workerNotDone && { backgroundColor: '#fff7ed', borderColor: '#f97316' },
            ]}
            onPress={() => setWorkerNotDone((notDone) => !notDone)}
          >
            <Text style={[styles.bigChipText, workerNotDone && { color: '#c2410c', fontWeight: 'bold' }]}>
              {workerNotDone ? '✓ วันนี้ไม่ได้ทำกิจกรรมนี้' : 'วันนี้ไม่ได้ทำกิจกรรมนี้'}
            </Text>
          </TouchableOpacity>
          {!workerNotDone && (
            <>
          <ReadAloudLabel
            text="ประเภทผู้ปฏิบัติงาน เลือกว่าเป็นแรงงานในครัวเรือน การจ้างแรงงาน หรือกลุ่มวานแรง"
            color={themePrimary}
            textStyle={styles.label}
            containerStyle={styles.labelRow}
          >
            ประเภทผู้ปฏิบัติงาน:
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {['ทำเองในครัวเรือน', 'จ้างแรงงาน', 'กลุ่มวานแรง'].map((wrk) => (
              <TouchableOpacity
                key={wrk}
                style={[styles.bigChip, workerType === wrk && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWorkerType((current) => current === wrk ? '' : wrk)}
              >
                <Text style={[styles.bigChipText, workerType === wrk && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {workerType === wrk ? `✓ ${wrk}` : wrk}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ReadAloudLabel
            text="รายละเอียดผู้ปฏิบัติงานเพิ่มเติม ใช้ระบุจำนวนแรงงานหรือรายละเอียดอื่นเกี่ยวกับผู้ทำกิจกรรม"
            color={themePrimary}
            textStyle={[styles.subLabel, { color: themePrimary }]}
            containerStyle={styles.labelRow}
          >
            รายละเอียดผู้ปฏิบัติงานเพิ่มเติม:
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={workerNote}
              onChangeText={setWorkerNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(workerNote, setWorkerNote, 'แรงงานเครื่องจักร')}>
              <Text style={styles.micBtnText}>{listeningSection === 'แรงงานเครื่องจักร' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
          {renderPhotoField(workerPhoto, setWorkerPhoto, 'ผู้ปฏิบัติงานและเครื่องจักร')}
        </View>

        {/* 6. กิจกรรมเพิ่มเติม */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="กิจกรรมที่ทำเพิ่มเติม ใช้ระบุกิจกรรมอื่นที่ไม่ได้อยู่ในรายการกิจกรรมข้างต้น"
            color={themePrimary}
            textStyle={[styles.sectionTitle, { color: themePrimary }]}
            containerStyle={styles.sectionTitleRow}
          >
            🌱 6. กิจกรรมที่ทำเพิ่มเติมนอกเหนือจากกิจกรรมข้างต้น
          </ReadAloudLabel>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="ระบุกิจกรรมเพิ่มเติม (ถ้ามี)"
              value={additionalActivity}
              onChangeText={setAdditionalActivity}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(additionalActivity, setAdditionalActivity, 'กิจกรรมเพิ่มเติม')}>
              <Text style={styles.micBtnText}>{listeningSection === 'กิจกรรมเพิ่มเติม' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
          {renderPhotoField(additionalActivityPhoto, setAdditionalActivityPhoto, 'กิจกรรมเพิ่มเติม')}
        </View>

        {/* 7. ความชื้น */}
        {isOfficer && (
          <View style={[styles.card, { borderColor: themeBorder, borderWidth: 2 }]}>
            <ReadAloudLabel
              text="ค่าความชื้น กรอกเปอร์เซ็นต์ความชื้นของข้าวเปลือกเพื่อบันทึกค่าที่วัดได้"
              color={themePrimary}
              textStyle={[styles.sectionTitle, { color: themePrimary }]}
              containerStyle={styles.sectionTitleRow}
            >
              💧 7. ระบุค่าความชื้น
            </ReadAloudLabel>
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              หากกรอกความชื้นด้วย ระบบจะปลดล็อกสถานะ "วัดความชื้น" ให้เกษตรกรทันที
            </Text>
            <TextInput
              style={[styles.speechInput, { borderColor: themePrimary, fontWeight: 'bold' }]}
              placeholder="ระบุค่าความชื้น (%) เช่น 14.5"
              keyboardType="numeric"
              value={moistureValue}
              onChangeText={setMoistureValue}
            />
            {renderPhotoField(moisturePhoto, setMoisturePhoto, 'ค่าความชื้น')}
          </View>
        )}

        {/* ปุ่มบันทึก */}
        <TouchableOpacity style={[styles.saveBtnLarge, { backgroundColor: themeSecondary }]} onPress={handleSave}>
          <Text style={styles.saveBtnTextLarge}>
            {initialData ? '💾 บันทึกการแก้ไข' : '💾 กดเพื่อบันทึกข้อมูล'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL เลือกวัน/เดือน/ปี */}
      <Modal visible={activePickerModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: themePrimary }]}>
              {activePickerModal === 'day' && 'เลือกวัน'}
              {activePickerModal === 'month' && 'เลือกเดือน'}
              {activePickerModal === 'year' && 'เลือกปี พ.ศ.'}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
              {activePickerModal === 'day' &&
                daysList.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerItem, day === d && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setDay(d);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, day === d && { color: themePrimary, fontWeight: 'bold' }]}>
                      วันที่ {d}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'month' &&
                monthsList.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pickerItem, month === m.id && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setMonth(m.id);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, month === m.id && { color: themePrimary, fontWeight: 'bold' }]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'year' &&
                yearsList.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerItem, year === y && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setYear(y);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, year === y && { color: themePrimary, fontWeight: 'bold' }]}>
                      พ.ศ. {y}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActivePickerModal(null)}
            >
              <Text style={styles.modalCloseText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  backText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },

  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20' },
  sectionTitleRow: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  labelRow: { marginTop: 10, marginBottom: 6 },
  subLabel: { fontSize: 12, fontWeight: 'bold', color: '#1b5e20' },

  dateSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  selectBoxContainer: { flex: 1 },
  selectBoxLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280', marginBottom: 2 },
  mobileSelectBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  mobileSelectText: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20' },

  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  bigChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  bigChipActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  bigChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  bigChipTextActive: { color: '#15803d', fontWeight: 'bold' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  switchLabel: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20' },
  switchLabelRow: { flex: 1 },

  plotVoiceContainer: {
    marginTop: 8,
    gap: 6,
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  plotVoiceInput: {
    minHeight: 40,
    fontSize: 14,
    color: '#1f2937',
  },
  speechInputContainer: {
    gap: 6,
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  speechInput: {
    fontSize: 13,
    color: '#1f2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  photoField: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  photoFieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  photoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPreview: {
    width: 140,
    height: 105,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  removePhotoText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 'bold',
  },
  micBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  micBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  saveBtnLarge: {
    backgroundColor: '#16a34a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnTextLarge: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '85%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center' },
  pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#dcfce7', borderRadius: 8 },
  pickerItemText: { fontSize: 14, color: '#334155' },
  pickerItemTextActive: { color: '#15803d', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 10, backgroundColor: '#94a3b8', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
});